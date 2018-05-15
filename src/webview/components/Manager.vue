<template>
  <div class="manager-container" :class="{ hide: !plugins.length }">
    <header @transitionend="$event.target.children[0].focus()">
      <input type="search" spellcheck="false"
        v-model.trim="keywords"
        @input="search"
        :placeholder="$t('webview.searchTips')">
      <button class="button button-dropdown button-export-import"
        @click.self="toggleDropdown('importExport')">
        <transition name="dropdown">
          <ul class="dropdown-menu left-bottom" v-show="dropdown.importExport">
            <li>
              <a href="javascript:;"
                v-text="$t('commands.importShortcuts')"
                @click="$bridge('$importShortcuts')">
              </a>
            </li>
            <li>
              <a href="javascript:;"
                v-text="$t('commands.exportShortcuts')"
                @click="$bridge('$exportShortcuts')">
              </a>
            </li>
          </ul>
        </transition>
      </button>
      <button class="button button-dropdown button-settings"
        @click.self="toggleDropdown('settings')">
        <transition name="dropdown">
          <ul class="dropdown-menu left-bottom" v-show="dropdown.settings">
            <li>
              <a href="javascript:;"
                v-text="$t('commands.linkFAQ')"
                @click="$bridge('$linkFAQ')">
              </a>
            </li>
            <li>
              <a href="javascript:;"
                v-text="$t('commands.linkFeedback')"
                @click="$bridge('$linkFeedback')">
              </a>
            </li>
            <li><a href="javascript:;" disabled="disabled">v0.3.1</a></li>
          </ul>
        </transition>
      </button>
    </header>
    <main class="plugin-list"
      :class="{ empty: isEmpty }"
      data-empty="No matching plugins or commands here">
      <plugin-group v-for="(plugin, $index) in plugins"
        :key="plugin.identifier"
        :plugin="plugin"
        @update:shortcut="updateHandler($index, $event)">
      </plugin-group>
    </main>
    <footer>
      <transition name="dropdown">
        <ul class="dropdown-menu right-top conflict-details" v-show="dropdown.conflicts">
          <li v-for="conflict in conflicts" :key="conflict.name">
            <a href="javascript:;" @click="filter('shortcut', conflict.name)">
              <kbd>{{ conflict.name | shortcut }}</kbd>
              <span>x{{ conflict.count }}</span>
            </a>
          </li>
        </ul>
      </transition>
      <div class="status-bar-wrapper"
        :class="{
          'in-filtering': isFiltered,
          'in-notification': notification.timer,
        }"
        @transitionend.self="clearNotification">
        <div class="status-bar-inner">
          <div class="status-bar-item">
            <button class="button button-display-all"
              @click="displayAll"
              v-text="$t('webview.clearFilter')"></button>
          </div>
          <div class="status-bar-item">
            <button class="button button-conflict-warning"
              v-show="conflicts.length"
              :data-count="conflictCount"
              @click.self="toggleDropdown('conflicts')"></button>
            <span v-show="conflicts.length"
              v-text="$t('webview.conflictWarning', { conflictCount })">
            </span>
          </div>
          <div class="status-bar-item notification"
            :class="notification.type"
            v-text="notification.msg"></div>
        </div>
      </div>
    </footer>
  </div>
</template>
<script>
import bridge from '../services/bridge';
import eventBus from '../services/event-bus';
import PluginGroup from './PluginGroup';

export default {
  name: 'manager',
  data() {
    return {
      dropdown: {
        importExport: false,
        settings: false,
        conflicts: false,
      },
      keywords: '',
      searchTimer: null,
      isFiltered: false,
      isEmpty: false,
      plugins: [],
      shortcutMapping: {},
      notification: {
        type: 'success',
        timer: null,
        msg: '',
      },
    };
  },
  computed: {
    conflicts() {
      return Object.keys(this.shortcutMapping).reduce((result, name) => {
        const group = this.shortcutMapping[name];

        if (group.length > 1) {
          result.push({
            name,
            count: group.length,
          });
        }

        return result;
      }, []);
    },
    conflictCount() {
      return this.conflicts.reduce((count, item) => count + item.count, 0);
    },
  },
  beforeCreate() {
    bridge.on('$manager:init', ({ plugins, lang }) => {
      // generate shortcut mapping
      this.$set(this, 'shortcutMapping', plugins.reduce((result, plugin) => {
        plugin.commands.forEach((command) => {
          if (command.shortcut) {
            const item = {
              pluginName: plugin.name,
              commandName: command.name,
              identifier: command.identifier,
            };

            if (result[command.shortcut]) {
              result[command.shortcut].push(item);
            } else {
              result[command.shortcut] = [item]; // eslint-disable-line no-param-reassign
            }
          }
        });

        return result;
      }, {}));

      // generate plugin data with conflict status
      this.$set(this, 'plugins', plugins.map((plugin) => {
        plugin.commands.forEach((command) => {
          if (command.shortcut && this.shortcutMapping[command.shortcut].length > 1) {
            /* eslint-disable no-param-reassign */
            command.conflicting = true;
            plugin.conflicts = plugin.conflicts ? (plugin.conflicts + 1) : 1;
            /* eslint-enable no-param-reassign */
          }
        });
        return plugin;
      }));

      this.$i18n.locale = lang;
    });
  },
  mounted() {
    document.addEventListener('click', () => {
      Object.keys(this.dropdown).forEach((key) => {
        this.dropdown[key] = false;
      });
    });

    eventBus.$on('$notification:success', (conf) => {
      this.notify('success', conf.content || conf, conf.duration);
    });

    eventBus.$on('$notification:error', (conf) => {
      this.notify('error', conf.content || conf, conf.duration);
    });
  },
  methods: {
    toggleDropdown(target) {
      if (this.dropdown[target]) {
        this.dropdown[target] = false;
      } else {
        this.$nextTick(() => {
          this.dropdown[target] = true;
        });
      }
    },
    search(delay = 100) {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.filter('keyword', this.keywords.toLowerCase());
        if (!this.keywords) {
          this.isFiltered = false;
        }
      }, delay);
    },
    filter(type, arg) {
      this.isFiltered = true;
      this.isEmpty = true;
      eventBus.$once('$filter:result', () => {
        this.isEmpty = false;
      });
      eventBus.$emit(`$filter:${type}`, arg);
    },
    displayAll() {
      this.keywords = '';
      this.search(0);
    },
    notify(type, msg, duration) {
      clearTimeout(this.notification.timer);
      this.notification.msg = msg;
      this.notification.type = type;
      this.notification.timer = setTimeout(() => {
        this.notification.timer = null;
      }, duration || msg.length * 80);
    },
    clearNotification() {
      if (!this.notification.timer) {
        this.notification.msg = '';
      }
    },
    updateHandler(index, replacement) {
      const pluginConflicts = (
        this.shortcutMapping[replacement.shortcut] ||
        []
      ).filter((item => item.identifier !== replacement.identifier));
      const sketchConflicts = this.$t('sketchShortcuts')[replacement.shortcut];
      const originalConflicts = this.shortcutMapping[replacement.original];

      if (pluginConflicts.length) {
        // notify error if conflict with other plugins
        eventBus.$emit('$notification:error', {
          content: this.$t('webview.conflict', {
            conflictTarget: pluginConflicts[0].pluginName,
            shortcutName: pluginConflicts[0].commandName,
          }),
          duration: 2000,
        });
      } else if (sketchConflicts) {
        // notify error if conflict with Sketch
        eventBus.$emit('$notification:error', {
          content: this.$t('webview.conflict', {
            conflictTarget: 'Sketch',
            shortcutName: Array.isArray(sketchConflicts) ? this.$t('webview.conflictMulti') : sketchConflicts,
          }),
          duration: 2000,
        });
      } else {
        // update shortcut
        bridge.emit('$updateShortcut', this.plugins[index].fsName, replacement);
        eventBus.$emit('$notification:success', {
          content: this.$t(replacement.shortcut ? 'webview.success' : 'webview.clear'),
          duration: 2000,
        });
        this.$set(this.plugins[index].commands[replacement.index], 'shortcut', replacement.shortcut);

        // remove conflict status
        if (this.plugins[index].commands[replacement.index].conflicting) {
          this.$delete(this.plugins[index].commands[replacement.index], 'conflicting');
          this.$set(this.plugins[index], 'conflicts', this.plugins[index].conflicts - 1);
        }

        // update shortcut mapping
        if (replacement.shortcut) {
          this.shortcutMapping[replacement.shortcut] = [{
            pluginName: this.plugins[index].name,
            commandName: this.plugins[index].commands[replacement.index].name,
            identifier: replacement.identifier,
          }];
        }

        // remove conflict if exists
        if (originalConflicts) {
          this.shortcutMapping[replacement.original] = originalConflicts
            .filter(item => item.identifier !== replacement.identifier);
        }
      }
    },
  },
  components: { PluginGroup },
};
</script>
<style lang="scss">
@import '../scss/main';
</style>
<style lang="scss" scoped>
@import '../scss/variables';

.manager-container {
  > * {
    transition: visibility 0.3s, opacity 0.3s;
  }

  &.hide {
    > * {
      visibility: hidden;
      opacity: 0;
    }

    &::after {
      $size: 35px;

      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      margin-top: -$size/2;
      margin-left: -$size/2;
      display: block;
      width: $size;
      height: $size;
      border: 3px solid #bbb;
      border-bottom-color: transparent;
      border-radius: 50%;
      animation: linear rotate 0.8s infinite;

      @keyframes rotate {
        0% {
          transform: rotate(0);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    }
  }
}

header {
  display: flex;
  align-items: center;
  padding: 24px;

  input {
    flex: 1;
    padding: 10px 10px 10px 36px;
    font-size: 16px;
    font-weight: 200;
    outline: none;
    border: 1px solid #ccc;
    border-radius: 40px;
    background: url('../../../assets/icon_search.png') no-repeat 12px 56%/24px;
    transition: border 0.3s;

    &:focus {
      border-color: $c-blue;
    }
  }

  .button {
    $size: 24px;

    width: $size;
    height: $size;
    margin-left: 15px;
    background: no-repeat center/100%;

    &.button-export-import {
      background-image: url('../../../assets/icon_config_file.png');
    }

    &.button-settings {
      background-image: url('../../../assets/icon_settings.png');
    }
  }
}

.plugin-list {
  margin-bottom: $s-footer-height - 1;

  &:not(.empty) {
    border-bottom: 1px solid #ddd;
  }

  &.empty {
    margin: 80px 0 20px;
    height: 20px;
    padding-top: 97px;
    color: #bbb;
    line-height: 20px;
    text-align: center;
    background: url('../../../assets/empty_tips.png') center 0/77px no-repeat;

    &::before {
      content: attr(data-empty);
    }
  }
}

.empty-tips {
  margin: 80px 0 20px;
  height: 20px;
  padding-top: 97px;
  color: #bbb;
  line-height: 20px;
  text-align: center;
  background: url('../../../assets/empty_tips.png') center 0/77px no-repeat;
}

footer {
  position: fixed;
  z-index: 10;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  height: $s-footer-height;
  padding: 0 16px;
  user-select: none;
  background-color: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,.24);

  .dropdown-menu.right-top.conflict-details {
    left: 18px;
    bottom: 100%;
    width: 150px;

    li {
      border-bottom: 1px solid #eee;

      a {
        line-height: 32px;
        color: #333;
        border-top: 0;
        background-image: url('../../../assets/icon_search.png');
        background-repeat: no-repeat;
        background-position: 93% center;
        background-size: 16px;
      }

      span {
        float: right;
        margin-right: 24%;
        font-size: 14px;
        color: #888;
      }

      &:last-child {
        border-bottom: 0;
      }
    }
  }

  .status-bar-wrapper {
    height: $s-status-bar-height;
    overflow: hidden;

    .status-bar-inner {
      transition: transform .2s cubic-bezier(0.215, 0.61, 0.355, 1);
      transform: translateY(-$s-status-bar-height);
    }

    &.in-filtering .status-bar-inner {
      transform: translateY(0);
    }

    &.in-notification .status-bar-inner {
      transform: translateY(-$s-status-bar-height * 2);
    }

    .status-bar-item {
      display: flex;
      align-items: center;
      font-size: 14px;
      height: $s-status-bar-height;

      &.notification {
        &.error {
          color: $c-error;
        }

        &.success {
          color: $c-success
        }
      }

      .button-display-all {
        padding: 0 10px;
        height: 26px;
        color: $c-blue;
        border: 1px solid $c-blue;
        border-radius: 3px;
        background: transparent;
        box-sizing: border-box;
        cursor: pointer;

        &:hover {
          color: #fff;
          background-color: $c-blue;
        }

        &:active {
          background-color: #3D7AC0;
          border-color: #3D7AC0;
        }
      }

      .button-conflict-warning {
        position: relative;
        margin-right: 16px;
        width: 24px;
        height: 24px;
        background: url('../../../assets/icon_warning_gray.png') no-repeat center/100%;

        &::after {
          content: attr(data-count);
          position: absolute;
          top: -2px;
          left: 14px;
          display: inline-block;
          min-width: 14px;
          height: 14px;
          padding: 0 2px;
          line-height: 14px;
          font-size: 10px;
          text-align: center;
          color: #fff;
          background-color: $c-error;
          border-radius: 14px;
        }

        + * {
          color: $c-error;
        }
      }
    }
  }
}
</style>
