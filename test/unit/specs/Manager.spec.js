import { mount } from '@vue/test-utils'
import Manager from '../../../src/webview/components/Manager';

describe('Manager', () => {
  test('it should be a Vue instance', () => {
    const wrapper = mount(Manager, {
      mocks: {
        $t: () => {},
      },
    });

    expect(wrapper.isVueInstance()).toBeTruthy();
  });
});
