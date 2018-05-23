import { mount } from '@vue/test-utils';
import Manager from '../../../src/webview/components/Manager';
import eventBus from '../../../src/webview/services/event-bus';

describe('Manager.vue', () => {
  const manager = mount(Manager);
  const statusBar = manager.find('.status-bar-wrapper');
  const notification = manager.find('.notification');
  const plugins = [
    {
      name: 'A',
      fsName: 'A',
      identifier: 'a',
      commands: [
        {
          name: 'A-1',
          identifier: 'a-1',
        },
        {
          name: 'A-2',
          identifier: 'a-2',
          shortcut: 'ctrl shift a',
        },
      ],
    },
    {
      name: 'B',
      fsName: 'B',
      identifier: 'b',
      commands: [
        {
          name: 'B-1',
          identifier: 'b-1',
          shortcut: 'ctrl shift a',
        },
        {
          name: 'B-2',
          identifier: 'b-2',
          shortcut: 'ctrl shift a',
        },
      ],
    },
  ];

  test('it should be hidden before init', () => {
    expect(manager.classes()).toContain('hide');
  });

  test('it should render plugin list and conflict list after init', () => {
    window.webviewBroadcaster('$manager:init', {
      plugins,
      lang: 'zh-CN',
      version: '1.0.0',
    });

    expect(manager.findAll('.plugin-group').length).toBe(plugins.length);
    expect(manager.findAll('.conflict-details > li').length).toBe(1);
  });

  test('it should emit search event and with lower case keywords when type some keywords', (done) => {
    const keywords = 'AB';

    manager.setData({ keywords });
    eventBus.$once('$filter:keyword', (str) => {
      expect(str).toEqual(keywords.toLowerCase());
      done();
    });
    manager.find('input[type=search]').trigger('input');
  });

  test('it should be display empty tips if no search result', () => {
    expect(manager.find('.plugin-list').classes()).toContain('empty');
  });

  test('it should restore plugin list when click display all button', () => {
    manager.find('.button-display-all').trigger('click');
    expect(manager.findAll('.plugin-group').length).toBe(plugins.length);
  });

  test('it should emit shortcut event when filter any conflict shortcut', (done) => {
    eventBus.$once('$filter:shortcut', (shortcut) => {
      expect(shortcut).toEqual(manager.vm.conflicts[0].name);
      done();
    });
    manager.find('.conflict-details li a').trigger('click');
  });

  test('it should display and hide dropdown menu properly', (done) => {
    manager.find('.button-export-import').trigger('click');
    manager.vm.$nextTick(() => {
      // open dropdown menu when click button
      expect(manager.vm.dropdown.importExport).toBeTruthy();

      // hide when click button again
      manager.find('.button-export-import').trigger('click');
      expect(manager.vm.dropdown.importExport).toBeFalsy();

      // hide dropdown menu when click anywhere
      manager.find('.button-export-import').trigger('click');
      document.dispatchEvent(new Event('click'));
      expect(manager.vm.dropdown.importExport).toBeFalsy();
      done();
    });
  });

  test('it should be display notification when emit specific event', (done) => {
    const msg = 'This is a testing message';
    const duration = 10;

    // display success notification
    eventBus.$emit('$notification:success', msg);
    expect(statusBar.classes()).toContain('in-notification');
    expect(notification.text()).toEqual(msg);
    expect(notification.classes()).toContain('success');

    // display error notification
    eventBus.$emit('$notification:error', msg); // for test branch
    eventBus.$emit('$notification:error', { content: msg, duration });
    expect(notification.classes()).toContain('error');

    // hide after duration automatically
    setTimeout(() => {
      expect(statusBar.classes().indexOf('in-notification')).toBe(-1);
      done();
    }, duration);
  });

  test('it should throw error when set a conflicting shortcut for some command', () => {
    const indexs = {
      plugin: 0,
      command: 0,
    };

    // conflict with other command
    manager.vm.updateHandler(indexs.plugin, {
      index: indexs.command,
      shortcut: plugins[indexs.plugin].commands[indexs.command + 1].shortcut,
      original: plugins[indexs.plugin].commands[indexs.command].shortcut,
      identifier: plugins[indexs.plugin].commands[indexs.command].identifier,
    });

    expect(notification.classes()).toContain('error');

    // conflict with Sketch
    manager.vm.updateHandler(indexs.plugin, {
      index: indexs.command,
      shortcut: 'cmd s',
      original: plugins[indexs.plugin].commands[indexs.command].shortcut,
      identifier: plugins[indexs.plugin].commands[indexs.command].identifier,
    });

    expect(notification.classes()).toContain('error');

    // conflict with multiple command of Sketch
    manager.vm.updateHandler(indexs.plugin, {
      index: indexs.command,
      shortcut: 'h',
      original: plugins[indexs.plugin].commands[indexs.command].shortcut,
      identifier: plugins[indexs.plugin].commands[indexs.command].identifier,
    });

    expect(notification.classes()).toContain('error');
  });

  test('it should update conflict status after resolve a conflicting shortcut', () => {
    // plugin A has 1 conflict with plugin B
    expect(manager.vm.plugins[0].conflicts).toBe(1);

    // plugin B has 2 conflicts with self and plugin A
    expect(manager.vm.plugins[1].conflicts).toBe(2);

    // plugin B still has 1 conflict after resolve 1 conflict with self
    manager.vm.updateHandler(1, {
      index: 0,
      shortcut: 'shift cmd b',
      original: plugins[1].commands[0].shortcut,
      identifier: plugins[1].commands[0].identifier,
    });
    expect(manager.vm.plugins[1].conflicts).toBe(1);

    // there has no conflict both of A & B after resolve 1 conflict with plugin A
    manager.vm.updateHandler(0, {
      index: 1,
      shortcut: 'ctrl shift b',
      original: plugins[0].commands[1].shortcut,
      identifier: plugins[0].commands[1].identifier,
    });
    expect(manager.vm.plugins[0].conflicts).toBe(0);
    expect(manager.vm.plugins[1].conflicts).toBe(0);
  });

  test('it should remove shortcut from mapping if there has no command use it', () => {
    const original = manager.vm.plugins[0].commands[1].shortcut;

    expect(manager.vm.shortcutMapping[original]).toBeDefined();
    manager.vm.updateHandler(0, {
      index: 1,
      original,
      identifier: plugins[0].commands[1].identifier,
    });

    // ctrl shift a will be remove from shortcut mapping
    expect(manager.vm.shortcutMapping[original]).toBeUndefined();
  });
});
