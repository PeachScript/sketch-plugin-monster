import fs from '@skpm/fs';
import path from '@skpm/path';
import config from './config';
import { safeJSONParser } from './utils';

const fileManager = NSFileManager.defaultManager();

/**
 * search manifest file recursively
 * @param   {String} basePath   search path
 * @return  {Object}
 */
function searchManifests(basePath, result = {}) {
  const files = fileManager.contentsOfDirectoryAtPath_error(basePath, null);

  Array.prototype.forEach.call(files, (item) => {
    const file = String(item);
    const filePath = path.join(basePath, file);
    const expectedPath = path.join(filePath, config.paths.manifest);

    if (/\.sketchplugin/.test(file) && fs.existsSync(expectedPath)) {
      result[file.replace(/\.\w+$/, '')] = expectedPath;
    } else if (fs.statSync(filePath).isDirectory()) {
      searchManifests(filePath, result);
    }
  });

  return result;
}

/**
 * find menu path in manifest for specific command
 * @param   {Array}   menu      plugin menu configuration of manifest
 * @param   {Object}  command   command configuration of manifest
 * @return  {Array}
 */
function findMenuPath(menu, command) {
  const result = [];

  for (let i = 0; i < menu.length; i += 1) {
    if (menu[i].items) {
      // find sub path if it has items
      const subPath = findMenuPath(menu[i].items, command);

      if (subPath.length) {
        // break if find target item
        result.push(menu[i].title, ...subPath);
        break;
      }
    } else if (menu[i].trim() === command.identifier.trim()) {
      // save command name if find target item
      result.push(command.name);
      break;
    }
  }

  return result;
}

export default {
  manifests: searchManifests(config.paths.plugin),
  get() {
    const result = [];

    Object.keys(this.manifests).forEach((name) => {
      const manifest = this.getMainifest(name);
      const menuStr = JSON.stringify((manifest.menu && manifest.menu.items) || '');

      result.push({
        fsName: name,
        name: manifest.name,
        identifier: manifest.identifier,
        commands: manifest.commands.map((command) => {
          return {
            // generate menu path
            name: menuStr.indexOf(command.identifier) > -1 ?
              findMenuPath(manifest.menu.items, command).join(' → ') :
              command.name,
            identifier: command.identifier,
          };
        }),
      });
    });

    return result;
  },
  getMainifest(plugin) {
    const mainfestPath = this.manifests[plugin];
    let result = {
      name: plugin,
      identifier: config.identifiers.nonexistent,
      commands: [],
    };

    if (mainfestPath) {
      const content = safeJSONParser(fs.readFileSync(mainfestPath, 'utf8'));

      result = content || {
        name: plugin,
        identifier: config.identifiers.parseError,
        commands: [],
      };
    }

    return result;
  },
  updateManifest(name, content) {
    const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    if (this.manifests[name]) {
      fs.writeFileSync(this.manifests[name], data);
    }
  },
  updateShortcut(name, replacement) {
    const content = this.getMainifest(name);

    for (let i = 0; i < content.commands.length; i += 1) {
      // search target command
      if (content.commands[i].identifier === replacement.identifier) {
        if (replacement.shortcut) {
          // update shortcut
          content.commands[i].shortcut = replacement.shortcut;
        } else {
          // remove shortcut
          delete content.commands[i].shortcut;
        }

        break;
      }
    }

    // write changes to mainfest
    this.updateManifest(name, content);
  },
};
