import emitter from 'sketch-module-web-view/client';

const listeners = {};

window.webviewBroadcaster = (event, ...args) => {
  const queue = listeners[event];

  (queue || []).forEach((cb) => {
    cb(...args);
  });
};

export default {
  on(event, cb) {
    if (listeners[event]) {
      listeners[event].push(cb);
    } else {
      listeners[event] = [cb];
    }
  },
  off(event, cb) {
    const target = (listeners[event] || []).indexOf(cb);

    if (target > -1) {
      listeners.splice(target, 1);
    } else if (listeners[event]) {
      delete listeners[event];
    }
  },
  emit: emitter,
};
