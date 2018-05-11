import Vue from 'vue';
import VueI18n from 'vue-i18n';
import Manager from './components/Manager';
import en from '../i18n/en.json';
import zhHans from '../i18n/zh-Hans.json';
import zhHant from '../i18n/zh-Hant.json';

Vue.use(VueI18n);

Vue.filter('shortcut', (input = '') => {
  const mapping = {
    ctrl: '\u2303',
    control: '\u2303',
    alt: '\u2325',
    option: '\u2325',
    shift: '\u21E7',
    cmd: '\u2318',
    command: '\u2318',
  };

  return input.split(' ').map(key => mapping[key] || key).join('');
});

export default new Vue({
  el: '#app',
  i18n: new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en,
      'zh-Hans': zhHans,
      'zh-Hant': zhHant,
    },
  }),
  render: h => h(Manager),
});
