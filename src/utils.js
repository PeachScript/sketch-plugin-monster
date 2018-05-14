export const safeJSONParser = (data) => {
  // remove useless commas to avoid parse error
  const replaceReg = new RegExp(',([\\n\\s]*(\\}|\\]))', 'g');
  let result = null;

  try {
    result = JSON.parse(String(data).replace(replaceReg, '$1'));
  } catch (e) {
    log('Manifest file parsing error:' + data);
  }

  return result;
};

export const setTimeout = (cb, time) => {
  coscript.scheduleWithInterval_jsFunction(time / 1000, cb);
};

export const openURL = (url) => {
  NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
};
