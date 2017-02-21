function PluginHandler() {
  var pluginPath = '/Library/Application Support/com.bohemiancoding.sketch3/Plugins';
  this.path = utils.path.join(NSHomeDirectory(), pluginPath);
  this.getPluginList(); // cache manifest
}

/**
 * get plugin list
 * @return {Array} plugin list
 */
PluginHandler.prototype.getPluginList = function () {
  var pluginFiles = utils.fs.readSubpaths(this.path);
  var result = [];
  var manifests = {};
  var _self = this;

  utils.array.forEach(pluginFiles, function (item) {
    var target;
    if (/\.sketchplugin\/Contents\/Sketch\/manifest.json$/.test(item)) {
      target = {
        name: item.replace(/([\w\-]*?)(\.sketchplugin)?\/.*$/i, '$1'),
        manifest: utils.path.join(_self.path, item)
      };

      if (!manifests[target.name]) {
        manifests[target.name] = target.manifest;
        result.push(target.name);
      } else if (manifests[target.name] && manifests[target.name].length > target.manifest.length) {
        // override manifest path if some users put multiple plugin files in same path
        manifests[target.name] = target.manifest;
      }
    }
  });

  this.manifests = manifests;

  return result;
};

/**
 * get the path of manifest for specific plugin
 * @param  {String} name plugin name
 * @return {String}      the path of manifest
 */
PluginHandler.prototype.getManifestPathOfPlugin = function (name) {
  return this.manifests[name];
};

/**
 * get manifest for specific plugin
 * @param  {String} name plugin name
 * @return {String}      content of manifest file
 */
PluginHandler.prototype.getManifestOfPlugin = function (name) {
  var confFileData = utils.fs.readFile(this.getManifestPathOfPlugin(name));
  var configurations = utils.JSON.parse(confFileData);

  return configurations;
};

/**
 * get commands of all plugins
 * @return {Array}  command list
 */
PluginHandler.prototype.getCommandsOfAllPlugins = function () {
  var pluginList = this.getPluginList();
  var commandList = [];
  var _self = this;

  utils.array.forEach(pluginList, function (item) {
    var manifest = _self.getManifestOfPlugin(item);
    var menuStr = JSON.stringify((manifest.menu && manifest.menu.items) || '{}');

    commandList.push({
      name: String(item),
      identifier: manifest.identifier,
      commands: utils.array.filter(manifest.commands, function (item) {
        // Only display the commands which belong to the menu items
        return menuStr.indexOf(item.identifier) > -1;
      })
    });
  });

  return commandList;
};

/**
 * set shortcut for plugin
 * @param {String} name        plugin name
 * @param {Object} replacement contains command identifier and replace shortcut
 */
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

/**
 * restore shortcuts from configuration file
 * @param  {Array}  importConf shortcut configurations
 * @return {Array}  failures
 */
PluginHandler.prototype.restoreShortcutsFromConfig = function (importConf) {
  var failures = [];
  var _self = this;
  this.getPluginList(); // cache manifest

  utils.array.forEach(importConf, function (plugin) {
    var manifest;
    var confPath;
    if (_self.manifests[plugin.name]) {
      manifest = _self.getManifestOfPlugin(plugin.name);
      confPath = _self.getManifestPathOfPlugin(plugin.name);

      utils.array.forEach(manifest.commands, function (command) {
        if (plugin.commands[command.identifier]) {
          command.shortcut = plugin.commands[command.identifier];
        } else if (command.shortcut) {
          delete command.shortcut;
        }
      });

      utils.fs.writeFile(confPath, utils.JSON.stringify(manifest));
    } else {
      failures.push(plugin.name);
    }
  });

  return failures;
}
