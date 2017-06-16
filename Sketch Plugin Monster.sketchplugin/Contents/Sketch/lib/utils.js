var utils = {
  path: {
    join: function () {
      var paths = NSMutableArray.alloc().init();
      for (var i = 0; i < arguments.length; i++) {
        paths.addObject(arguments[i]);
      }
      return NSString.pathWithComponents(paths);
    }
  },
  fs: {
    readdir: function (path) {
      return NSFileManager.defaultManager().contentsOfDirectoryAtPath_error(path, nil);
    },
    readFile: function (path) {
      return NSString.stringWithContentsOfFile_encoding_error(path, 4, nil);
    },
    writeFile: function (path, data) {
      if (!/\n$/.test(data)) {
        data += '\n';
      }
      return NSString.stringWithString(data).writeToFile_atomically_encoding_error(path, true, 4, nil);
    },
    readSubpaths: function (path) {
      return NSFileManager.defaultManager().subpathsAtPath(path);
    },
    fileExists: function (path) {
      return NSFileManager.defaultManager().fileExistsAtPath(path);
    }
  },
  JSON: {
    parse: function (data) {
      // remove useless commas to avoid parse error
      var replaceReg = new RegExp(',([\\n\\s]*(\\}|\\]))', 'g');
      var result = null;

      try {
        result = JSON.parse(String(data).replace(replaceReg, '$1'));
      } catch (e) {
        log('Manifest file parsing error:' + data);
      }

      return result;
    },
    stringify: function (data) {
      return JSON.stringify(data, null, 2);
    }
  },
  array: {
    forEach: function (source, cb) {
      var len = source.length || (source.count && source.count()) || 0;

      for (var i = 0; i < len; i++) {
        if (cb.call(null, source[i], i) == true) break;
      }
    },
    filter: function (source, cb) {
      var result = [];

      utils.array.forEach(source, function (item, index) {
        if (cb.call(null, item, index)) {
          result.push(item);
        }
      });

      return result;
    }
  },
  system: {
    getLanguage: function () {
      var lang = NSUserDefaults.standardUserDefaults().objectForKey('AppleLanguages').objectAtIndex(0);
      var macOSVersion = String(NSDictionary.dictionaryWithContentsOfFile('/System/Library/CoreServices/SystemVersion.plist')
                                     .objectForKey('ProductVersion'));

      return utils.system.againstVersion(macOSVersion, '10.11.9999') ? lang.split('-').slice(0, -1).join('-') : lang;
    },
    getI18n: function (context) {
      var path = utils.path.join(context.scriptPath.stringByDeletingLastPathComponent(),
                                                    '/i18n',
                                                    utils.system.getLanguage() + '.json');
      var i18n;

      if (utils.fs.fileExists(path)) {
        i18n = utils.fs.readFile(path);
      } else {
        i18n = utils.fs.readFile(path.replace(/[\w\-]*\.json$/, '/en.json'));
      }

      return utils.JSON.parse(i18n);
    },
    againstVersion: function (againstVersion, baseVersion) {
      var baseArr = baseVersion.split('.');
      var againstArr = againstVersion.split('.').map(function (item, index) {
        var diff = baseArr[index].length - item.length;
        var result = item;

        if (diff > 0) {
          result = new Array(diff).join('0') + result;
        } else if (diff < 0) {
          baseArr[index] = new Array(Math.abs(diff)).join('0') + baseArr[index];
        }

        return result;
      });

      return againstArr.join('.') > baseArr.join('.');
    },
    openLink: function (url) {
      NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
    },
    saveFileWithPanel: function (config, content, cb) {
      var panel = NSSavePanel.savePanel();

      panel.title = config.title;
      panel.nameFieldStringValue = config.defaultFileName;
      panel.allowedFileTypes = config.types;
      panel.allowsOtherFileTypes = false;

      if (panel.runModal()) {
        utils.fs.writeFile(panel.URL(), content);
        cb && cb.call(null);
      }
    },
    openFileWithPanel: function (config, cb) {
      var panel = NSOpenPanel.openPanel();

      panel.allowedFileTypes = config.types;
      panel.allowsOtherFileTypes = false;

      if (panel.runModal()) {
        cb && cb.call(null, String(panel.URL()).replace('file://', ''));
      }
    }
  }
};
