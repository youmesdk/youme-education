/*
 * @Author: fan.li 
 * @Date: 2018-08-24 18:09:59 
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-08-24 18:14:28
 * 
 * 游密日志工具
 */

// 日志级别
const LogLevel = {
  DISABLED: 0,
  FATAL: 1,
  ERROR: 10,
  WARNING: 20,
  INFO: 40,
  DEBUG: 50,
  VERBOSE: 60
};

// 获取现在时间
function getNowFormatDate() {
  const date = new Date();
  const seperator1 = "-";
  const seperator2 = ":";
  const month = date.getMonth() + 1;
  let monthStr = "";
  const numDate = date.getDate();
  let strDate = "";

  if (month >= 1 && month <= 9) {
    monthStr = "0" + month;
  } else {
    monthStr = "" + month;
  }
  if (numDate >= 0 && numDate <= 9) {
    strDate = "0" + numDate;
  } else {
    strDate = "" + numDate;
  }

  const currentdate =
    date.getFullYear() +
    seperator1 +
    monthStr +
    seperator1 +
    strDate +
    " " +
    date.getHours() +
    seperator2 +
    date.getMinutes() +
    seperator2 +
    date.getSeconds() +
    seperator2 +
    date.getMilliseconds();
  return currentdate;
}

function YMLogUtils() {
  /** empty construtor */
}

YMLogUtils._logLevel = LogLevel.DISABLED;

/**
 * 设置日志级别
 */
YMLogUtils.setLogLevel = function(level) {
  YMLogUtils._logLevel = level;
};

/**
 * 获取日志级别
 */
YMLogUtils.getLogLevel = function() {
  return YMLogUtils._logLevel;
};

/**
 * info log
 */
YMLogUtils.LOGI = function(...logParams) {
  if (YMLogUtils._logLevel < LogLevel.INFO) return;
  if (
    navigator.appName == "Microsoft Internet Explorer" &&
    parseInt(
      navigator.appVersion
        .split(";")[1]
        .replace(/[ ]/g, "")
        .replace("MSIE", "")
    ) < 11
  ) {
    console.log("YIM -INFO- " + getNowFormatDate() + logParams);
  } else {
    console.log("YIM -INFO- ", getNowFormatDate(), ...logParams);
  }
};

/**
 * warning log
 */
YMLogUtils.LOGW = function(...logParams) {
  if (YMLogUtils._logLevel < LogLevel.WARNING) return;
  if (
    navigator.appName == "Microsoft Internet Explorer" &&
    parseInt(
      navigator.appVersion
        .split(";")[1]
        .replace(/[ ]/g, "")
        .replace("MSIE", "")
    ) < 11
  ) {
    console.warn("YIM -WARNING- " + getNowFormatDate() + logParams);
  } else {
    console.warn("YIM -WARNING- ", getNowFormatDate(), ...logParams);
  }
};

/**
 * error log
 */
YMLogUtils.LOGE = function(...logParams) {
  if (YMLogUtils._logLevel < LogLevel.ERROR) return;
  if (
    navigator.appName == "Microsoft Internet Explorer" &&
    parseInt(
      navigator.appVersion
        .split(";")[1]
        .replace(/[ ]/g, "")
        .replace("MSIE", "")
    ) < 11
  ) {
    console.error("YIM -ERROR- " + getNowFormatDate() + logParams);
  } else {
    console.error("YIM -ERROR- ", getNowFormatDate(), ...logParams);
  }
};

module.exports = {
  LogLevel,
  YMLogUtils
};
