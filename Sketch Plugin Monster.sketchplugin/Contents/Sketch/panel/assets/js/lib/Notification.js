// Notification Class
(function (global) {

  function Notification() {
    this.content = document.querySelector('.status-bar .notification');
  }

  /**
   * display notification
   * @param  {String} str      content
   * @param  {Number} duration display duration time(optional)
   */
  Notification.prototype.show = function (str, duration) {
    var _self = this;
    document.body.classList.add('notified');
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
    this.content.className = 'notification';
    document.body.classList.remove('notified');
    clearTimeout(this.timer);
  };

  global.Notification = Notification;
})(window);
