<template>
  <div class="plugin-group"
    v-show="!hiddenMapping.$"
    :style="{ 'max-height': `${plugin.commands.length * 50 + 60}px` }"
    :class="{
      collapse: !isExpanded,
      'conflicts-inside': plugin.conflicts
    }">
    <h2 @click="isExpanded = !isExpanded">
      {{ plugin.name }}
      <i class="icon-warning" :data-count="plugin.conflicts"></i>
      <a href="javascript:;" class="icon-parsing-error" v-show="plugin.identifier === 'error.parsing'"></a>
    </h2>
    <div class="plugin-command-item"
      :class="{ conflicting: command.conflicting }"
      v-for="(command, $index) in plugin.commands"
      :key="command.identifier"
      v-show="!hiddenMapping[command.identifier]">
      <h3 v-text="command.name || '(Unknown)'"></h3>
      <input type="text"
        tabindex="-2"
        :placeholder="command.shortcut | shortcut"
        @keydown.prevent="setShortcut($event, $index, command)"
        readonly>
      <button class="button button-delete"
        :disabled="!command.shortcut"
        @click="$emit('update:shortcut', {
          index: $index,
          original: command.shortcut,
          identifier: command.identifier
        })"></button>
    </div>
  </div>
</template>
<script>
import eventBus from '../services/event-bus';
import { keyCodePresets } from '../config';

export default {
  name: 'pluginGroup',
  data() {
    return {
      isExpanded: false,
      hiddenMapping: {},
    };
  },
  props: {
    plugin: {
      type: Object,
      required: true,
    },
  },
  beforeCreate() {
    eventBus.$on('$filter:shortcut', (str) => {
      this.updateHiddenMapping({ shortcut: str });
    });
    eventBus.$on('$filter:keyword', (str) => {
      this.updateHiddenMapping({ keyword: str });
    });
  },
  methods: {
    updateHiddenMapping(filter) {
      const result = { $: true };
      const pluginName = this.plugin.name.toLowerCase();

      this.plugin.commands.forEach((command) => {
        if (
          pluginName.indexOf(filter.keyword) === -1 &&
          (command.name || '').toLowerCase().indexOf(filter.keyword) === -1 &&
          command.shortcut !== (filter.shortcut || '--') // to prevent match no shortcut command
        ) {
          // hide this command if cannot match keyword/shortcut both of plugin and command
          result[command.identifier] = true;
        } else if (result.$) {
          // display plugin self if there has any match
          delete result.$;
          eventBus.$emit('$filter:result');
        }
      });

      if (Object.keys(result).length) {
        // expand if filtered some commands
        this.isExpanded = true;
      } else {
        // collapse if match all commands
        this.isExpanded = false;
      }

      this.hiddenMapping = result;
    },
    setShortcut(ev, index, command) {
      const validKey = keyCodePresets[ev.keyCode];

      if (validKey) {
        const keys = [validKey];
        let shortcut = '';

        // handle special keys
        if (ev.metaKey) keys.unshift('cmd');
        if (ev.shiftKey) keys.unshift('shift');
        if (ev.altKey) keys.unshift('option');
        if (ev.ctrlKey) keys.unshift('ctrl');

        // generate new shortcut
        shortcut = keys.join(' ');

        if (shortcut !== command.shortcut) {
          // emit update event
          this.$emit('update:shortcut', {
            index,
            shortcut: keys.join(' '),
            original: command.shortcut,
            identifier: command.identifier,
          });
        }
      } else if (ev.keyCode === 27) {
        ev.target.blur();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../scss/variables';

.plugin-group {
  position: relative;
  border-top: 1px solid #ddd;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);

  // hide last line
  &::after {
    content: '';
    position: absolute;
    z-index: 1;
    left: 0;
    right: 0;
    bottom: 0;
    display: block;
    height: 1px;
    background-color: #fbfbfb;
  }

  h2 {
    position: relative;
    margin: 0;
    padding: 0 24px;
    font-weight: 300;
    font-size: 24px;
    line-height: $s-plugin-title-height;
    color: #4990E2;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
    user-select: none;

    &:hover {
      background-color: #fcfcfc;
    }

    &::before {
      $size: 24px;

      content: '';
      position: absolute;
      z-index: 1;
      top: 50%;
      right: 20px;
      margin-top: -$size/2;
      display: block;
      width: $size;
      height: $size;
      background: url('../../../assets/icon_arrow.png') no-repeat center/100%;
      transition: transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
    }

    .icon-warning {
      display: none;
      width: auto;
      line-height: 16px;
      font-style: normal;
      padding-left: 20px;
      font-size: 14px;
      color: #aaa;
      background-position: left center;
      background-size: auto 100%;

      &::after {
        content: 'x' attr(data-count);
      }
    }

    .icon-parsing-error {
      margin-top: -1px;
      text-decoration: none;
    }
  }

  .plugin-command-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 20px 0 30px;
    height: $s-plugin-command-height;
    background-color: #fbfbfb;

    &::after {
      content: '';
      position: absolute;
      z-index: 1;
      left: 20px;
      right: 0;
      bottom: 0;
      display: block;
      height: 1px;
      background-color: #ddd;
    }

    h3 {
      flex: 1;
      color: #666;
      font-size: 15px;
      font-weight: 300;
    }

    input {
      width: 72px;
      height: 14px;
      padding: 6px 10px;
      font: 14px/16px monospace;
      text-indent: -1px;
      text-align: center;
      letter-spacing: 1px;
      border: 1px solid #ccc;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 0 0 10px rgba(0,153,255,0);
      outline: none;

      &:focus {
        cursor: initial;
        transition: border-color 0.2s, box-shadow 0.4s;
        border-color: #4990E2;
        box-shadow: 0 0 0 3px rgba(0,153,255,.3);
      }

      &::placeholder {
        color: #666;
      }
    }

    .button-delete {
      $size: 24px;

      margin-left: 10px;
      width: $size;
      height: $size;
      background: url('../../../assets/icon_clear.png') no-repeat center/18px;

      &:disabled {
        visibility: hidden;
      }
    }

    &.conflicting{
      background-image: linear-gradient(to right, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0));

      &::after {
        z-index: 2;
        left: 0;
        height: 2px;
        background: transparent;
        background-image: linear-gradient(to right, rgba(239, 68, 68, 1), rgba(248, 121, 121, 0));
      }

      input:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
      }
    }
  }

  &.conflicts-inside {
    h2 {
      color: $c-error;

      .icon-warning {
        display: inline-block;
      }
    }
  }

  &.collapse {
    max-height: $s-plugin-title-height !important;

    &::after {
      display: none;
    }

    h2::before {
      transform: rotate(-180deg);
    }
  }
}
</style>
