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
      return NSFileManager.defaultManager().contentsAtPath(path);
    },
    writeFile: function (path, data) {
      NSFileManager.defaultManager().createFileAtPath_contents_attributes(path, data, nil);
    }
  },
  JSON: {
    parse: function (data) {
      return NSJSONSerialization.JSONObjectWithData_options_error(data, NSJSONReadingMutableLeaves, nil);
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
  }
};
