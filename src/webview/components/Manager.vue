<template>
  <div>
    <header>
      <input v-model="keywords" type="search" spellcheck="false" placeholder="Type any keywords of plugins or commands...">
      <button class="button button-dropdown button-export-import"
        @click.self="toggleDropdown('importExport')">
        <transition name="dropdown">
          <ul class="dropdown-menu left-bottom" v-show="dropdown.importExport">
            <li><a href="javascript:;">Import Shortcut Configurations...</a></li>
            <li><a href="javascript:;">Export Shortcut Configurations...</a></li>
          </ul>
        </transition>
      </button>
      <button class="button button-dropdown button-settings"
        @click.self="toggleDropdown('settings')">
        <transition name="dropdown">
          <ul class="dropdown-menu left-bottom" v-show="dropdown.settings">
            <li><a href="javascript:;">Check For Updates...</a></li>
            <li><a href="javascript:;">FAQ</a></li>
            <li><a href="javascript:;">Feedback</a></li>
            <li><a href="javascript:;" disabled="disabled">v0.3.1</a></li>
          </ul>
        </transition>
      </button>
    </header>
    <main>
      <plugin-group v-for="plugin in plugins"
        :key="plugin.identifier"
        :plugin="plugin">
      </plugin-group>
      <div class="empty-tips" v-show="!plugins.length">No matching plugins or commands here</div>
    </main>
    <footer>
      <transition name="dropdown">
        <ul class="dropdown-menu right-top conflict-details" v-show="dropdown.conflicts">
          <li v-for="conflict in conflicts" :key="conflict.name">
            <a href="javascript:;">
              <kbd>{{ conflict.name | shortcut }}</kbd>
              <span>x{{ conflict.count }}</span>
            </a>
          </li>
        </ul>
      </transition>
      <div class="status-bar-wrapper">
        <div class="status-bar-inner">
          <div class="status-bar-item">
            <button class="button button-display-all">Display All</button>
          </div>
          <div class="status-bar-item">
            <button class="button button-conflict-warning"
              v-show="conflicts.length"
              :data-count="conflicts.length"
              @click.self="toggleDropdown('conflicts')"></button>
            <span v-show="conflicts.length">
              Warning: There are {{ conflicts.length }} operations shortcut keys in conflict!
            </span>
          </div>
          <div class="status-bar-item notification">sdfadfafdsaf</div>
        </div>
      </div>
    </footer>
  </div>
</template>
<script>
import bridge from '../services/bridge';
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
      plugins: [],
      shortcutMapping: {},
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
  },
  beforeCreate() {
    bridge.on('$manager:init', (arg) => {
      // generate shortcut mapping
      this.$set(this, 'shortcutMapping', arg.reduce((result, plugin) => {
        plugin.commands.forEach((command) => {
          if (command.shortcut) {
            const item = {
              pluginName: plugin.name,
              commandName: command.name,
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
      // generate plugin data
      this.$set(this, 'plugins', arg.map((plugin) => {
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
    });
  },
  mounted() {
    document.addEventListener('click', () => {
      Object.keys(this.dropdown).forEach((key) => {
        this.dropdown[key] = false;
      });
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
  },
  components: { PluginGroup },
};
</script>
<style lang="scss">
@import '../scss/main';
</style>
<style lang="scss" scoped>
@import '../scss/variables';

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

main {
  padding-bottom: $s-footer-height;
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
