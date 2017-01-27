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
      NSFileManager.defaultManager().createFileAtPath_contents_attributes(path, data, nil);
    }
  },
  JSON: {
    parse: function (data) {
      return JSON.parse(data.replace(/,(\n *})/, '$1'));
    },
    stringify: function (data) {
      return NSJSONSerialization.dataWithJSONObject_options_error(data, NSJSONWritingPrettyPrinted, nil);
    }
  },
  array: {
    forEach: function (source, cb) {
      var len = source.length || (source.count && source.count()) || 0;

      for (var i = 0; i < len; i++) {
        if (cb.call(null, source[i], i) == true) break;
      }
    }
  },
  system: {
    getLanguage: function () {
      var lang = NSUserDefaults.standardUserDefaults().objectForKey('AppleLanguages').objectAtIndex(0);
      return lang.split('-').slice(0, 2).join('-');
    }
  },
};
