const fs = require('fs');
const ora = require('ora');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');

const spinner = ora('Parsing shortcuts form sketchapp.com').start();
const basePath = '../Sketch Plugin Monster.sketchplugin/Contents/Sketch/i18n/';
const i18nFiles = {
  en: 'DIRECTLY',
  'zh-hans': 'APPEND',
  'zh-hant': 'APPEND'
};

/**
 * parse readable shortcut keys from key string
 * @param  {String} keyStr key string
 * @return {String}        readable shortcut keys
 */
function parseShortcutKeys(keyStr) {
  let parsed = keyStr;

  if (/arrow keys/i.test(keyStr)) {
    // Handle arrow keys
    keyStr.split('-').reduce((result, item) => {
      if (/arrow keys/i.test(item)) {
        parsed = ['←', '↑', '→', '↓'].map((arrow) => `${result[0].join(' ')}${result[0].length ? ' ' : ''}${arrow}`).join('/');
      } else {
        result[0].push(item); // Other keys
      }

      return result;
    }, [[]]);
  } else if (/ or /.test(keyStr)) {
    // Handle `or` syntax
    parsed = keyStr.split(' or ').reduce((result, item, i) => {
      if ( i > 0) {
        const prefix = result[0].split(' ');

        prefix.pop(); // Remove previous item
        prefix.push(item) // Add this item to combine the new shortcut
        result.push(prefix.join(' '));
      } else {
        result.push(item);
      }

      return result;
    }, []).join('/');
  } else if (/\d *(-|to) *\d/.test(keyStr)) {
    // Handle num section like `0 to 9`
    const nums = keyStr.split(/ *- *| *to */);

    parsed = Array.apply(null, Array(nums[1] - nums[0] + 1)).map((num, i) => (parseInt(nums[0], 10) + i)).join('/');
  }

  // Transform special keys(ctrl option shift cmd)
  parsed = parsed.replace(/\u2303|\u2325|\u21E7|\u2318/g, (subStr) => {
    const mapping = {
      '\u2303': 'ctrl',
      '\u2325': 'option',
      '\u21E7': 'shift',
      '\u2318': 'cmd'
    };

    return mapping[subStr];
  });

  // Transform some keys work with shift key({ | <)
  parsed = parsed.replace(/(cmd )?({|}|\||\+|%|\*|~)/, (match, prefix = '', key, i, str) => {
    const mapping = {
      '{': '[',
      '}': ']',
      '|': '\\',
      '+': '=',
      '%': '5',
      '*': '8',
      '~': '`'
    };
    let result;

    if (str.indexOf('shift') > -1 ||                // Transform key to original key if it has shift key
        ['option cmd +', 'cmd +'].indexOf(str) > -1 // Hack for the Sketch document error
      ) {
      result = `${prefix}${mapping[key]}`;
    } else {
      // Add missing shift key
      result = `shift ${prefix}${mapping[key]}`;
    }

    return result;
  });

  return parsed.toLowerCase().trim();
}

/**
 * parse shortcuts from html code in sketchapp.com
 * @param  {String} html html code
 * @return {Object}      shortcut map
 */
function parseShortcuts(html) {
  const $ = cheerio.load(html, {
    decodeEntities: false
  });
  const rows = $('.shortcuts-table table tr');
  const originalI18n = {};
  const resultI18n = {};

  // Read original i18n files
  Object.keys(i18nFiles).forEach((i18nKey) => {
    resultI18n[i18nKey] = JSON.parse(fs.readFileSync(path.join(__dirname, basePath, `${i18nKey}.json`)));
    originalI18n[i18nKey] = resultI18n[i18nKey].sketchShortcuts;
    resultI18n[i18nKey].sketchShortcuts = {};
  });

  // Read shortcuts from html code
  Array.prototype.map.call(rows, (row) => {
    const cells = $(row).find('td');

    // Filter unnecessary shortcuts
    if (!/-(drag|click|hover)|^(click|double|fn|drag)|and resize|in layer name/i.test($(cells[0]).text().trim())) {
      // Add space for each kbd element
      $(row).find('kbd').each((kbd) => {
        $(kbd).html(` ${$(kbd).text().trim()} `);
      });

      const parsedKeys = parseShortcutKeys($(cells[0]).text().replace(/  /g), ' ');

      // Expand mutiple keys
      (parsedKeys === '/' ? [parsedKeys] : parsedKeys.split('/')).forEach((shortcut) => {
        let key = shortcut.trim();
        let action = $(cells[1]).text();

        // Hack special shortcut
        if (key.indexOf('§') > -1) {
          key = key.replace(/ *\(.*\)$/, '');
        } else if (key === 'c') {
          action = action.replace(/ *\/ *middle$/, '');
        } else if (key === 'm') {
          action = action.replace(/center *\/ */, '');
        }

        // Update original i18n files
        Object.keys(i18nFiles).forEach((i18nKey) => {
          const target = resultI18n[i18nKey].sketchShortcuts;

          // Solve original configurations
          if (originalI18n[i18nKey][key]) {
            switch (i18nFiles[i18nKey]) {
              case 'APPEND':
                action += ` | ${originalI18n[i18nKey][key]}`
                break;
              case 'DIRECTLY':
              default:
            }
          }

          // Save shortcut keys
          if (target[key]) {
            if (Array.isArray(target[key])) {
              target[key].push(action);
            } else {
              target[key] = [target[key], action];
            }
          } else {
            target[key] = action;
          }
        });
      });
    }
  });


  // Save into i18n files
  Object.keys(i18nFiles).forEach((i18nKey) => {
    fs.writeFileSync(path.join(__dirname, basePath, `${i18nKey}.json`), JSON.stringify(resultI18n[i18nKey], null, 2));
  });
  spinner.succeed('Save all valid official shortcuts into i18n file!');
}

// Get the latest shortcuts from sketchapp.com
https.get({
  protocol: 'https:',
  host: 'sketchapp.com',
  path: '/learn/documentation/shortcuts/shortcuts/'
}, (res) => {
  let data = '';

  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    parseShortcuts(data);
  });
});
