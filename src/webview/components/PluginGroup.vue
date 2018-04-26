<template>
  <div class="plugin-group conflicts-inside"
    :style="{ 'max-height': `${plugin.commands.length * 50 + 60}px` }"
    :class="{ collapse: !plugin.expanded }">
    <h2 @click="toggle">
      {{ plugin.name }}
      <i class="icon-warning" data-count="1"></i>
      <a href="javascript:;" class="icon-parsing-error" v-show="plugin.identifier === 'error.parsing'"></a>
    </h2>
    <div class="plugin-command-item"
      v-for="command in plugin.commands"
      :key="command.identifier">
      <h3 v-text="command.name"></h3>
      <input type="text"
        tabindex="-2"
        :placeholder="command.shortcut | shortcut"
        readonly>
      <button class="button button-delete"
        :disabled="!command.shortcut"></button>
    </div>
  </div>
</template>
<script>
export default {
  name: 'pluginGroup',
  props: {
    plugin: {
      type: Object,
      required: true,
    },
  },
  methods: {
    toggle() {
      this.$set(this.plugin, 'expanded', !this.plugin.expanded);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../scss/variables';

.plugin-group {
  border-top: 1px solid #ddd;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);

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

    &:last-child::after {
      display: none;
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
    }
  }

  &.collapse {
    max-height: $s-plugin-title-height !important;

    h2::before {
      transform: rotate(-180deg);
    }
  }
}
</style>
