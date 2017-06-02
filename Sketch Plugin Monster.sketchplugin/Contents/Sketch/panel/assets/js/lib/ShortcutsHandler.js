// Shortcuts handler Class
/**
 * ShortcutsHandler initialize
 * @param {Array}   shortcuts       plugins shortcuts
 * @param {Object}  sketchShortcuts sketch shortcuts
 */
function ShortcutsHandler(shortcuts, sketchShortcuts) {
  var keyPriorities = {
    ctrl: 5,
    control: 5,
    option: 4,
    alt: 4,
    shift: 3,
    cmd: 2,
    command: 2
  };

  // sort shortcut keys, eg: "(ctrl) (option) (shift) (cmd) key"
  shortcuts.forEach(function (plugin) {
    plugin.commands.forEach(function (command) {
      var handleShortcut = (command.shortcut || '').trim();

      if (handleShortcut &&
          !/^(ctrl |control )?(option |alt )?(shift )?(cmd |command )?.{1}$/
            .test(handleShortcut)) {
        command.shortcut = handleShortcut.split(' ').sort(function (prev, next) {
          var prevPriority = keyPriorities[prev] || 1;
          var nextPriority = keyPriorities[next] || 1;

          return nextPriority - prevPriority;
        }).join(' ');
      }
    });
  });

  this.raw = shortcuts;
  this.sketchRaw = sketchShortcuts;
}

/**
 * get commands list of all plugins
 * @return {Array} command list
 */
ShortcutsHandler.prototype.getCommandList = function () {
  return this.raw;
};

/**
 * check shortcut conflict
 * @param  {String}           shortcut checked shortcut
 * @return {Object|undefined}          conflicting action or nothing;
 */
ShortcutsHandler.prototype.checkConflict = function (shortcut) {
  var result;
  var i;
  var j;

  if (this.sketchRaw[shortcut]) {
    result = {
      name: 'Sketch',
      shortcutName: this.sketchRaw[shortcut]
    };
  } else {
    for (i = 0; i < this.raw.length; i++) {
      for (j = 0; j < this.raw[i].commands.length; j++) {
        if (this.raw[i].commands[j].shortcut === shortcut) {
          result = {
            name: this.raw[i].name,
            shortcutName: this.raw[i].commands[j].name
          };

          i = this.raw.length;
          break;
        }
      }
    }
  }

  return result;
};

/**
 * set shortcut for plugin
 * @param {Object} replacement contains plugin name, command identifier and shortcut
 */
ShortcutsHandler.prototype.setShortcutForPlugin = function (replacement) {
  var i;
  var j;

  for (i = 0; i < this.raw.length; i++) {
    if (this.raw[i].name === replacement.plugin) {
      for(j = 0; j < this.raw[i].commands.length; j++) {
        if (this.raw[i].commands[j].identifier === replacement.identifier) {
          if (replacement.shortcut) {
            this.raw[i].commands[j].shortcut = replacement.shortcut;
            // save shortcut for plugin
            $dispatch('$pluginShortcut:set', replacement);
          } else {
            delete this.raw[i].commands[j].shortcut;
            // clear shortcut for plugin
            $dispatch('$pluginShortcut:clear', replacement);
          }
          i = this.raw.length;
          break;
        }
      }
    }
  }
};

/**
 * clear shortcut for plugin
 * @param  {Object} replacement contains plugin name and command identifier
 */
ShortcutsHandler.prototype.clearShortcutForPlugin = function (replacement) {
  delete replacement.shortcut;
  this.setShortcutForPlugin(replacement);
};
