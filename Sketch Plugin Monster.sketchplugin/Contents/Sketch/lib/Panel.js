@import 'utils.js';
@import 'MochaJSDelegate.js';

function Panel(options, data, callback) {
  var opts = Object.assign({}, {
    x: 0,
    y: 0,
    width: 600,
    height: 480,
    title: options.context.plugin.name()
  }, options);
  var _self = this;

  opts.url = utils.path.join(options.context.scriptPath.stringByDeletingLastPathComponent(),
                             '/panel',
                             options.template + '.html');

  // configure the panel
  this.panel = NSPanel.alloc().init();
  this.panel.setFrame_display(NSMakeRect(opts.x, opts.y, opts.width, opts.height + 20), false);
  this.panel.setTitle(opts.title);
  this.panel.setTitlebarAppearsTransparent(true);
  this.panel.standardWindowButton(NSWindowCloseButton);
  this.panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
  this.panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
  this.panel.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(255,255,255, 1));
  this.panel.standardWindowButton(NSWindowCloseButton).setCOSJSTargetFunction(this.close);

  // configure the webView
  this.webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, opts.width, opts.height));

  // use MochaJSDelegate to exchange data with webview
  this.webView.setFrameLoadDelegate_(new MochaJSDelegate({
    'webView:didFinishLoadForFrame:': function () {
      // export a function to receive data from webview
      _self.execute((function $dispatch(type, dispatchData) {
        if (dispatchData) {
          window.$dispatchData = encodeURI(JSON.stringify(dispatchData));
        }
        window.location.hash = type;
      }).toString());

      // passing data into webView
      _self.execute('window.$initialize && window.$initialize(' + (data ? JSON.stringify(data) : null) + ');');

    },
    'webView:didChangeLocationWithinPageForFrame:': function () {
      // read data from webView and passing to callback function
      var type = NSURL.URLWithString(_self.webView.mainFrameURL()).fragment();
      var originalData = _self.webView.windowScriptObject().valueForKey("$dispatchData")
      var dispatchData = originalData ? JSON.parse(decodeURI(originalData)) : null;
      callback && callback.call(null, type, dispatchData);
    }
  }).getClassInstance());

  this.webView.setMainFrameURL_(opts.url);
  this.panel.contentView().addSubview(this.webView);
  this.panel.center();
}

Panel.prototype.close = function () {
  NSApp.stopModal();
};

Panel.prototype.show = function () {
  NSApp.runModalForWindow(this.panel);
};

Panel.prototype.execute = function (jsCode) {
  return this.webView.windowScriptObject().evaluateWebScript(jsCode);
};
