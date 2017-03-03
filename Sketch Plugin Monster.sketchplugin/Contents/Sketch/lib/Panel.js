/**
 * Panel initialize
 * @param {Object}   options  panel configurations
 * @param {Object}   data     passing data for webview
 * @param {Function} callback callback function for webview
 */
function Panel(options, data, callback) {
  var opts = Object.assign({}, {
    x: 0,
    y: 0,
    width: 600,
    height: 480,
    title: options.context.plugin.name()
  }, options);
  var _self = this;
  var bgColor = NSColor.colorWithRed_green_blue_alpha(1, 1, 1, 1);

  opts.url = utils.path.join(options.context.scriptPath.stringByDeletingLastPathComponent(),
                             '/panel',
                             options.template + '.html');

  // configure the panel
  this.panel = NSPanel.alloc().init();
  this.panel.setFrame_display(NSMakeRect(opts.x, opts.y, opts.width, opts.height + 20), false);
  this.panel.setTitle(opts.title);
  this.panel.setTitlebarAppearsTransparent(true);
  this.panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
  this.panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
  this.panel.standardWindowButton(NSWindowCloseButton).setCOSJSTargetFunction(function () { _self.close(); });
  this.panel.contentView().superview().titlebarViewController().view().setBackgroundColor(bgColor);

  // configure the webView
  this.webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, opts.width, opts.height));
  this.webView.wantsLayer = true;
  this.webView.setCornerRadius(5);
  this.webView.setClipsToBounds(true);

  // use MochaJSDelegate to exchange data with webview
  this.webView.setFrameLoadDelegate_(new MochaJSDelegate({
    'webView:didFinishLoadForFrame:': function () {
      // export a function to receive data from webview
      _self.execute((function $dispatch(type, dispatchData) {
        window.$dispatchData = dispatchData ? encodeURI(JSON.stringify(dispatchData)) : null;
        window.location.hash = type;
      }).toString());

      // passing data into webView
      _self.execute('window.$initialize && window.$initialize(' + (data ? JSON.stringify(data) : null) + ');');

    },
    'webView:didChangeLocationWithinPageForFrame:': function () {
      // read data from webView and passing to callback function
      var type = String(NSURL.URLWithString(_self.webView.mainFrameURL()).fragment());
      var originalData;
      var dispatchData;

      if (type && type != '$default') {
        originalData = _self.webView.windowScriptObject().valueForKey("$dispatchData")
        dispatchData = originalData ? utils.JSON.parse(decodeURI(originalData)) : null;
        callback && callback.call(null, type, dispatchData);
        _self.execute('window.location.hash = "$default";');
      }
    }
  }).getClassInstance());

  this.webView.setMainFrameURL_(opts.url);
  this.panel.contentView().addSubview(this.webView);
  this.panel.center();
}

/**
 * close panel
 */
Panel.prototype.close = function () {
  this.panel.orderOut(nil);
  NSApp.stopModal();
};

/**
 * display panel
 */
Panel.prototype.show = function () {
  NSApp.runModalForWindow(this.panel);
};

/**
 * execute JavaScript code
 * @param  {String} jsCode JavaScript code
 * @return {Any}           return value of JavaScript code
 */
Panel.prototype.execute = function (jsCode) {
  return this.webView.windowScriptObject().evaluateWebScript(jsCode);
};
