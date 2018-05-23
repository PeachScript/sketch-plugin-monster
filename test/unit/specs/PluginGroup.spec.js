import { mount } from '@vue/test-utils';
import PluginGroup from '@/components/PluginGroup';
import eventBus from '@/services/event-bus';

describe('PluginGroup.vue', () => {
  const plugin = {
    fsName: 'A',
    name: 'A',
    identifier: 'a',
    commands: [
      {
        name: 'A-1',
        identifier: 'a-1',
        shortcut: 'ctrl shift a',
      },
    ],
  };
  const pluginGroup = mount(PluginGroup, {
    propsData: {
      plugin,
    },
  });
  const input = pluginGroup.find('.plugin-command-item input');

  test('it should be init correctly', () => {
    expect(pluginGroup.findAll('.plugin-command-item').length).toBe(plugin.commands.length);
  });

  test('it should ignore if set a same shortcut or press invalid keys', (done) => {
    let isUpdate = false;

    // listen update event
    pluginGroup.vm.$on('update:shortcut', () => {
      isUpdate = true;
    });

    // press invalid keys
    input.trigger('keydown', {
      keyCode: 9, // Tab
    });

    // press same keys
    input.trigger('keydown', {
      keyCode: 65, // A
      shiftKey: true,
      ctrlKey: true,
    });

    // try to wait for event
    setTimeout(() => {
      expect(isUpdate).toBeFalsy();
      pluginGroup.vm.$off('update:shortcut');
      done();
    }, 10);
  });

  test('it should send update event when press valid keys', (done) => {
    // listen update event
    pluginGroup.vm.$on('update:shortcut', ({ shortcut }) => {
      expect(shortcut).toEqual('option cmd a');
      done();
    });

    // trigger shortcut update
    input.trigger('keydown', {
      keyCode: 65, // a
      altKey: true,
      metaKey: true,
    });
  });

  test('it should be blur if press esc key', () => {
    // mock blur method
    input.element.blur = jest.fn(input.element.blur);

    // press esc key
    input.trigger('keydown', {
      keyCode: 27, // ESC
    });
    expect(input.element.blur).toHaveBeenCalled();
  });
});
