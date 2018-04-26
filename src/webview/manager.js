import Vue from 'vue';
import Manager from './components/Manager';

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
  render: h => h(Manager),
});
