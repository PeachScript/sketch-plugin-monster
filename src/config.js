import os from '@skpm/os';
import path from '@skpm/path';

export const paths = {
  plugin: path.join(os.homedir(), '/Library/Application Support/com.bohemiancoding.sketch3/Plugins'),
  manifest: 'Contents/Sketch/manifest.json',
};

export const identifiers = {
  parseError: 'error.parsing',
  nonexistent: 'error.nonexistent',
};

export default {
  paths,
  identifiers,
};
