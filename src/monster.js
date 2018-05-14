import fs from '@skpm/fs';
import pluginHandler from './plugin';
import BrowserWindow from 'sketch-module-web-view';
import { system, i18n } from './config';
import { setTimeout } from './utils';

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
  const initData = {
    plugins: [],
    lang: system.lang,
  };

  // to fix webview fixed element overflow bug
  browser.webContents.getNativeWebview().wantsLayer = true;

  // configure panel
  panel.setTitlebarAppearsTransparent(true);
  panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
  panel.standardWindowButton(NSWindowZoomButton).setHidden(true);

  // init webview after ready
  browser.on('ready-to-show', () => {
    setTimeout(() => {
      initData.plugins = pluginHandler.get();
      browser.webContents.executeJavaScript(`webviewBroadcaster('$manager:init', ${JSON.stringify(initData)})`);
    }, 100);
  });

  // listen event
  browser.webContents.on('$updateShortcut', (pluginName, replacement) => {
    pluginHandler.updateShortcut(pluginName, replacement);
  });
  browser.webContents.on('$exportShortcuts', (pluginName, replacement) => {
    exportShortcuts();
  });

  // open url
  browser.loadURL(webViewPaths[process.env.NODE_ENV].manager);
}

export function exportShortcuts() {
  const panel = NSSavePanel.savePanel();
  const plugins = pluginHandler.get();
  const output = plugins.map(plugin => ({
    name: plugin.name,
    identifier: plugin.identifier,
    commands: plugin.commands.reduce((result, command) => {
      if (command.shortcut) {
        result[command.identifier] = command.shortcut;
      }

      return result;
    }, {})
  }));

  panel.title = i18n.exportAndImport.exportTitle;
  panel.nameFieldStringValue = 'plugin_monster_export';
  panel.allowedFileTypes = ['json'];
  panel.allowsOtherFileTypes = false;

  if (panel.runModal()) {
    fs.writeFileSync(panel.URL(), JSON.stringify(output, null, 2));
  }
}
