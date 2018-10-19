/*
 * @Author: fan.li
 * @Date: 2018-10-19 16:25:13
 * @Last Modified by:   fan.li
 * @Last Modified time: 2018-10-19 16:25:13
 *
 * 一些小工具
 */

function isEmpty(str) {
  return str === null || str === '' || str === undefined;
}

function endWith(str, suffix) {
  var reg = new RegExp(suffix + "$");
  return reg.test(str);
}

function startWith(str, prefix) {
  var reg = new RegExp("^" + prefix);
  return reg.test(str);
}

export {
  isEmpty,
  endWith,
  startWith
};
