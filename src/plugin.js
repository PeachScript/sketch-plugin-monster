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
  const files = Array.from(fileManager.contentsOfDirectoryAtPath_error(basePath, null));
  const extReg = /\.sketchplugin$/;

  // parse .sketchplugin file priority, same as Sketch's logic
  files.sort((prev, next) => {
    let r;

    if (extReg.test(prev) && !extReg.test(next)) {
      r = -1;
    } else if (!extReg.test(prev) && extReg.test(next)) {
      r = 1;
    } else {
      r = prev.charCodeAt(0) - next.charCodeAt(0)
    }

    return r;
  }).forEach((item) => {
    const file = String(item);
    const filePath = path.join(basePath, file);
    const expectedPath = path.join(filePath, config.paths.manifest);

    if (extReg.test(file) && fs.existsSync(expectedPath)) {
      result[file.replace(/\.\w+$/, '')] = expectedPath;
    } else if (!/^\./.test(file) && fs.statSync(filePath).isDirectory()) {
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
      const manifest = this.getManifest(fsName);
      const menuStr = JSON.stringify((manifest.menu && manifest.menu.items) || '');
      const converted = {
        fsName,
        name: manifest.name,
        identifier: manifest.identifier,
        commands: manifest.commands.filter((command) => {
          // remove commands that not in the menu
          return command.identifier && menuStr.indexOf(`"${command.identifier}"`) > -1;
        }).map((command) => {
          return {
            // generate menu path
            name: findMenuPath(manifest.menu.items, command).join(' → '),
            shortcut: sortShortcut(command.shortcut),
            identifier: command.identifier,
          };
        }),
      };

      if (converted.commands.length) {
        // filter plugins that has not any valid command
        result.push(converted);
      }
    });

    return result;
  },
  getManifest(plugin) {
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
    const content = this.getManifest(fsName);
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
