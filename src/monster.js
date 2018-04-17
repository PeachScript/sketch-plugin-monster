import BrowserWindow from 'sketch-module-web-view';

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
  const browser = new BrowserWindow({
    identifier: 'pluginMonster.manager',
    width: 600,
    height: 522,
    minWidth: 600,
    minHeight: 522,
    backgroundColor: '#ffffff',
    alwaysOnTop: true,
  });
  const panel = browser.getNativeWindowHandle();

  // to fix webview fixed element overflow bug
  browser.webContents.getNativeWebview().wantsLayer = true;

  // configure panel
  panel.setTitlebarAppearsTransparent(true);
  panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
  panel.standardWindowButton(NSWindowZoomButton).setHidden(true);

  // open url
  browser.loadURL(webViewPaths[process.env.NODE_ENV].manager);
}
