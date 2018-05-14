import UI from 'sketch/ui';
import fs from '@skpm/fs';
import pluginHandler from './plugin';
import BrowserWindow from 'sketch-module-web-view';
import { system, i18n } from './config';
import { setTimeout, openURL } from './utils';

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
let browser;

export function manageShortcuts(context) {
  browser = new BrowserWindow({
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

  // listen events
  browser.webContents.on('$updateShortcut', (pluginName, replacement) => {
    pluginHandler.updateShortcut(pluginName, replacement);
  });
  browser.webContents.on('$exportShortcuts', () => {
    exportShortcuts();
  });
  browser.webContents.on('$importShortcuts', () => {
    importShortcuts();
  });
  browser.webContents.on('$linkFeedback', () => {
    linkFeedback(context);
  });
  browser.webContents.on('$linkFAQ', () => {
    linkFAQ();
  });
  browser.webContents.on('$openURL', (url) => {
    openURL(url);
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

export function importShortcuts() {
  const panel = NSOpenPanel.openPanel();

  panel.allowedFileTypes = ['json'];
  panel.allowsOtherFileTypes = false;

  // request user select a config file
  if (panel.runModal()) {
    const raw = fs.readFileSync(String(panel.URL()).replace(/^file:\/\//, ''), 'utf8');
    let input;

    try {
      input = JSON.parse(raw);
    } catch (e) {
      UI.message(i18n.exportAndImport.importReadError);
    }

    if (input[0] && input[0].commands) {
      const manifests = Object.keys(pluginHandler.paths).reduce((result, fsName) => {
        const manifest = pluginHandler.getMainifest(fsName);

        // add fsName property for update shortcut
        result[manifest.identifier] = Object.assign({}, manifest, { fsName });
        return result;
      }, {}); // convert to identifier: name from name: path
      const missings = [];

      input.forEach((plugin) => {
        // compatible non-identifier plugin
        const manifest = manifests[plugin.identifier || plugin.name];

        if (manifest) {
          // restore shortcuts if this computer has the plugin installed
          manifest.commands.forEach((command) => {
            pluginHandler.updateShortcut(manifest.fsName, {
              identifier: command.identifier,
              shortcut: plugin.commands[command.identifier],
            });
          });
        } else {
          // save into missing array if cannot found the plugin
          missings.push(plugin.name);
        }
      });

      if (missings.length) {
        // prompt missing plugins for user
        UI.alert(
          'Sketch Plugin Monster',
          i18n.exportAndImport.importPartOfShortcuts + missings.map((item, index) => `  ${index + 1}. ${item}`).join('\n')
        );
      } else {
        UI.message(i18n.exportAndImport.importSuccess);
      }

      // update webview data if webview exists
      if (browser) {
        browser.webContents.executeJavaScript(`webviewBroadcaster('$manager:init', ${JSON.stringify({
          plugins: pluginHandler.get(),
          lang: system.lang,
        })})`);
      }
    } else {
      UI.message(i18n.exportAndImport.importReadError);
    }
  }
}

export function linkFeedback(context) {
  const issueTpl = encodeURIComponent(`
### Version
${context.plugin.version()}

### Sketch version
${UI.version.sketch}

### What is exptected?


### What is actually happening?


### How to repreduce this problem?


### The error log from \`Console.app\` when the problem occurred
<!--

Do not know how to get the error log? Steps: https://github.com/PeachScript/sketch-plugin-monster/blob/master/doc/FAQ.md#how-to-get-the-error-log

-->`);

  openURL('https://github.com/PeachScript/sketch-plugin-monster/issues/new?body=' + issueTpl);
}

export function linkFAQ(context) {
  openURL('https://github.com/PeachScript/sketch-plugin-monster/blob/master/doc/FAQ.md');
}
