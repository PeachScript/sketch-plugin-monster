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
    }
  },
  JSON: {
    parse: function (data) {
      return JSON.parse(data.replace(/,(\n *})/, '$1'));
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
      return lang.split('-').slice(0, 2).join('-');
    },
    getI18n: function (context) {
      return JSON.parse(utils.fs.readFile(utils.path.join(context.scriptPath.stringByDeletingLastPathComponent(),
                                                          '/i18n',
                                                          utils.system.getLanguage() + '.json')));
    }
  },
};
