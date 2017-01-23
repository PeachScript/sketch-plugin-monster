@import 'utils.js';

function Panel(context, options) {
  var opts = Object.assign({}, {
    x: 0,
    y: 0,
    width: 600,
    height: 480
  }, options);
  var webView;

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
  webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, opts.width, opts.height));
  webView.setMainFrameURL_(opts.url);
  this.panel.contentView().addSubview(webView);
  this.panel.center();
}

Panel.prototype.close = function () {
  NSApp.stopModal();
};

Panel.prototype.show = function () {
  NSApp.runModalForWindow(this.panel);
};
