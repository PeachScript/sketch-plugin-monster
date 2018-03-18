import WebView from 'sketch-module-web-view';

const webViewPaths = {
  development: {
    manager: 'http://localhost:8080/Sketch/webview/manager.html',
    pills: 'http://localhost:8080/Sketch/webview/pills.html'
  },
  production: {
    manager: './webview/manager.html',
    pills: './webview/pills.html'
  }
};

export function manageShortcuts(context) {
  const options = {
    identifier: 'pluginMonster.manager',
    x: 0,
    y: 0,
    width: 600,
    height: 480,
    background: NSColor.whiteColor(),
    onlyShowCloseButton: true,
    title: context.plugin.name(),
    hideTitleBar: false,
    shouldKeepAround: true,
    resizable: false,
    // frameLoadDelegate: {
    //   'webView:didFinishLoadForFrame:': function (webView, webFrame) {
    //     context.document.showMessage('UI loaded!')
    //     WebUI.clean()
    //   }
    // },
    // uiDelegate: {}, // https://developer.apple.com/reference/webkit/webuidelegate?language=objc
    // onPanelClose: function () {
    //   // Stuff
    //   // return `false` to prevent closing the panel
    // }
  }

  const win = new WebView(context, webViewPaths[process.env.NODE_ENV].manager, options);

  win.panel.setTitlebarAppearsTransparent(true);
}
