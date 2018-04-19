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
