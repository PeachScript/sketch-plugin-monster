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
    //   top: 10px;
    //   left: 0;
    //   right: 0;
    //   text-align: center;
    // }
    // .notification-content {
    //   display: none;
    //   max-width: 70%;
    //   padding: 5px 10px;
    //   font-size: 14px;
    //   line-height: 18px;
    //   text-align: left;
    //   color: #fff;
    //   overflow-wrap: break-word;
    //   background-color: #19C1F3;
    //   border: 1px solid #17B9E8;
    //   box-shadow: 0 1px 5px rgba(0,0,0,.2);
    //   box-sizing: border-box;
    // }
    // .notification-content.show {
    //   display: inline-block;
    // }
    // .notification-content.error {
    //   background-color: #F91F2E;
    //   border-color: #E71A27;
    // }
    // .notification-content.success {
    //   background-color: #9CDE07;
    //   border-color: #91CF06;
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
    this.content.classList.add('show');
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
    clearTimeout(this.timer);
  };

  global.Notification = Notification;
})(window);
