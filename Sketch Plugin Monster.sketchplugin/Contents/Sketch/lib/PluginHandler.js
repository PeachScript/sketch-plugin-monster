@import 'utils.js';

function PluginHandler() {
  var pluginPath = '/Library/Application Support/com.bohemiancoding.sketch3/Plugins';
  this.path = utils.path.join(NSHomeDirectory(), pluginPath);
  this.getPluginList(); // cache manifest
}

PluginHandler.prototype.getPluginList = function () {
  var pluginFiles = utils.fs.readSubpaths(this.path);
  var result = [];
  var manifests = {};
  var _self = this;

  utils.array.forEach(pluginFiles, function (item) {
    var target;
    if (/manifest.json$/.test(item)) {
      target = {
        name: item.replace(/([\w\-]*?)(\.sketchplugin)?\/.*$/i, '$1'),
        manifest: utils.path.join(_self.path, item)
      };
      result.push(target.name);
      manifests[target.name] = target.manifest;
    }
  });

  this.manifests = manifests;

  return result;
};

PluginHandler.prototype.getManifestPathOfPlugin = function (name) {
  return this.manifests[name];
};

PluginHandler.prototype.getManifestOfPlugin = function (name) {
  var confFileData = utils.fs.readFile(this.getManifestPathOfPlugin(name));
  var configurations = utils.JSON.parse(confFileData);

  return configurations;
};

PluginHandler.prototype.getCommandsOfAllPlugins = function () {
  var pluginList = this.getPluginList();
  var commandList = [];
  var _self = this;

  utils.array.forEach(pluginList, function (item) {
    var manifest = _self.getManifestOfPlugin(item);
    commandList.push({
      name: String(item),
      commands: utils.array.filter(manifest.commands, function (item) {
        return manifest.menu && manifest.menu.items && manifest.menu.items.indexOf(item.identifier) > -1;
      })
    });
  });

  return commandList;
};

PluginHandler.prototype.setShortcutForPlugin = function (name, replacement) {
  var originalConfigurations = this.getManifestOfPlugin(name);
  var confFilePath = this.getManifestPathOfPlugin(name);
  var confFileData;
  var result = false;

  utils.array.forEach(originalConfigurations.commands, function (item, i) {
    if (item.identifier == replacement.identifier) {
      if (replacement.shortcut) {
        // change shortcut
        originalConfigurations.commands[i].shortcut = replacement.shortcut;
      } else {
        // empty shortcut
        delete originalConfigurations.commands[i].shortcut;
      }

      // write configurations
      confFileData = utils.JSON.stringify(originalConfigurations);
      utils.fs.writeFile(confFilePath, confFileData);
      result = true;
    }

    return result;
  });

  return result;
};
