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
function searchManifests(basePath = config.paths.plugin, result = {}) {
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

/**
 * sort shortcut keys, eg: "(ctrl) (option) (shift) (cmd) key"
 * @param   {String}  shortcut    original shortcut
 * @return  {String}
 */
function sortShortcut(shortcut = '') {
  // make shortcut style uniform
  let result = shortcut.toLowerCase().replace(/control|alt|command/g, (item) => {
    return {
      control: 'ctrl',
      alt: 'option',
      command: 'cmd',
    }[item];
  });

  if (!/^(ctrl )?(option )?(shift )?(cmd )?\S*$/.test(result)) {
    const fragments = result.split(' ');
    const seats = {
      ctrl: 1,
      option: 2,
      shift: 3,
      cmd: 4,
    };

    result = fragments.reduce((sorted, item) => {
      sorted[(seats[item] || 5) - 1] = `${item} `;

      return sorted;
    }, []).join('').replace(/ $/, '');
  }

  return result;
}

const pluginHandler = {
  manifests: {},
  get() {
    const result = [];

    Object.keys(this.paths).forEach((fsName) => {
      const manifest = this.getMainifest(fsName);
      const menuStr = JSON.stringify((manifest.menu && manifest.menu.items) || '');

      result.push({
        fsName,
        name: manifest.name,
        identifier: manifest.identifier,
        commands: manifest.commands.filter(command => Boolean(command.identifier)).map((command) => {
          return {
            // generate menu path
            name: menuStr.indexOf(command.identifier) > -1 ?
              findMenuPath(manifest.menu.items, command).join(' → ') :
              command.name,
            shortcut: sortShortcut(command.shortcut),
            identifier: command.identifier,
          };
        }),
      });
    });

    return result;
  },
  getMainifest(plugin) {
    let result;

    if (this.manifests[plugin]) {
      // read cache firstly
      result = this.manifests[plugin];
    } else if (this.paths[plugin]) {
      // read manifest file
      const content = safeJSONParser(fs.readFileSync(this.paths[plugin], 'utf8'));

      result = this.manifests[plugin] = content || {
        name: plugin,
        identifier: config.identifiers.parseError,
        commands: [],
      };

      // compatible non-identifier plugin
      result.identifier = result.identifier || result.name;
    } else {
      // report not found
      result = this.manifests[plugin] = {
        name: plugin,
        identifier: config.identifiers.nonexistent,
        commands: [],
      };
    }

    return result;
  },
  updateManifest(fsName, content) {
    const data = JSON.stringify(content, null, 2);

    if (this.paths[fsName]) {
      // update cache
      this.manifests[fsName] = content;
      // update file
      fs.writeFileSync(this.paths[fsName], data);
    }
  },
  updateShortcut(fsName, replacement) {
    const content = this.getMainifest(fsName);
    let isUpdated = false;

    for (let i = 0; i < content.commands.length; i += 1) {
      // search target command
      if (
        content.commands[i].identifier === replacement.identifier &&
        content.commands[i].shortcut !== replacement.shortcut
      ) {
        if (replacement.shortcut) {
          // update shortcut
          content.commands[i].shortcut = replacement.shortcut;
        } else {
          // remove shortcut
          delete content.commands[i].shortcut;
        }

        isUpdated = true;
        break;
      }
    }

    if (isUpdated) {
      // write changes to manifest
      this.updateManifest(fsName, content);
    }
  },
};

// init manifest file paths when read paths property
Object.defineProperty(pluginHandler, 'paths', {
  get() {
    return this.__paths || (this.__paths = searchManifests());
  },
});

export default pluginHandler;
