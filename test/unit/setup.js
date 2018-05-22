import Vue from 'vue';
import { config } from '@vue/test-utils';
import bridge from '../../src/webview/services/bridge';
import { i18n } from '../../src/webview/config';

Vue.filter('shortcut', key => key);
config.mocks.$t = key => i18n.en[key] || key;
config.mocks.$i18n = {};

// mock emitter of sketch-module-web-view
bridge.emit = () => {};
