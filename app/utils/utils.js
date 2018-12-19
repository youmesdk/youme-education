/*
 * @Author: fan.li
 * @Date: 2018-10-19 16:25:13
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-19 21:05:39
 *
 * 一些小工具
 */

export function isEmpty(str) {
  return str === null || str === '' || str === undefined;
}

export function endWith(str, suffix) {
  var reg = new RegExp(suffix + "$");
  return reg.test(str);
}

export function startWith(str, prefix) {
  var reg = new RegExp("^" + prefix);
  return reg.test(str);
}

export function throttle(callback, delay) {
  let prevCall = Date.now();
  return function() {
    const now = Date.now();
    if ((now - prevCall) >= delay) {
      callback.apply(this, arguments);
      prevCall = now;
    }
  }
}
