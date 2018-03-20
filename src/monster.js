import WebUI from 'sketch-module-web-view';

const webViewPaths = {
  development: {
    manager: 'http://localhost:8080/Sketch/webview/manager.html',
    pills: 'http://localhost:8080/Sketch/webview/pills.html',
  },
  production: {
    manager: './webview/manager.html',
    pills: './webview/pills.html',
  },
};

export function manageShortcuts(context) {
  const options = {
    identifier: 'pluginMonster.manager',
    x: 0,
    y: 0,
    width: 600,
    height: 522,
    onlyShowCloseButton: true,
    frameLoadDelegate: {
      'webView:didFinishLoadForFrame:': function (webView, webFrame) {},
    },
  };

  const webUI = new WebUI(context, webViewPaths[process.env.NODE_ENV].manager, options);

  webUI.panel.setTitlebarAppearsTransparent(true);
}
