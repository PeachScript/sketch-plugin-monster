import os from '@skpm/os';
import path from '@skpm/path';
import en from './i18n/en.json';
import zhHans from './i18n/zh-Hans.json';
import zhHant from './i18n/zh-Hant.json';

export const paths = {
  plugin: path.join(os.homedir(), '/Library/Application Support/com.bohemiancoding.sketch3/Plugins'),
  manifest: 'Contents/Sketch/manifest.json',
};

export const identifiers = {
  parseError: 'error.parsing',
  nonexistent: 'error.nonexistent',
};

export const system = {
  lang: NSLocale.preferredLanguages().firstObject().replace(/-\w+$/, ''),
};

export const i18n = {
  en,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
}[system.lang] || en;

export default {
  paths,
  identifiers,
  system,
  i18n,
};
