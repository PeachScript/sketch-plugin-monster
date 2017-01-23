@import 'utils.js';
@import 'MochaJSDelegate.js';

function Panel(context, options, data) {
  var opts = Object.assign({}, {
    x: 0,
    y: 0,
    width: 600,
    height: 480,
    title: context.plugin.name()
  }, options);
  var _self = this;

  opts.url = utils.path.join(context.scriptPath, '../panel/', options.template + '.html');

  // configure the panel
  this.panel = NSPanel.alloc().init();
  this.panel.setFrame_display(NSMakeRect(opts.x, opts.y, opts.width, opts.height + 20), false);
  this.panel.setTitleVisibility(NSWindowTitleHidden);
  this.panel.setTitlebarAppearsTransparent(true);
  this.panel.standardWindowButton(NSWindowCloseButton);
  this.panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
  this.panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
  this.panel.setBackgroundColor(NSColor.colorWithRed_green_blue_alpha(255,255,255, 1));
  this.panel.standardWindowButton(NSWindowCloseButton).setCOSJSTargetFunction(this.close);

  // configure the webView
  this.webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, opts.width, opts.height));

  // add delegate to passing data into webview with MochaJSDelegate
  this.webView.setFrameLoadDelegate_(new MochaJSDelegate({
    'webView:didFinishLoadForFrame:': (function () {
      _self.execute('window.init(' + JSON.stringify(data || {}) + ');');
    })
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
  return this.webView.stringByEvaluatingJavaScriptFromString(jsCode);
};
