const child_process = require('child_process');
const path = require('path');
const os = require('os');
const screen = require('electron').screen;
const app = require('electron').remote.app;
const { YMLogUtils : Logger, LogLevel } = require('./ymlogutils');

let audioDevice = null;
let videoDevice = null;
let macAudioDevice = 0;
let proc = null;
let userStop = false;
let libs = 'libx264'; // win平台下默认解码方式
let sdkAutoRetryCount = 2; // 默认重试次数

// 在win系统下可能存在因显卡判断不准确导致失败的风险，
// 因此，失败一次的时候应该用libx264重试一次
let hasRetry = false

function getAppName() {
  const appPath = app.getAppPath();
  const temp = appPath.substr(0, appPath.indexOf('.app/'));
  const appName = temp.substr(temp.lastIndexOf('/') + 1);
  if(!appName){
    return "Electron";
  }
  return appName.replace(/ %d+$/, "");
}

function initDevices(cb = null) {
  listFFMPEGDevices(function (devices) {
    devices.forEach(function (e) {
      if (/.*screen.*/.test(e)) {
        videoDevice = e;
      }
      if (/.*Microphone.*/.test(e)) {
        audioDevice = e;
      }
      if (audioDevice == null) {
        if (/.*麦克风.*/.test(e)) {
          audioDevice = e;
        }
      }
      if (audioDevice == null) {
        if (/.*Audio.*/.test(e)) {
          audioDevice = e;
        }
      }
    });

    if (cb) {
      cb();
    }
  });
}

// cb takes (array of device names)
function listFFMPEGDevices(cb) {
  listDevices(function (output) {
    const deviceregexmac = /\[([0-9]+)\]\s(.+)/g;
    const deviceregexwin = /()"([\u4e00-\u9fa5A-Za-z0-9\- \(\)]+)"/g;
    let deviceregex = null;
    const devices = [];
    const plat = os.platform();

    if (plat == "darwin") {
      deviceregex = deviceregexmac;
    } else if (plat == "win32") {
      deviceregex = deviceregexwin;
    }

    let match = deviceregex.exec(output.toString());
    while (match != null) {
      devices.push(match[2]);
      if (plat == "darwin" && match[2] && match[2] == 'youmerecord') {
        macAudioDevice = match[1];
        Logger.LOGI('selected audio device:['+macAudioDevice+'] ' + match[2]);
      }
      match = deviceregex.exec(output.toString());
    }
    cb(devices);
  });
}

// cb takes output
function listDevices(cb) {
  const plat = os.platform();

  if (plat == "darwin") {
    let ffmpeg_path = path.join(__dirname, 'ymscreenrecord');
    Logger.LOGI(`${ffmpeg_path}`);
    child_process.execFile(ffmpeg_path, ['-list_devices','1','-f','cgwindow','-i','dummy'], function (error, output, code) {
      cb(error);
    });
  } else if (plat == "win32") {
    let ffmpeg_path = path.join(__dirname, 'ymscreenrecord.exe');
    Logger.LOGI(`FFMPEG PATH: ${ffmpeg_path}`);

    child_process.execFile(ffmpeg_path,['-list_devices','true','-f','dshow','-i','dummy'], function (error, output, code) {
      cb(error);
    });
  }
}

// 获取显卡信息 目前只能获取Win平台
function getGraphicCardInfo(cb = null) {
  const plat = os.platform();
  if (plat === 'win32') {
    // Availability="3" 表示Runing/full power
    child_process.exec('Wmic Path Win32_VideoController where Availability="3" get Caption', function (error, output, code) {
      if (cb) {
        cb(error, output, code);
      }
    });
  }
}

function start(destination, stop_cb = null, sdkAutoRetry = false) {
  userStop = false;
  if (proc !== null) {
    Logger.LOGW('already running push stream, stop old stream now');
    stop();
  }

  initDevices(function () {
    stream(videoDevice, audioDevice, destination, function (stream) {
      proc = stream;
    }, function (code) {
      if (code !== 0 ) {
        if (sdkAutoRetry && sdkAutoRetryCount !== 0) {
          sdkAutoRetryCount -= 1;
          proc = null;
          setTimeout(function () {
            Logger.LOGW(`screen record stop with error, now will retry ${sdkAutoRetryCount} times`);
            start(destination, stop_cb, sdkAutoRetry);
          }, 1200);
        } else {
          Logger.LOGE('screen record stop with error, code is:', code);
          stop_cb(code);
        }
      } else {
        Logger.LOGI('success stop record');
        stop_cb(code);
      }
    });
  });
}

function stop() {
  userStop = true;
  if (proc !== null && !proc.killed) {
    proc.kill();
  }
  proc = null;
  Logger.LOGW("Killed");
}

function is_runing() {
  return proc !== null;
}

// returns ffmpeg
// stream_cb(ffmpeg: ChildProcess)： 函数执行成功后的回调
function stream(video_device, audio_device, destination, stream_cb = null, stop_cb = null) {
  let ffmpeg = null;
  const plat = os.platform();
  const BrowserWindow = require('electron').remote.getCurrentWindow();
  const size = BrowserWindow.getSize();
  const pos = BrowserWindow.getPosition();
  // 获取当前窗体的title
  const title = BrowserWindow.getTitle();
  
  if (plat == "darwin") {
    const appName = getAppName();
    let ffmpeg_proc = path.join(__dirname, 'ymscreenrecord');
    Logger.LOGI(`${appName}`)
    ffmpeg = child_process.execFile(`${ffmpeg_proc}`, [
      "-f", "cgwindow",
      "-framerate", "15",
      // "-r", "15",
      "-video_size", size[0] + "x" + size[1],
      "-i", `title=[${appName}] ${title}:${macAudioDevice}`,
      "-c:v", "h264_videotoolbox",
      // "-profile:v", "baseline",
      "-pix_fmt", "yuv420p",
      "-preset", "veryfast",
      "-b:v", "1536k",
      "-keyint_min", "60",
      "-g", "30",
      "-sc_threshold","0",

      "-c:a","aac",
      "-ar", "44100",
      "-ac", "1",
      "-b:a", "64k",
      "-f", "flv", destination
    ]);

    if (typeof (ffmpeg) === 'undefined'){
      stop_cb(1); // 调用失败，异常退出
      return;
    }

    ffmpeg.stdout.on('data', function (data) {
       Logger.LOGI(`${data}\n`);
    });

    ffmpeg.stderr.on('data', function (data) {
      let msg = `ERROR: ${data}`;
       Logger.LOGI(`${msg}\n`);
    });

    ffmpeg.on('close', function (code) {
      let msg = `ffmpeg exited with code '${code}'`;
      Logger.LOGW(`${msg}\n`);
      if (proc !== null && !proc.killed) { // 处理掉进程
          proc.kill();
      }
      proc = null;

      if (stop_cb) {
        userStop ? stop_cb(0) : stop_cb(1); // 0 - 正常退出 1 - 异常退出
      }
    });

    // return ffmpeg;
    if (stream_cb) {
      stream_cb(ffmpeg);
    }

  } else if (plat == "win32") {
    let ffmpeg_proc = path.join(__dirname, 'ymscreenrecord.exe');

    getGraphicCardInfo(function (error, output, code) {
      if (!error) {
        if ((/NVIDIA/ig).test(output)) {
          Logger.LOGI('当前显卡为N卡');
          libs = 'h264_nvenc';
        }
        if ((/Intel/ig).test(output)) {
          Logger.LOGI('当前显卡为A卡');
          libs = 'h264_qsv';
        }
      }
      Logger.LOGI('getGraphicCardInfo: ', output);
      Logger.LOGI('current libs', libs);

      // ffmpeg = child_process.execFile(`${ffmpeg_proc}`, [
      //   "-f", "dshow",
      //   "-i", `audio="${audio_device}"`,
      //   "-f", "gdigrab",
      //   "-framerate", "15",
      //   // "-video_size", "1920x1080",        
      //   "-i", `"title=${title}"`,
      //   "-c:v", `"${libs}"`, //"libx264", "h264_qsv","h264_nvenc"
      //   "-pix_fmt", "yuv420p",
      //   "-qp", "0",
      //   "-qscale","0",
      //   "-preset:v", "fast",
      //   // "-tune", "nolatency",
      //   "-async", "1",
      //   "-acodec", "aac",
      //   // "-profile:v","baseline",
      //   // "-level", "4.1",
      //   "-g", "25",
      //   "-bf", "0",
      //   "-ar", "44100",
      //   "-ac", "1",
      //   "-f", "flv", destination
      // ], {
      //     windowsVerbatimArguments: true
      // });

      ffmpeg = child_process.execFile(`${ffmpeg_proc}`, [
        "-f", "dshow",
        "-i", `audio="${audio_device}"`,
        "-f", "gdigrab",
        "-framerate", "15",
        "-video_size", "1920x1080",
        "-i", "desktop",        
        "-c:v", `"${libs}"`, //"libx264", "h264_qsv","h264_nvenc"
        "-pix_fmt", "yuv420p",
        // "-qp", "0",
        // "-qscale","0",
        "-preset:v", "fast",
        "-minrate", "1200k",
        "-maxrate", "1200k",
        "-b:v", "1200k",
        "-bufsize", "1200k",
        "-vf", "scale=1280:-1",
        "-async", "1",
        "-acodec", "aac",
        "-keyint_min", "60",
        "-g", "15",
        "-bf", "0",
        "-ar", "44100",
        "-ac", "1",
        "-f", "flv", destination
      ], {
          windowsVerbatimArguments: true
      });

      if (typeof (ffmpeg) === 'undefined'){
        stop_cb(1); // 异常退出
        return;
      }

      ffmpeg.stdout.on('data', function (data) {
        Logger.LOGI(`${data}\n`);
      });

      ffmpeg.stderr.on('data', function (data) {
        let msg = `ERROR: ${data}`;
        Logger.LOGI(`${msg}\n`);
      });

      ffmpeg.on('close', function (code) {
        let msg = `ffmpeg exited with code '${code}'`;
        Logger.LOGW(`${msg}\n`);

        if (proc !== null && !proc.killed) { // 处理掉进程
          proc.kill();
        }
        proc = null;

        // 非正常退出, 可能是因libs !== libx264导致的错误, 没用重试的情况下用libx264重试一次
        if (code && libs !== 'libx264' && !hasRetry) {
          libs = 'libx264';
          hasRetry = true;
          stream(video_device, audio_device, destination, stream_cb, stop_cb);
          Logger.LOGW(`try open stream again, use lib ${libs}!`);
        } else { // 在没有重试的情况下失败了先不返回stop_cb, 重试失败了才回调
          if (stop_cb) {
            userStop ? stop_cb(0) : stop_cb(1); // 0 - 正常退出 1 - 异常退出
          }
        }
      });

      // return ffmpeg;
      if (stream_cb) {
        stream_cb(ffmpeg);
      }
    });
  }

}

module.exports = {
  start,
  stop,
  is_runing,
  setLogLevel: Logger.setLogLevel,
  getLogLevel: LogLevel.getLogLevel,
  LogLevel
};