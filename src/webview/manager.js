import Vue from 'vue';
import VueI18n from 'vue-i18n';
import Manager from './components/Manager';
import bridge from './services/bridge';
import { i18n } from './config';

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

Vue.prototype.$bridge = bridge.emit;

export default new Vue({
  el: '#app',
  i18n: new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: i18n,
  }),
  render: h => h(Manager),
});
