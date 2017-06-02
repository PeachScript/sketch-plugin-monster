const fs = require('fs');
const ora = require('ora');
const https = require('https');
const cheerio = require('cheerio');
const spinner = ora('Parsing shortcuts form sketchapp.com').start();

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

function parseShortcuts(html) {
  const $ = cheerio.load(html, {
    decodeEntities: false
  });
  const rows = $('.shortcuts-table table tr');
  const result = {};

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

        if (result[key]) {
          if (Array.isArray(result[key])) {
            result[key].push(action);
          } else {
            result[key] = [result[key], action];
          }
        } else {
          result[key] = action;
        }
      });
    }
  });

  fs.writeFileSync(__dirname + '/data.json', JSON.stringify(result, null, 2));
  spinner.succeed('Save all valid official shortcuts into scripts/data.json file');
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
