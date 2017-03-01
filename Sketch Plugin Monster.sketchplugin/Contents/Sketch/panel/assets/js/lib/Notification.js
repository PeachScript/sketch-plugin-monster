// Notification Class
(function (global) {
  // insert HTML & CSS
  var style = document.createElement('style');
  var wrapper = document.createElement('div');

  style.setAttribute('type', 'text/css');
  wrapper.className = 'notification-wrapper';
  wrapper.innerHTML = '<div class="notification-content"></div>';
  style.innerHTML = (function () {
    // .notification-wrapper {
    //   position: fixed;
    //   z-index: 100;
    //   left: 0;
    //   right: 0;
    //   bottom: 20px;
    //   text-align: center;
    //   transform: scale(0) translateY(100px);
    //   opacity: 0;
    //   transition: all .3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    // }
    // .notification-wrapper.show {
    //   opacity: 1;
    //   transform: scale(1) translateY(0);
    // }
    // .notification-content {
    //   max-width: 70%;
    //   display: inline-block;
    //   padding: 6px 20px;
    //   font-size: 14px;
    //   line-height: 20px;
    //   color: #666;
    //   overflow-wrap: break-word;
    //   background-color: #fff;
    //   border-radius: 64px;
    //   box-shadow: 0 10px 24px rgba(0,0,0,.24);
    //   box-sizing: border-box;
    // }
    // .notification-content.error {
    //   color: #EF4444;
    // }
    // .notification-content.success {
    //   color: #93D106;
    // }
  }).toString().replace(/(^function[ \w\(\)]*\{\n)|(\/\/ )|(\n\s*\}$)/g, '');
  document.head.appendChild(style);
  document.body.appendChild(wrapper);

  function Notification() {
    this.content = document.querySelector('.notification-wrapper .notification-content');
  }

  /**
   * display notification
   * @param  {String} str      content
   * @param  {Number} duration display duration time(optional)
   */
  Notification.prototype.show = function (str, duration) {
    var _self = this;
    wrapper.classList.add('show');
    this.content.innerHTML = str;
    clearTimeout(this.timer);
    duration && (this.timer = setTimeout(function () {
      _self.hide();
    }, duration));
  };

  /**
   * display error notification
   * @param  {String} str      content
   * @param  {Number} duration display duration time(optional)
   */
  Notification.prototype.error = function (str, duration) {
    this.content.classList.add('error');
    this.show(str, duration);
  };

  /**
   * display success notification
   * @param  {String} str      content
   * @param  {Number} duration display duration time(optional)
   */
  Notification.prototype.success = function (str, duration) {
    this.content.classList.add('success');
    this.show(str, duration);
  };

  /**
   * hide notification
   */
  Notification.prototype.hide = function () {
    this.content.innerHTML = '';
    this.content.className = 'notification-content';
    wrapper.classList.remove('show');
    clearTimeout(this.timer);
  };

  global.Notification = Notification;
})(window);
