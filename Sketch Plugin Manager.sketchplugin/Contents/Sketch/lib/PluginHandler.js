@import 'utils.js';

function PluginHandler() {
  var pluginPath = '/Library/Application Support/com.bohemiancoding.sketch3/Plugins';
  this.path = utils.path.join(NSHomeDirectory(), pluginPath);
}

PluginHandler.prototype.getPluginList = function () {
  return utils.fs.readdir(this.path);
};

PluginHandler.prototype.getManifestPathOfPlugin = function (name) {
  var basicPath = utils.path.join(this.path, name);
  var filesInBasicPath = utils.fs.readdir(basicPath);
  var targetPath;

  utils.array.forEach(filesInBasicPath, function (item) {
    var r = false;

    if (/\.sketchplugin$/.test(item)) {
      targetPath = item;
      r = true;
    }

    return r;
  });

  return utils.path.join(this.path, name, targetPath, '/Contents/Sketch/manifest.json');
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
    commandList.push({
      name: item,
      commands: _self.getManifestOfPlugin(item).commands
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
      originalConfigurations.commands[i].shortcut = replacement.shortcut;

      confFileData = utils.JSON.stringify(originalConfigurations);
      utils.fs.writeFile(confFilePath, confFileData);
      result = true;
    }

    return result;
  });

  return result;
};
