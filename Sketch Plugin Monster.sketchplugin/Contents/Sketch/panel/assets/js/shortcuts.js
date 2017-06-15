var globalNotice = new Notification();
var shortcutsHandler;
var i18n;

/**
 * render plugin list into page
 * @param  {Object} source source data
 */
function renderList(source) {
  var listRender = new TemplateEngine('shortcuts-template');
  var wrapper = document.createElement('div');
  var commands = {};
  var inputs;

  wrapper.id = 'panel-wrapper';
  wrapper.innerHTML = listRender({ plugins: shortcutsHandler.getCommandList(), i18n: i18n });

  // check and display conflicting shortcut key
  inputs = wrapper.getElementsByTagName('input');

  Array.prototype.forEach.call(inputs, function (input) {
    if (input.value) {
      commands[input.value] = typeof(commands[input.value]) === 'number' ?
                              (commands[input.value] + 1) :
                              1;
    }
  });

  Array.prototype.forEach.call(inputs, function (input) {
    var commandWrapper = input.parentNode.parentNode;
    var pluginWrapper = commandWrapper.parentNode.parentNode.parentNode;
    var pluginTitle = pluginWrapper.querySelector('h2');

    if (commands[input.value] > 1) {
      commandWrapper.classList.add('shortcut-conflict');
      pluginWrapper.classList.add('shortcut-conflict');
      pluginWrapper.classList.remove('collapse');
      pluginTitle.setAttribute('data-count', parseInt(pluginTitle.getAttribute('data-count') || 0, 10) + 1);
    }
  });

  // wait for DOM updated
  setTimeout(function () {
    renderConflictMsg();

    // support collapse
    Array.prototype.forEach.call(document.querySelectorAll('.plugin-shortcuts-panel h2'), function (item) {
      var parentPlugin = item.parentNode.cloneNode(true);

      parentPlugin.classList.remove('collapse');
      parentPlugin.style.visibility = 'hidden';
      document.body.appendChild(parentPlugin);
      item.parentNode.style.maxHeight = (parseInt(getComputedStyle(parentPlugin).height) || 0) + 'px';
      parentPlugin.remove();

      item.addEventListener('click', function () {
        this.parentNode.classList.toggle('collapse');
      });
    });
  }, 0);


  // handle shortcut change
  wrapper.addEventListener('keydown', function (ev) {
    if (ev.target.tagName === 'INPUT' && ev.keyCode) {
      var targetKey = source.keyCodes[ev.keyCode];
      var shortcut  = targetKey ? [targetKey] : [];
      var shortcutStr;
      var conflictResult;
      var replacement;

      if (shortcut.length) {
        // handle special keys
        if (ev.metaKey) shortcut.unshift('cmd');
        if (ev.shiftKey) shortcut.unshift('shift');
        if (ev.altKey) shortcut.unshift('option');
        if (ev.ctrlKey) shortcut.unshift('ctrl');

        shortcutStr = shortcut.join(' ');
        conflictResult = shortcutsHandler.checkConflict(shortcutStr);

        if (conflictResult) {
          if (conflictResult.shortcutName !== ev.target.getAttribute('data-command')) {
            // prompt user if this shortcut conflict with Sketch or other plugin
            let msg;

            if (Array.isArray(conflictResult.shortcutName)) {
              // Conflict with mutiple commands
              msg = source.i18n.conflict.replace(/(『|")\${ shortcutName }(』|")/, source.i18n.conflictMulti);
            } else {
              // Conflict with one command
              msg = source.i18n.conflict.replace('${ shortcutName }', conflictResult.shortcutName);
            }

            // Set conflict target
            msg = msg.replace('${ conflictTarget }', conflictResult.name);
            globalNotice.error(msg , 2000);
          } else {
            ev.target.blur();
          }
        } else {
          replacement = {
            plugin: ev.target.getAttribute('data-plugin'),
            identifier: ev.target.getAttribute('data-identifier'),
            shortcut: shortcut.join(' ')
          };

          // update shortcut and review conflict for input
          reviewConflict(ev.target, convertShortcut(shortcutStr));

          // update shortcut
          shortcutsHandler.setShortcutForPlugin(replacement);

          globalNotice.success(source.i18n.success, 1500);
          ev.target.blur();
        }
      } else if (ev.keyCode === 27) {
        ev.target.blur();
      }

      ev.preventDefault();
    }
  });

  // handle clear action
  wrapper.addEventListener('click', function (ev) {
    if (ev.target.tagName === 'BUTTON') {
      shortcutsHandler.clearShortcutForPlugin({
        plugin: ev.target.getAttribute('data-plugin'),
        identifier: ev.target.getAttribute('data-identifier')
      });

      // clear shortcut and review conflict for input
      reviewConflict(ev.target.previousSibling, '');

      globalNotice.success(source.i18n.clear, 1500);
    }
  });

  document.body.appendChild(wrapper);
}

/**
 * set i18n with i18n configurations
 */
function setI18n(i18n) {
  document.querySelector('.btn-filter-reset').innerHTML = i18n.clearFilter;
  document.querySelector('.search-bar-wrapper input[role=search-bar]')
          .setAttribute('placeholder', i18n.searchTips);
  document.querySelector('.empty-tips').innerHTML = i18n.noResultTips;
}

/**
 * convert shortcut to symbols
 * @param  {String} str original shortcut
 * @return {String}     shortcut
 */
function convertShortcut(str) {
  var keys = (str || '').split(' ');
  var mapping = {
    'ctrl': '\u2303',
    'control': '\u2303',
    'alt': '\u2325',
    'option': '\u2325',
    'shift': '\u21E7',
    'cmd': '\u2318',
    'command': '\u2318',
  };

  return keys.map(function (key) {
    return mapping[key] || key;
  }).join('');
}

/**
 * review conflict and update shortcut for input
 * @param  {DOM}    targetInput the input which will update
 * @param  {String} newShortcut updating shortcut
 */
function reviewConflict (targetInput, newShortcut) {
  var inputs;
  var queryStr;
  var plugins = document.querySelectorAll('.plugin-shortcuts-panel.shortcut-conflict');
  var parentRow = targetInput.parentNode.parentNode;

  if (parentRow.classList.contains('shortcut-conflict')) {
    queryStr = '.plugin-shortcuts-panel input[value=' + targetInput.value + ']';
    targetInput.setAttribute('value', newShortcut); // prevent querySelectorAll get error result
    inputs = document.querySelectorAll(queryStr);
    parentRow.classList.remove('shortcut-conflict');

    if (inputs.length === 1) {
      inputs[0].parentNode.parentNode.classList.remove('shortcut-conflict');
    }

    Array.prototype.forEach.call(plugins, function (plugin) {
      var count = plugin.querySelectorAll('.shortcut-conflict').length;
      if (count) {
        plugin.querySelector('h2').setAttribute('data-count', count);
      } else {
        plugin.classList.remove('shortcut-conflict');
      }
    });

    renderConflictMsg();
  } else {
    targetInput.value = newShortcut;
  }
}

/**
 * render conflict message in header
 */
function renderConflictMsg() {
  var conflictCommands = document.querySelectorAll('.plugin-shortcuts-panel .shortcut-conflict input');
  var conflictCount = conflictCommands.length;
  var container = document.querySelector('.conflict-warning');
  var conflictDetails = document.querySelector('.conflict-details');

  if (conflictCount) {
    container.innerHTML = i18n.conflictWarning.replace('${ conflictCount }', conflictCount);
    container.setAttribute('data-count', conflictCount > 99 ? '99+' : conflictCount);
    conflictDetails.innerHTML = Array.prototype.map.call(Array.prototype.reduce.call(conflictCommands, function (r, input, index) {
      if (r[input.value]) {
        r[input.value] ++;
      } else {
        r[input.value] = 1;
        r[index] = input.value;
        r.length ? r.length ++ : (r.length = 1);
      }

      return r;
    }, {}), function (item, i, arr) {
      return ['<li onclick="filterPluginList(\'', item ,'\')"><kbd>', item, '</kbd><span>x', arr[item], '</span></li>'].join('');
    }).join('');
  } else {
    conflictDetails.innerHTML = '';
    container.innerHTML = '';
    filterPluginList();
  }

}

/**
 * filter plugin list and command list
 * @param  {String|undefined} keywords  keywords; exit filter status
 * @param  {String}           type      filter type[shortcut|search]
 */
function filterPluginList(keywords, type) {
  var pluginSearchResults = {};
  var hasResult = false;

  // clear current filter targets
  Array.prototype.forEach.call(document.querySelectorAll('#panel-wrapper .filter-target'), function (item) {
    item.classList.remove('filter-target');
  });
  if (keywords) {
    // find filter targets
    switch (type) {
      case 'search':
        keywords = keywords.toLowerCase();
        Array.prototype.forEach.call(document.querySelectorAll('.plugin-shortcuts-panel td[role=command-name]'), function (command) {
          var row = command.parentNode;
          var commandName = command.innerText.toLowerCase();
          var pluginName = command.getAttribute('data-plugin').toLowerCase();
          var pluginWrapper = row.parentNode.parentNode.parentNode;

          if (commandName.indexOf(keywords) > -1) {
            row.classList.add('filter-target');
            pluginWrapper.classList.add('filter-target'); // plugin
            pluginWrapper.classList.remove('collapse'); // expand command list
            pluginSearchResults[pluginName] = true;
            hasResult = true;
          } else if (pluginName.indexOf(keywords) > -1 && !pluginSearchResults[pluginName]) {
            // collapse plugin list if plugin name is expected but there has no expected commands
            row.classList.add('filter-target');
            pluginWrapper.classList.add('filter-target');
            pluginWrapper.classList.add('collapse');
            hasResult = true;
          }
        });
        break;
      case 'shortcut':
      default:
        Array.prototype.forEach.call(document.querySelectorAll('.plugin-shortcuts-panel input'), function (input) {
          var row = input.parentNode.parentNode;
          if (input.value === keywords) {
            row.classList.add('filter-target');
            row.parentNode.parentNode.parentNode.classList.add('filter-target'); // plugin
            row.parentNode.parentNode.parentNode.classList.remove('collapse');
          }
        });
    }
    document.body.classList.add('filtered');
    if (hasResult) {
      document.body.classList.remove('filtered-empty');
    } else if (type === 'search') {
      document.body.classList.add('filtered-empty');
    }
  } else {
    document.querySelector('.search-bar-wrapper input[role=search-bar]').value = ''; // clear search input
    // expand conflict plugin list
    Array.prototype.forEach.call(document.querySelectorAll('.plugin-shortcuts-panel'), function (item) {
      if (item.classList.contains('shortcut-conflict')) {
        item.classList.remove('collapse');
      } else {
        item.classList.add('collapse');
      }
    });
    document.body.classList.remove('filtered', 'filtered-empty');
  }
}

/**
 * initialize overlay menus
 */
function initOverlayMenus() {
  var menus = document.querySelectorAll('.fixed-overlay-menu');

  Array.prototype.forEach.call(menus, function (menu) {
    var triggerElm = document.querySelector(menu.getAttribute('data-toggle'));

    // wait for DOM updated
    setTimeout(function () {
      var triggerRect = triggerElm.getBoundingClientRect();

      if (menu.className.indexOf('left') > -1) {
        menu.style.left = (triggerRect.left) + 'px';
      }
      if (menu.className.indexOf('right') > -1) {
        menu.style.right = (window.innerWidth - triggerRect.left - triggerRect.width / 2) + 'px';
      }
      if (menu.className.indexOf('top') > -1) {
        menu.style.top = triggerRect.bottom + 'px';
      }
      if (menu.className.indexOf('bottom') > -1) {
        menu.style.bottom = (window.innerHeight - triggerRect.top) + 'px';
      }
    }, 0);

    triggerElm.addEventListener('click', function (ev) {
      var target = document.querySelector('.fixed-overlay-menu.show');
      target && target !== menu && target.classList.remove('show');
      menu.classList.toggle('show');
      ev.stopPropagation();
    });
  });

  document.addEventListener('click', function (ev) {
    var target = document.querySelector('.fixed-overlay-menu.show');
    target && target.classList.remove('show');
  });
}

/**
 * initialize settings menu
 * @param  {Object} commands commands from i18n
 */
function initSettingsMenu(commands) {
  var settingsPresets = ['checkForUpdates', 'linkFeedback'];
  var settingsMenu = document.querySelector('.fixed-overlay-menu[data-toggle=".btn-settings"]');
  var exportImportPresets = ['exportShortcuts', 'importShortcuts'];
  var exportImportMenu = document.querySelector('.fixed-overlay-menu[data-toggle=".btn-export-import"]');
  var settingsResult = '';
  var exportImportResult = '';

  Object.keys(commands).forEach(function (i) {
    if (settingsPresets.indexOf(i) > -1) {
      settingsResult += ['<li onclick="$dispatch(\'$pluginMonster:', i, '\')">', commands[i], '</li>'].join('');
    } else if (exportImportPresets.indexOf(i) > -1) {
      exportImportResult += ['<li onclick="$dispatch(\'$pluginMonster:', i, '\')">', commands[i], '</li>'].join('');
    }
  });

  settingsResult += '<li class="disabled">v0.2.0</li>'

  settingsMenu.innerHTML = settingsResult;
  exportImportMenu.innerHTML = exportImportResult;
}

/**
 * initialize search bar
 */
function initSearchBar() {
  var timer;

  document.querySelector('.search-bar-wrapper input[role=search-bar]').addEventListener('input', function (ev) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      filterPluginList((ev.target.value || '').trim(), 'search');
    }, 300);
  });
}

/**
 * $initialize by CocoaScript
 * @param  {Object} source source data from CocoaScript
 */
function $initialize(source) {
  shortcutsHandler = new ShortcutsHandler(source.shortcuts, source.sketchShortcuts);
  i18n = source.i18n;
  renderList(source);
  setI18n(source.i18n);
  initOverlayMenus();
  initSettingsMenu(source.i18nCommands);
  initSearchBar();
}
