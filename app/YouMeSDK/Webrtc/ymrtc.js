(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.YMRTC = factory());
}(this, (function () {

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
var logDisabled_ = true;
var deprecationWarnings_ = true;

/**
 * Extract browser version out of the provided user agent string.
 *
 * @param {!string} uastring userAgent string.
 * @param {!string} expr Regular expression used as match criteria.
 * @param {!number} pos position in the version string to be returned.
 * @return {!number} browser version.
 */
function extractVersion(uastring, expr, pos) {
  var match = uastring.match(expr);
  return match && match.length >= pos && parseInt(match[pos], 10);
}

// Wraps the peerconnection event eventNameToWrap in a function
// which returns the modified event object (or false to prevent
// the event).
function wrapPeerConnectionEvent(window, eventNameToWrap, wrapper) {
  if (!window.RTCPeerConnection) {
    return;
  }
  var proto = window.RTCPeerConnection.prototype;
  var nativeAddEventListener = proto.addEventListener;
  proto.addEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap) {
      return nativeAddEventListener.apply(this, arguments);
    }
    var wrappedCallback = function(e) {
      var modifiedEvent = wrapper(e);
      if (modifiedEvent) {
        cb(modifiedEvent);
      }
    };
    this._eventMap = this._eventMap || {};
    this._eventMap[cb] = wrappedCallback;
    return nativeAddEventListener.apply(this, [nativeEventName,
      wrappedCallback]);
  };

  var nativeRemoveEventListener = proto.removeEventListener;
  proto.removeEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap || !this._eventMap
        || !this._eventMap[cb]) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    var unwrappedCb = this._eventMap[cb];
    delete this._eventMap[cb];
    return nativeRemoveEventListener.apply(this, [nativeEventName,
      unwrappedCb]);
  };

  Object.defineProperty(proto, 'on' + eventNameToWrap, {
    get: function() {
      return this['_on' + eventNameToWrap];
    },
    set: function(cb) {
      if (this['_on' + eventNameToWrap]) {
        this.removeEventListener(eventNameToWrap,
            this['_on' + eventNameToWrap]);
        delete this['_on' + eventNameToWrap];
      }
      if (cb) {
        this.addEventListener(eventNameToWrap,
            this['_on' + eventNameToWrap] = cb);
      }
    },
    enumerable: true,
    configurable: true
  });
}

// Utility methods.
var utils = {
  extractVersion: extractVersion,
  wrapPeerConnectionEvent: wrapPeerConnectionEvent,
  disableLog: function(bool) {
    if (typeof bool !== 'boolean') {
      return new Error('Argument type: ' + typeof bool +
          '. Please use a boolean.');
    }
    logDisabled_ = bool;
    return (bool) ? 'adapter.js logging disabled' :
        'adapter.js logging enabled';
  },

  /**
   * Disable or enable deprecation warnings
   * @param {!boolean} bool set to true to disable warnings.
   */
  disableWarnings: function(bool) {
    if (typeof bool !== 'boolean') {
      return new Error('Argument type: ' + typeof bool +
          '. Please use a boolean.');
    }
    deprecationWarnings_ = !bool;
    return 'adapter.js deprecation warnings ' + (bool ? 'disabled' : 'enabled');
  },

  log: function() {
    if (typeof window === 'object') {
      if (logDisabled_) {
        return;
      }
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log.apply(console, arguments);
      }
    }
  },

  /**
   * Shows a deprecation warning suggesting the modern and spec-compatible API.
   */
  deprecated: function(oldMethod, newMethod) {
    if (!deprecationWarnings_) {
      return;
    }
    console.warn(oldMethod + ' is deprecated, please use ' + newMethod +
        ' instead.');
  },

  /**
   * Browser detector.
   *
   * @return {object} result containing browser and version
   *     properties.
   */
  detectBrowser: function(window) {
    var navigator = window && window.navigator;

    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
      result.browser = 'Not a browser.';
      return result;
    }

    if (navigator.mozGetUserMedia) { // Firefox.
      result.browser = 'firefox';
      result.version = extractVersion(navigator.userAgent,
          /Firefox\/(\d+)\./, 1);
    } else if (navigator.webkitGetUserMedia) {
      // Chrome, Chromium, Webview, Opera.
      // Version matches Chrome/WebRTC version.
      result.browser = 'chrome';
      result.version = extractVersion(navigator.userAgent,
          /Chrom(e|ium)\/(\d+)\./, 2);
    } else if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) { // Edge.
      result.browser = 'edge';
      result.version = extractVersion(navigator.userAgent,
          /Edge\/(\d+).(\d+)$/, 2);
    } else if (window.RTCPeerConnection &&
        navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) { // Safari.
      result.browser = 'safari';
      result.version = extractVersion(navigator.userAgent,
          /AppleWebKit\/(\d+)\./, 1);
    } else { // Default fallthrough: not supported.
      result.browser = 'Not a supported browser.';
      return result;
    }

    return result;
  }
};

var logging = utils.log;

// Expose public methods.
var getusermedia = function(window) {
  var browserDetails = utils.detectBrowser(window);
  var navigator = window && window.navigator;

  var constraintsToChrome_ = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function(key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function(mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  var shimConstraints_ = function(constraints, func) {
    if (browserDetails.version >= 61) {
      return func(constraints);
    }
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && typeof constraints.audio === 'object') {
      var remap = function(obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };
      constraints = JSON.parse(JSON.stringify(constraints));
      remap(constraints.audio, 'autoGainControl', 'googAutoGainControl');
      remap(constraints.audio, 'noiseSuppression', 'googNoiseSuppression');
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile & surface pro.
      var face = constraints.video.facingMode;
      face = face && ((typeof face === 'object') ? face : {ideal: face});
      var getSupportedFacingModeLies = browserDetails.version < 66;

      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                    face.ideal === 'user' || face.ideal === 'environment')) &&
          !(navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().facingMode &&
            !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        var matches;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          matches = ['back', 'rear'];
        } else if (face.exact === 'user' || face.ideal === 'user') {
          matches = ['front'];
        }
        if (matches) {
          // Look for matches in label, or use last cam for back (typical).
          return navigator.mediaDevices.enumerateDevices()
          .then(function(devices) {
            devices = devices.filter(function(d) {
              return d.kind === 'videoinput';
            });
            var dev = devices.find(function(d) {
              return matches.some(function(match) {
                return d.label.toLowerCase().indexOf(match) !== -1;
              });
            });
            if (!dev && devices.length && matches.indexOf('back') !== -1) {
              dev = devices[devices.length - 1]; // more likely the back cam
            }
            if (dev) {
              constraints.video.deviceId = face.exact ? {exact: dev.deviceId} :
                                                        {ideal: dev.deviceId};
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  var shimError_ = function(e) {
    if (browserDetails.version >= 64) {
      return e;
    }
    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        PermissionDismissedError: 'NotAllowedError',
        InvalidStateError: 'NotAllowedError',
        DevicesNotFoundError: 'NotFoundError',
        ConstraintNotSatisfiedError: 'OverconstrainedError',
        TrackStartError: 'NotReadableError',
        MediaDeviceFailedDueToShutdown: 'NotAllowedError',
        MediaDeviceKillSwitchOn: 'NotAllowedError',
        TabCaptureError: 'AbortError',
        ScreenCaptureError: 'AbortError',
        DeviceCaptureError: 'AbortError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint || e.constraintName,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  var getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, function(c) {
      navigator.webkitGetUserMedia(c, onSuccess, function(e) {
        if (onError) {
          onError(shimError_(e));
        }
      });
    });
  };

  navigator.getUserMedia = getUserMedia_;

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      navigator.getUserMedia(constraints, resolve, reject);
    });
  };

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {
      getUserMedia: getUserMediaPromise_,
      enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return window.MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                kind: kinds[device.kind],
                deviceId: device.id,
                groupId: ''};
            }));
          });
        });
      },
      getSupportedConstraints: function() {
        return {
          deviceId: true, echoCancellation: true, facingMode: true,
          frameRate: true, height: true, width: true
        };
      }
    };
  }

  // A shim for getUserMedia method on the mediaDevices object.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return getUserMediaPromise_(constraints);
    };
  } else {
    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
    // function which returns a Promise, it does not accept spec-style
    // constraints.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, function(c) {
        return origGetUserMedia(c).then(function(stream) {
          if (c.audio && !stream.getAudioTracks().length ||
              c.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach(function(track) {
              track.stop();
            });
            throw new DOMException('', 'NotFoundError');
          }
          return stream;
        }, function(e) {
          return Promise.reject(shimError_(e));
        });
      });
    };
  }

  // Dummy devicechange event methods.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
    navigator.mediaDevices.addEventListener = function() {
      logging('Dummy mediaDevices.addEventListener called.');
    };
  }
  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
    navigator.mediaDevices.removeEventListener = function() {
      logging('Dummy mediaDevices.removeEventListener called.');
    };
  }
};

var logging$1 = utils.log;

/* iterates the stats graph recursively. */
function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }
  resultSet.set(base.id, base);
  Object.keys(base).forEach(function(name) {
    if (name.endsWith('Id')) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith('Ids')) {
      base[name].forEach(function(id) {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}

/* filter getStats for a sender/receiver track. */
function filterStats(result, track, outbound) {
  var streamStatsType = outbound ? 'outbound-rtp' : 'inbound-rtp';
  var filteredResult = new Map();
  if (track === null) {
    return filteredResult;
  }
  var trackStats = [];
  result.forEach(function(value) {
    if (value.type === 'track' &&
        value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach(function(trackStat) {
    result.forEach(function(stats) {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}

var chrome_shim = {
  shimGetUserMedia: getusermedia,
  shimMediaStream: function(window) {
    window.MediaStream = window.MediaStream || window.webkitMediaStream;
  },

  shimOnTrack: function(window) {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
          }
          this.addEventListener('track', this._ontrack = f);
        },
        enumerable: true,
        configurable: true
      });
      var origSetRemoteDescription =
          window.RTCPeerConnection.prototype.setRemoteDescription;
      window.RTCPeerConnection.prototype.setRemoteDescription = function() {
        var pc = this;
        if (!pc._ontrackpoly) {
          pc._ontrackpoly = function(e) {
            // onaddstream does not fire when a track is added to an existing
            // stream. But stream.onaddtrack is implemented so we use that.
            e.stream.addEventListener('addtrack', function(te) {
              var receiver;
              if (window.RTCPeerConnection.prototype.getReceivers) {
                receiver = pc.getReceivers().find(function(r) {
                  return r.track && r.track.id === te.track.id;
                });
              } else {
                receiver = {track: te.track};
              }

              var event = new Event('track');
              event.track = te.track;
              event.receiver = receiver;
              event.transceiver = {receiver: receiver};
              event.streams = [e.stream];
              pc.dispatchEvent(event);
            });
            e.stream.getTracks().forEach(function(track) {
              var receiver;
              if (window.RTCPeerConnection.prototype.getReceivers) {
                receiver = pc.getReceivers().find(function(r) {
                  return r.track && r.track.id === track.id;
                });
              } else {
                receiver = {track: track};
              }
              var event = new Event('track');
              event.track = track;
              event.receiver = receiver;
              event.transceiver = {receiver: receiver};
              event.streams = [e.stream];
              pc.dispatchEvent(event);
            });
          };
          pc.addEventListener('addstream', pc._ontrackpoly);
        }
        return origSetRemoteDescription.apply(pc, arguments);
      };
    } else if (!('RTCRtpTransceiver' in window)) {
      utils.wrapPeerConnectionEvent(window, 'track', function(e) {
        if (!e.transceiver) {
          e.transceiver = {receiver: e.receiver};
        }
        return e;
      });
    }
  },

  shimGetSendersWithDtmf: function(window) {
    // Overrides addTrack/removeTrack, depends on shimAddTrackRemoveTrack.
    if (typeof window === 'object' && window.RTCPeerConnection &&
        !('getSenders' in window.RTCPeerConnection.prototype) &&
        'createDTMFSender' in window.RTCPeerConnection.prototype) {
      var shimSenderWithDtmf = function(pc, track) {
        return {
          track: track,
          get dtmf() {
            if (this._dtmf === undefined) {
              if (track.kind === 'audio') {
                this._dtmf = pc.createDTMFSender(track);
              } else {
                this._dtmf = null;
              }
            }
            return this._dtmf;
          },
          _pc: pc
        };
      };

      // augment addTrack when getSenders is not available.
      if (!window.RTCPeerConnection.prototype.getSenders) {
        window.RTCPeerConnection.prototype.getSenders = function() {
          this._senders = this._senders || [];
          return this._senders.slice(); // return a copy of the internal state.
        };
        var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
        window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
          var pc = this;
          var sender = origAddTrack.apply(pc, arguments);
          if (!sender) {
            sender = shimSenderWithDtmf(pc, track);
            pc._senders.push(sender);
          }
          return sender;
        };

        var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
        window.RTCPeerConnection.prototype.removeTrack = function(sender) {
          var pc = this;
          origRemoveTrack.apply(pc, arguments);
          var idx = pc._senders.indexOf(sender);
          if (idx !== -1) {
            pc._senders.splice(idx, 1);
          }
        };
      }
      var origAddStream = window.RTCPeerConnection.prototype.addStream;
      window.RTCPeerConnection.prototype.addStream = function(stream) {
        var pc = this;
        pc._senders = pc._senders || [];
        origAddStream.apply(pc, [stream]);
        stream.getTracks().forEach(function(track) {
          pc._senders.push(shimSenderWithDtmf(pc, track));
        });
      };

      var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
      window.RTCPeerConnection.prototype.removeStream = function(stream) {
        var pc = this;
        pc._senders = pc._senders || [];
        origRemoveStream.apply(pc, [stream]);

        stream.getTracks().forEach(function(track) {
          var sender = pc._senders.find(function(s) {
            return s.track === track;
          });
          if (sender) {
            pc._senders.splice(pc._senders.indexOf(sender), 1); // remove sender
          }
        });
      };
    } else if (typeof window === 'object' && window.RTCPeerConnection &&
               'getSenders' in window.RTCPeerConnection.prototype &&
               'createDTMFSender' in window.RTCPeerConnection.prototype &&
               window.RTCRtpSender &&
               !('dtmf' in window.RTCRtpSender.prototype)) {
      var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
      window.RTCPeerConnection.prototype.getSenders = function() {
        var pc = this;
        var senders = origGetSenders.apply(pc, []);
        senders.forEach(function(sender) {
          sender._pc = pc;
        });
        return senders;
      };

      Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
        get: function() {
          if (this._dtmf === undefined) {
            if (this.track.kind === 'audio') {
              this._dtmf = this._pc.createDTMFSender(this.track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        }
      });
    }
  },

  shimSenderReceiverGetStats: function(window) {
    if (!(typeof window === 'object' && window.RTCPeerConnection &&
        window.RTCRtpSender && window.RTCRtpReceiver)) {
      return;
    }

    // shim sender stats.
    if (!('getStats' in window.RTCRtpSender.prototype)) {
      var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
      if (origGetSenders) {
        window.RTCPeerConnection.prototype.getSenders = function() {
          var pc = this;
          var senders = origGetSenders.apply(pc, []);
          senders.forEach(function(sender) {
            sender._pc = pc;
          });
          return senders;
        };
      }

      var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
      if (origAddTrack) {
        window.RTCPeerConnection.prototype.addTrack = function() {
          var sender = origAddTrack.apply(this, arguments);
          sender._pc = this;
          return sender;
        };
      }
      window.RTCRtpSender.prototype.getStats = function() {
        var sender = this;
        return this._pc.getStats().then(function(result) {
          /* Note: this will include stats of all senders that
           *   send a track with the same id as sender.track as
           *   it is not possible to identify the RTCRtpSender.
           */
          return filterStats(result, sender.track, true);
        });
      };
    }

    // shim receiver stats.
    if (!('getStats' in window.RTCRtpReceiver.prototype)) {
      var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
      if (origGetReceivers) {
        window.RTCPeerConnection.prototype.getReceivers = function() {
          var pc = this;
          var receivers = origGetReceivers.apply(pc, []);
          receivers.forEach(function(receiver) {
            receiver._pc = pc;
          });
          return receivers;
        };
      }
      utils.wrapPeerConnectionEvent(window, 'track', function(e) {
        e.receiver._pc = e.srcElement;
        return e;
      });
      window.RTCRtpReceiver.prototype.getStats = function() {
        var receiver = this;
        return this._pc.getStats().then(function(result) {
          return filterStats(result, receiver.track, false);
        });
      };
    }

    if (!('getStats' in window.RTCRtpSender.prototype &&
        'getStats' in window.RTCRtpReceiver.prototype)) {
      return;
    }

    // shim RTCPeerConnection.getStats(track).
    var origGetStats = window.RTCPeerConnection.prototype.getStats;
    window.RTCPeerConnection.prototype.getStats = function() {
      var pc = this;
      if (arguments.length > 0 &&
          arguments[0] instanceof window.MediaStreamTrack) {
        var track = arguments[0];
        var sender;
        var receiver;
        var err;
        pc.getSenders().forEach(function(s) {
          if (s.track === track) {
            if (sender) {
              err = true;
            } else {
              sender = s;
            }
          }
        });
        pc.getReceivers().forEach(function(r) {
          if (r.track === track) {
            if (receiver) {
              err = true;
            } else {
              receiver = r;
            }
          }
          return r.track === track;
        });
        if (err || (sender && receiver)) {
          return Promise.reject(new DOMException(
            'There are more than one sender or receiver for the track.',
            'InvalidAccessError'));
        } else if (sender) {
          return sender.getStats();
        } else if (receiver) {
          return receiver.getStats();
        }
        return Promise.reject(new DOMException(
          'There is no sender or receiver for the track.',
          'InvalidAccessError'));
      }
      return origGetStats.apply(pc, arguments);
    };
  },

  shimSourceObject: function(window) {
    var URL = window && window.URL;

    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this._srcObject;
          },
          set: function(stream) {
            var self = this;
            // Use _srcObject as a private property for this shim
            this._srcObject = stream;
            if (this.src) {
              URL.revokeObjectURL(this.src);
            }

            if (!stream) {
              this.src = '';
              return undefined;
            }
            this.src = URL.createObjectURL(stream);
            // We need to recreate the blob url when a track is added or
            // removed. Doing it manually since we want to avoid a recursion.
            stream.addEventListener('addtrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
            stream.addEventListener('removetrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
          }
        });
      }
    }
  },

  shimAddTrackRemoveTrackWithNative: function(window) {
    // shim addTrack/removeTrack with native variants in order to make
    // the interactions with legacy getLocalStreams behave as in other browsers.
    // Keeps a mapping stream.id => [stream, rtpsenders...]
    window.RTCPeerConnection.prototype.getLocalStreams = function() {
      var pc = this;
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      return Object.keys(this._shimmedLocalStreams).map(function(streamId) {
        return pc._shimmedLocalStreams[streamId][0];
      });
    };

    var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
    window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
      if (!stream) {
        return origAddTrack.apply(this, arguments);
      }
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};

      var sender = origAddTrack.apply(this, arguments);
      if (!this._shimmedLocalStreams[stream.id]) {
        this._shimmedLocalStreams[stream.id] = [stream, sender];
      } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
        this._shimmedLocalStreams[stream.id].push(sender);
      }
      return sender;
    };

    var origAddStream = window.RTCPeerConnection.prototype.addStream;
    window.RTCPeerConnection.prototype.addStream = function(stream) {
      var pc = this;
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};

      stream.getTracks().forEach(function(track) {
        var alreadyExists = pc.getSenders().find(function(s) {
          return s.track === track;
        });
        if (alreadyExists) {
          throw new DOMException('Track already exists.',
              'InvalidAccessError');
        }
      });
      var existingSenders = pc.getSenders();
      origAddStream.apply(this, arguments);
      var newSenders = pc.getSenders().filter(function(newSender) {
        return existingSenders.indexOf(newSender) === -1;
      });
      this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
    };

    var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      delete this._shimmedLocalStreams[stream.id];
      return origRemoveStream.apply(this, arguments);
    };

    var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
    window.RTCPeerConnection.prototype.removeTrack = function(sender) {
      var pc = this;
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      if (sender) {
        Object.keys(this._shimmedLocalStreams).forEach(function(streamId) {
          var idx = pc._shimmedLocalStreams[streamId].indexOf(sender);
          if (idx !== -1) {
            pc._shimmedLocalStreams[streamId].splice(idx, 1);
          }
          if (pc._shimmedLocalStreams[streamId].length === 1) {
            delete pc._shimmedLocalStreams[streamId];
          }
        });
      }
      return origRemoveTrack.apply(this, arguments);
    };
  },

  shimAddTrackRemoveTrack: function(window) {
    var browserDetails = utils.detectBrowser(window);
    // shim addTrack and removeTrack.
    if (window.RTCPeerConnection.prototype.addTrack &&
        browserDetails.version >= 65) {
      return this.shimAddTrackRemoveTrackWithNative(window);
    }

    // also shim pc.getLocalStreams when addTrack is shimmed
    // to return the original streams.
    var origGetLocalStreams = window.RTCPeerConnection.prototype
        .getLocalStreams;
    window.RTCPeerConnection.prototype.getLocalStreams = function() {
      var pc = this;
      var nativeStreams = origGetLocalStreams.apply(this);
      pc._reverseStreams = pc._reverseStreams || {};
      return nativeStreams.map(function(stream) {
        return pc._reverseStreams[stream.id];
      });
    };

    var origAddStream = window.RTCPeerConnection.prototype.addStream;
    window.RTCPeerConnection.prototype.addStream = function(stream) {
      var pc = this;
      pc._streams = pc._streams || {};
      pc._reverseStreams = pc._reverseStreams || {};

      stream.getTracks().forEach(function(track) {
        var alreadyExists = pc.getSenders().find(function(s) {
          return s.track === track;
        });
        if (alreadyExists) {
          throw new DOMException('Track already exists.',
              'InvalidAccessError');
        }
      });
      // Add identity mapping for consistency with addTrack.
      // Unless this is being used with a stream from addTrack.
      if (!pc._reverseStreams[stream.id]) {
        var newStream = new window.MediaStream(stream.getTracks());
        pc._streams[stream.id] = newStream;
        pc._reverseStreams[newStream.id] = stream;
        stream = newStream;
      }
      origAddStream.apply(pc, [stream]);
    };

    var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      var pc = this;
      pc._streams = pc._streams || {};
      pc._reverseStreams = pc._reverseStreams || {};

      origRemoveStream.apply(pc, [(pc._streams[stream.id] || stream)]);
      delete pc._reverseStreams[(pc._streams[stream.id] ?
          pc._streams[stream.id].id : stream.id)];
      delete pc._streams[stream.id];
    };

    window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
      var pc = this;
      if (pc.signalingState === 'closed') {
        throw new DOMException(
          'The RTCPeerConnection\'s signalingState is \'closed\'.',
          'InvalidStateError');
      }
      var streams = [].slice.call(arguments, 1);
      if (streams.length !== 1 ||
          !streams[0].getTracks().find(function(t) {
            return t === track;
          })) {
        // this is not fully correct but all we can manage without
        // [[associated MediaStreams]] internal slot.
        throw new DOMException(
          'The adapter.js addTrack polyfill only supports a single ' +
          ' stream which is associated with the specified track.',
          'NotSupportedError');
      }

      var alreadyExists = pc.getSenders().find(function(s) {
        return s.track === track;
      });
      if (alreadyExists) {
        throw new DOMException('Track already exists.',
            'InvalidAccessError');
      }

      pc._streams = pc._streams || {};
      pc._reverseStreams = pc._reverseStreams || {};
      var oldStream = pc._streams[stream.id];
      if (oldStream) {
        // this is using odd Chrome behaviour, use with caution:
        // https://bugs.chromium.org/p/webrtc/issues/detail?id=7815
        // Note: we rely on the high-level addTrack/dtmf shim to
        // create the sender with a dtmf sender.
        oldStream.addTrack(track);

        // Trigger ONN async.
        Promise.resolve().then(function() {
          pc.dispatchEvent(new Event('negotiationneeded'));
        });
      } else {
        var newStream = new window.MediaStream([track]);
        pc._streams[stream.id] = newStream;
        pc._reverseStreams[newStream.id] = stream;
        pc.addStream(newStream);
      }
      return pc.getSenders().find(function(s) {
        return s.track === track;
      });
    };

    // replace the internal stream id with the external one and
    // vice versa.
    function replaceInternalStreamId(pc, description) {
      var sdp = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach(function(internalId) {
        var externalStream = pc._reverseStreams[internalId];
        var internalStream = pc._streams[externalStream.id];
        sdp = sdp.replace(new RegExp(internalStream.id, 'g'),
            externalStream.id);
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp: sdp
      });
    }
    function replaceExternalStreamId(pc, description) {
      var sdp = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach(function(internalId) {
        var externalStream = pc._reverseStreams[internalId];
        var internalStream = pc._streams[externalStream.id];
        sdp = sdp.replace(new RegExp(externalStream.id, 'g'),
            internalStream.id);
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp: sdp
      });
    }
    ['createOffer', 'createAnswer'].forEach(function(method) {
      var nativeMethod = window.RTCPeerConnection.prototype[method];
      window.RTCPeerConnection.prototype[method] = function() {
        var pc = this;
        var args = arguments;
        var isLegacyCall = arguments.length &&
            typeof arguments[0] === 'function';
        if (isLegacyCall) {
          return nativeMethod.apply(pc, [
            function(description) {
              var desc = replaceInternalStreamId(pc, description);
              args[0].apply(null, [desc]);
            },
            function(err) {
              if (args[1]) {
                args[1].apply(null, err);
              }
            }, arguments[2]
          ]);
        }
        return nativeMethod.apply(pc, arguments)
        .then(function(description) {
          return replaceInternalStreamId(pc, description);
        });
      };
    });

    var origSetLocalDescription =
        window.RTCPeerConnection.prototype.setLocalDescription;
    window.RTCPeerConnection.prototype.setLocalDescription = function() {
      var pc = this;
      if (!arguments.length || !arguments[0].type) {
        return origSetLocalDescription.apply(pc, arguments);
      }
      arguments[0] = replaceExternalStreamId(pc, arguments[0]);
      return origSetLocalDescription.apply(pc, arguments);
    };

    // TODO: mangle getStats: https://w3c.github.io/webrtc-stats/#dom-rtcmediastreamstats-streamidentifier

    var origLocalDescription = Object.getOwnPropertyDescriptor(
        window.RTCPeerConnection.prototype, 'localDescription');
    Object.defineProperty(window.RTCPeerConnection.prototype,
        'localDescription', {
          get: function() {
            var pc = this;
            var description = origLocalDescription.get.apply(this);
            if (description.type === '') {
              return description;
            }
            return replaceInternalStreamId(pc, description);
          }
        });

    window.RTCPeerConnection.prototype.removeTrack = function(sender) {
      var pc = this;
      if (pc.signalingState === 'closed') {
        throw new DOMException(
          'The RTCPeerConnection\'s signalingState is \'closed\'.',
          'InvalidStateError');
      }
      // We can not yet check for sender instanceof RTCRtpSender
      // since we shim RTPSender. So we check if sender._pc is set.
      if (!sender._pc) {
        throw new DOMException('Argument 1 of RTCPeerConnection.removeTrack ' +
            'does not implement interface RTCRtpSender.', 'TypeError');
      }
      var isLocal = sender._pc === pc;
      if (!isLocal) {
        throw new DOMException('Sender was not created by this connection.',
            'InvalidAccessError');
      }

      // Search for the native stream the senders track belongs to.
      pc._streams = pc._streams || {};
      var stream;
      Object.keys(pc._streams).forEach(function(streamid) {
        var hasTrack = pc._streams[streamid].getTracks().find(function(track) {
          return sender.track === track;
        });
        if (hasTrack) {
          stream = pc._streams[streamid];
        }
      });

      if (stream) {
        if (stream.getTracks().length === 1) {
          // if this is the last track of the stream, remove the stream. This
          // takes care of any shimmed _senders.
          pc.removeStream(pc._reverseStreams[stream.id]);
        } else {
          // relying on the same odd chrome behaviour as above.
          stream.removeTrack(sender.track);
        }
        pc.dispatchEvent(new Event('negotiationneeded'));
      }
    };
  },

  shimPeerConnection: function(window) {
    var browserDetails = utils.detectBrowser(window);

    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        // Translate iceTransportPolicy to iceTransports,
        // see https://code.google.com/p/webrtc/issues/detail?id=4869
        // this was fixed in M56 along with unprefixing RTCPeerConnection.
        logging$1('PeerConnection');
        if (pcConfig && pcConfig.iceTransportPolicy) {
          pcConfig.iceTransports = pcConfig.iceTransportPolicy;
        }

        return new window.webkitRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype =
          window.webkitRTCPeerConnection.prototype;
      // wrap static methods. Currently just generateCertificate.
      if (window.webkitRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return window.webkitRTCPeerConnection.generateCertificate;
          }
        });
      }
    } else {
      // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
      var OrigPeerConnection = window.RTCPeerConnection;
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (pcConfig && pcConfig.iceServers) {
          var newIceServers = [];
          for (var i = 0; i < pcConfig.iceServers.length; i++) {
            var server = pcConfig.iceServers[i];
            if (!server.hasOwnProperty('urls') &&
                server.hasOwnProperty('url')) {
              utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
              server = JSON.parse(JSON.stringify(server));
              server.urls = server.url;
              newIceServers.push(server);
            } else {
              newIceServers.push(pcConfig.iceServers[i]);
            }
          }
          pcConfig.iceServers = newIceServers;
        }
        return new OrigPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
      // wrap static methods. Currently just generateCertificate.
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          return OrigPeerConnection.generateCertificate;
        }
      });
    }

    var origGetStats = window.RTCPeerConnection.prototype.getStats;
    window.RTCPeerConnection.prototype.getStats = function(selector,
        successCallback, errorCallback) {
      var pc = this;
      var args = arguments;

      // If selector is a function then we are in the old style stats so just
      // pass back the original getStats format to avoid breaking old users.
      if (arguments.length > 0 && typeof selector === 'function') {
        return origGetStats.apply(this, arguments);
      }

      // When spec-style getStats is supported, return those when called with
      // either no arguments or the selector argument is null.
      if (origGetStats.length === 0 && (arguments.length === 0 ||
          typeof arguments[0] !== 'function')) {
        return origGetStats.apply(this, []);
      }

      var fixChromeStats_ = function(response) {
        var standardReport = {};
        var reports = response.result();
        reports.forEach(function(report) {
          var standardStats = {
            id: report.id,
            timestamp: report.timestamp,
            type: {
              localcandidate: 'local-candidate',
              remotecandidate: 'remote-candidate'
            }[report.type] || report.type
          };
          report.names().forEach(function(name) {
            standardStats[name] = report.stat(name);
          });
          standardReport[standardStats.id] = standardStats;
        });

        return standardReport;
      };

      // shim getStats with maplike support
      var makeMapStats = function(stats) {
        return new Map(Object.keys(stats).map(function(key) {
          return [key, stats[key]];
        }));
      };

      if (arguments.length >= 2) {
        var successCallbackWrapper_ = function(response) {
          args[1](makeMapStats(fixChromeStats_(response)));
        };

        return origGetStats.apply(this, [successCallbackWrapper_,
          arguments[0]]);
      }

      // promise-support
      return new Promise(function(resolve, reject) {
        origGetStats.apply(pc, [
          function(response) {
            resolve(makeMapStats(fixChromeStats_(response)));
          }, reject]);
      }).then(successCallback, errorCallback);
    };

    // add promise support -- natively available in Chrome 51
    if (browserDetails.version < 51) {
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = window.RTCPeerConnection.prototype[method];
            window.RTCPeerConnection.prototype[method] = function() {
              var args = arguments;
              var pc = this;
              var promise = new Promise(function(resolve, reject) {
                nativeMethod.apply(pc, [args[0], resolve, reject]);
              });
              if (args.length < 2) {
                return promise;
              }
              return promise.then(function() {
                args[1].apply(null, []);
              },
              function(err) {
                if (args.length >= 3) {
                  args[2].apply(null, [err]);
                }
              });
            };
          });
    }

    // promise support for createOffer and createAnswer. Available (without
    // bugs) since M52: crbug/619289
    if (browserDetails.version < 52) {
      ['createOffer', 'createAnswer'].forEach(function(method) {
        var nativeMethod = window.RTCPeerConnection.prototype[method];
        window.RTCPeerConnection.prototype[method] = function() {
          var pc = this;
          if (arguments.length < 1 || (arguments.length === 1 &&
              typeof arguments[0] === 'object')) {
            var opts = arguments.length === 1 ? arguments[0] : undefined;
            return new Promise(function(resolve, reject) {
              nativeMethod.apply(pc, [resolve, reject, opts]);
            });
          }
          return nativeMethod.apply(this, arguments);
        };
      });
    }

    // shim implicit creation of RTCSessionDescription/RTCIceCandidate
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = window.RTCPeerConnection.prototype[method];
          window.RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                window.RTCIceCandidate :
                window.RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        window.RTCPeerConnection.prototype.addIceCandidate;
    window.RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };
  },

  fixNegotiationNeeded: function(window) {
    utils.wrapPeerConnectionEvent(window, 'negotiationneeded', function(e) {
      var pc = e.target;
      if (pc.signalingState !== 'stable') {
        return;
      }
      return e;
    });
  },

  shimGetDisplayMedia: function(window, getSourceId) {
    if ('getDisplayMedia' in window.navigator) {
      return;
    }
    // getSourceId is a function that returns a promise resolving with
    // the sourceId of the screen/window/tab to be shared.
    if (typeof getSourceId !== 'function') {
      console.error('shimGetDisplayMedia: getSourceId argument is not ' +
          'a function');
      return;
    }
    navigator.getDisplayMedia = function(constraints) {
      return getSourceId(constraints)
        .then(function(sourceId) {
          constraints.video = {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              maxFrameRate: constraints.video.frameRate || 3
            }
          };
          return navigator.mediaDevices.getUserMedia(constraints);
        });
    };
  }
};

// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
var filtericeservers = function(iceServers, edgeVersion) {
  var hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(function(server) {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
      }
      var isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(function(url) {
        var validTurn = url.indexOf('turn:') === 0 &&
            url.indexOf('transport=udp') !== -1 &&
            url.indexOf('turn:[') === -1 &&
            !hasTurn;

        if (validTurn) {
          hasTurn = true;
          return true;
        }
        return url.indexOf('stun:') === 0 && edgeVersion >= 14393 &&
            url.indexOf('?transport=udp') === -1;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
};

var sdp = createCommonjsModule(function (module) {
/* eslint-env node */
var SDPUtils = {};

// Generate an alphanumeric identifier for cname or mids.
// TODO: use UUIDs instead? https://gist.github.com/jed/982883
SDPUtils.generateIdentifier = function() {
  return Math.random().toString(36).substr(2, 10);
};

// The RTCP CNAME used by all peerconnections from the same JS.
SDPUtils.localCName = SDPUtils.generateIdentifier();

// Splits SDP into lines, dealing with both CRLF and LF.
SDPUtils.splitLines = function(blob) {
  return blob.trim().split('\n').map(function(line) {
    return line.trim();
  });
};
// Splits SDP into sessionpart and mediasections. Ensures CRLF.
SDPUtils.splitSections = function(blob) {
  var parts = blob.split('\nm=');
  return parts.map(function(part, index) {
    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
  });
};

// returns the session description.
SDPUtils.getDescription = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  return sections && sections[0];
};

// returns the individual media sections.
SDPUtils.getMediaSections = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  sections.shift();
  return sections;
};

// Returns lines that start with a certain prefix.
SDPUtils.matchPrefix = function(blob, prefix) {
  return SDPUtils.splitLines(blob).filter(function(line) {
    return line.indexOf(prefix) === 0;
  });
};

// Parses an ICE candidate line. Sample input:
// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
// rport 55996"
SDPUtils.parseCandidate = function(line) {
  var parts;
  // Parse both variants.
  if (line.indexOf('a=candidate:') === 0) {
    parts = line.substring(12).split(' ');
  } else {
    parts = line.substring(10).split(' ');
  }

  var candidate = {
    foundation: parts[0],
    component: parseInt(parts[1], 10),
    protocol: parts[2].toLowerCase(),
    priority: parseInt(parts[3], 10),
    ip: parts[4],
    port: parseInt(parts[5], 10),
    // skip parts[6] == 'typ'
    type: parts[7]
  };

  for (var i = 8; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'raddr':
        candidate.relatedAddress = parts[i + 1];
        break;
      case 'rport':
        candidate.relatedPort = parseInt(parts[i + 1], 10);
        break;
      case 'tcptype':
        candidate.tcpType = parts[i + 1];
        break;
      case 'ufrag':
        candidate.ufrag = parts[i + 1]; // for backward compability.
        candidate.usernameFragment = parts[i + 1];
        break;
      default: // extension handling, in particular ufrag
        candidate[parts[i]] = parts[i + 1];
        break;
    }
  }
  return candidate;
};

// Translates a candidate object into SDP candidate attribute.
SDPUtils.writeCandidate = function(candidate) {
  var sdp = [];
  sdp.push(candidate.foundation);
  sdp.push(candidate.component);
  sdp.push(candidate.protocol.toUpperCase());
  sdp.push(candidate.priority);
  sdp.push(candidate.ip);
  sdp.push(candidate.port);

  var type = candidate.type;
  sdp.push('typ');
  sdp.push(type);
  if (type !== 'host' && candidate.relatedAddress &&
      candidate.relatedPort) {
    sdp.push('raddr');
    sdp.push(candidate.relatedAddress);
    sdp.push('rport');
    sdp.push(candidate.relatedPort);
  }
  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
    sdp.push('tcptype');
    sdp.push(candidate.tcpType);
  }
  if (candidate.usernameFragment || candidate.ufrag) {
    sdp.push('ufrag');
    sdp.push(candidate.usernameFragment || candidate.ufrag);
  }
  return 'candidate:' + sdp.join(' ');
};

// Parses an ice-options line, returns an array of option tags.
// a=ice-options:foo bar
SDPUtils.parseIceOptions = function(line) {
  return line.substr(14).split(' ');
};

// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
// a=rtpmap:111 opus/48000/2
SDPUtils.parseRtpMap = function(line) {
  var parts = line.substr(9).split(' ');
  var parsed = {
    payloadType: parseInt(parts.shift(), 10) // was: id
  };

  parts = parts[0].split('/');

  parsed.name = parts[0];
  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
  parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
  // legacy alias, got renamed back to channels in ORTC.
  parsed.numChannels = parsed.channels;
  return parsed;
};

// Generate an a=rtpmap line from RTCRtpCodecCapability or
// RTCRtpCodecParameters.
SDPUtils.writeRtpMap = function(codec) {
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  var channels = codec.channels || codec.numChannels || 1;
  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
      (channels !== 1 ? '/' + channels : '') + '\r\n';
};

// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset
SDPUtils.parseExtmap = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    id: parseInt(parts[0], 10),
    direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
    uri: parts[1]
  };
};

// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
// RTCRtpHeaderExtension.
SDPUtils.writeExtmap = function(headerExtension) {
  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
      (headerExtension.direction && headerExtension.direction !== 'sendrecv'
          ? '/' + headerExtension.direction
          : '') +
      ' ' + headerExtension.uri + '\r\n';
};

// Parses an ftmp line, returns dictionary. Sample input:
// a=fmtp:96 vbr=on;cng=on
// Also deals with vbr=on; cng=on
SDPUtils.parseFmtp = function(line) {
  var parsed = {};
  var kv;
  var parts = line.substr(line.indexOf(' ') + 1).split(';');
  for (var j = 0; j < parts.length; j++) {
    kv = parts[j].trim().split('=');
    parsed[kv[0].trim()] = kv[1];
  }
  return parsed;
};

// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeFmtp = function(codec) {
  var line = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.parameters && Object.keys(codec.parameters).length) {
    var params = [];
    Object.keys(codec.parameters).forEach(function(param) {
      if (codec.parameters[param]) {
        params.push(param + '=' + codec.parameters[param]);
      } else {
        params.push(param);
      }
    });
    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
  }
  return line;
};

// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
// a=rtcp-fb:98 nack rpsi
SDPUtils.parseRtcpFb = function(line) {
  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
  return {
    type: parts.shift(),
    parameter: parts.join(' ')
  };
};
// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeRtcpFb = function(codec) {
  var lines = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
    // FIXME: special handling for trr-int?
    codec.rtcpFeedback.forEach(function(fb) {
      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
          '\r\n';
    });
  }
  return lines;
};

// Parses an RFC 5576 ssrc media attribute. Sample input:
// a=ssrc:3735928559 cname:something
SDPUtils.parseSsrcMedia = function(line) {
  var sp = line.indexOf(' ');
  var parts = {
    ssrc: parseInt(line.substr(7, sp - 7), 10)
  };
  var colon = line.indexOf(':', sp);
  if (colon > -1) {
    parts.attribute = line.substr(sp + 1, colon - sp - 1);
    parts.value = line.substr(colon + 1);
  } else {
    parts.attribute = line.substr(sp + 1);
  }
  return parts;
};

SDPUtils.parseSsrcGroup = function(line) {
  var parts = line.substr(13).split(' ');
  return {
    semantics: parts.shift(),
    ssrcs: parts.map(function(ssrc) {
      return parseInt(ssrc, 10);
    })
  };
};

// Extracts the MID (RFC 5888) from a media section.
// returns the MID or undefined if no mid line was found.
SDPUtils.getMid = function(mediaSection) {
  var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];
  if (mid) {
    return mid.substr(6);
  }
};

SDPUtils.parseFingerprint = function(line) {
  var parts = line.substr(14).split(' ');
  return {
    algorithm: parts[0].toLowerCase(), // algorithm is case-sensitive in Edge.
    value: parts[1]
  };
};

// Extracts DTLS parameters from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the fingerprint line as input. See also getIceParameters.
SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
      'a=fingerprint:');
  // Note: a=setup line is ignored since we use the 'auto' role.
  // Note2: 'algorithm' is not case sensitive except in Edge.
  return {
    role: 'auto',
    fingerprints: lines.map(SDPUtils.parseFingerprint)
  };
};

// Serializes DTLS parameters to SDP.
SDPUtils.writeDtlsParameters = function(params, setupType) {
  var sdp = 'a=setup:' + setupType + '\r\n';
  params.fingerprints.forEach(function(fp) {
    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
  });
  return sdp;
};
// Parses ICE information from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the ice-ufrag and ice-pwd lines as input.
SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.splitLines(mediaSection);
  // Search in session part, too.
  lines = lines.concat(SDPUtils.splitLines(sessionpart));
  var iceParameters = {
    usernameFragment: lines.filter(function(line) {
      return line.indexOf('a=ice-ufrag:') === 0;
    })[0].substr(12),
    password: lines.filter(function(line) {
      return line.indexOf('a=ice-pwd:') === 0;
    })[0].substr(10)
  };
  return iceParameters;
};

// Serializes ICE parameters to SDP.
SDPUtils.writeIceParameters = function(params) {
  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
      'a=ice-pwd:' + params.password + '\r\n';
};

// Parses the SDP media section and returns RTCRtpParameters.
SDPUtils.parseRtpParameters = function(mediaSection) {
  var description = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: [],
    rtcp: []
  };
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
    var pt = mline[i];
    var rtpmapline = SDPUtils.matchPrefix(
        mediaSection, 'a=rtpmap:' + pt + ' ')[0];
    if (rtpmapline) {
      var codec = SDPUtils.parseRtpMap(rtpmapline);
      var fmtps = SDPUtils.matchPrefix(
          mediaSection, 'a=fmtp:' + pt + ' ');
      // Only the first a=fmtp:<pt> is considered.
      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
      codec.rtcpFeedback = SDPUtils.matchPrefix(
          mediaSection, 'a=rtcp-fb:' + pt + ' ')
        .map(SDPUtils.parseRtcpFb);
      description.codecs.push(codec);
      // parse FEC mechanisms from rtpmap lines.
      switch (codec.name.toUpperCase()) {
        case 'RED':
        case 'ULPFEC':
          description.fecMechanisms.push(codec.name.toUpperCase());
          break;
        default: // only RED and ULPFEC are recognized as FEC mechanisms.
          break;
      }
    }
  }
  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
    description.headerExtensions.push(SDPUtils.parseExtmap(line));
  });
  // FIXME: parse rtcp.
  return description;
};

// Generates parts of the SDP media section describing the capabilities /
// parameters.
SDPUtils.writeRtpDescription = function(kind, caps) {
  var sdp = '';

  // Build the mline.
  sdp += 'm=' + kind + ' ';
  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
  sdp += ' UDP/TLS/RTP/SAVPF ';
  sdp += caps.codecs.map(function(codec) {
    if (codec.preferredPayloadType !== undefined) {
      return codec.preferredPayloadType;
    }
    return codec.payloadType;
  }).join(' ') + '\r\n';

  sdp += 'c=IN IP4 0.0.0.0\r\n';
  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
  caps.codecs.forEach(function(codec) {
    sdp += SDPUtils.writeRtpMap(codec);
    sdp += SDPUtils.writeFmtp(codec);
    sdp += SDPUtils.writeRtcpFb(codec);
  });
  var maxptime = 0;
  caps.codecs.forEach(function(codec) {
    if (codec.maxptime > maxptime) {
      maxptime = codec.maxptime;
    }
  });
  if (maxptime > 0) {
    sdp += 'a=maxptime:' + maxptime + '\r\n';
  }
  sdp += 'a=rtcp-mux\r\n';

  if (caps.headerExtensions) {
    caps.headerExtensions.forEach(function(extension) {
      sdp += SDPUtils.writeExtmap(extension);
    });
  }
  // FIXME: write fecMechanisms.
  return sdp;
};

// Parses the SDP media section and returns an array of
// RTCRtpEncodingParameters.
SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
  var encodingParameters = [];
  var description = SDPUtils.parseRtpParameters(mediaSection);
  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

  // filter a=ssrc:... cname:, ignore PlanB-msid
  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'cname';
  });
  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
  var secondarySsrc;

  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
  .map(function(line) {
    var parts = line.substr(17).split(' ');
    return parts.map(function(part) {
      return parseInt(part, 10);
    });
  });
  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
    secondarySsrc = flows[0][1];
  }

  description.codecs.forEach(function(codec) {
    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
      var encParam = {
        ssrc: primarySsrc,
        codecPayloadType: parseInt(codec.parameters.apt, 10)
      };
      if (primarySsrc && secondarySsrc) {
        encParam.rtx = {ssrc: secondarySsrc};
      }
      encodingParameters.push(encParam);
      if (hasRed) {
        encParam = JSON.parse(JSON.stringify(encParam));
        encParam.fec = {
          ssrc: secondarySsrc,
          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
        };
        encodingParameters.push(encParam);
      }
    }
  });
  if (encodingParameters.length === 0 && primarySsrc) {
    encodingParameters.push({
      ssrc: primarySsrc
    });
  }

  // we support both b=AS and b=TIAS but interpret AS as TIAS.
  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
  if (bandwidth.length) {
    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(7), 10);
    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
      // use formula from JSEP to convert b=AS to TIAS value.
      bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95
          - (50 * 40 * 8);
    } else {
      bandwidth = undefined;
    }
    encodingParameters.forEach(function(params) {
      params.maxBitrate = bandwidth;
    });
  }
  return encodingParameters;
};

// parses http://draft.ortc.org/#rtcrtcpparameters*
SDPUtils.parseRtcpParameters = function(mediaSection) {
  var rtcpParameters = {};

  // Gets the first SSRC. Note tha with RTX there might be multiple
  // SSRCs.
  var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
      .map(function(line) {
        return SDPUtils.parseSsrcMedia(line);
      })
      .filter(function(obj) {
        return obj.attribute === 'cname';
      })[0];
  if (remoteSsrc) {
    rtcpParameters.cname = remoteSsrc.value;
    rtcpParameters.ssrc = remoteSsrc.ssrc;
  }

  // Edge uses the compound attribute instead of reducedSize
  // compound is !reducedSize
  var rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
  rtcpParameters.reducedSize = rsize.length > 0;
  rtcpParameters.compound = rsize.length === 0;

  // parses the rtcp-mux attrіbute.
  // Note that Edge does not support unmuxed RTCP.
  var mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
  rtcpParameters.mux = mux.length > 0;

  return rtcpParameters;
};

// parses either a=msid: or a=ssrc:... msid lines and returns
// the id of the MediaStream and MediaStreamTrack.
SDPUtils.parseMsid = function(mediaSection) {
  var parts;
  var spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');
  if (spec.length === 1) {
    parts = spec[0].substr(7).split(' ');
    return {stream: parts[0], track: parts[1]};
  }
  var planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(msidParts) {
    return msidParts.attribute === 'msid';
  });
  if (planB.length > 0) {
    parts = planB[0].value.split(' ');
    return {stream: parts[0], track: parts[1]};
  }
};

// Generate a session ID for SDP.
// https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-20#section-5.2.1
// recommends using a cryptographically random +ve 64-bit value
// but right now this should be acceptable and within the right range
SDPUtils.generateSessionId = function() {
  return Math.random().toString().substr(2, 21);
};

// Write boilder plate for start of SDP
// sessId argument is optional - if not supplied it will
// be generated randomly
// sessVersion is optional and defaults to 2
SDPUtils.writeSessionBoilerplate = function(sessId, sessVer) {
  var sessionId;
  var version = sessVer !== undefined ? sessVer : 2;
  if (sessId) {
    sessionId = sessId;
  } else {
    sessionId = SDPUtils.generateSessionId();
  }
  // FIXME: sess-id should be an NTP timestamp.
  return 'v=0\r\n' +
      'o=thisisadapterortc ' + sessionId + ' ' + version +
        ' IN IP4 127.0.0.1\r\n' +
      's=-\r\n' +
      't=0 0\r\n';
};

SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.direction) {
    sdp += 'a=' + transceiver.direction + '\r\n';
  } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    // spec.
    var msid = 'msid:' + stream.id + ' ' +
        transceiver.rtpSender.track.id + '\r\n';
    sdp += 'a=' + msid;

    // for Chrome.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
};

// Gets the direction from the mediaSection or the sessionpart.
SDPUtils.getDirection = function(mediaSection, sessionpart) {
  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
  var lines = SDPUtils.splitLines(mediaSection);
  for (var i = 0; i < lines.length; i++) {
    switch (lines[i]) {
      case 'a=sendrecv':
      case 'a=sendonly':
      case 'a=recvonly':
      case 'a=inactive':
        return lines[i].substr(2);
      default:
        // FIXME: What should happen here?
    }
  }
  if (sessionpart) {
    return SDPUtils.getDirection(sessionpart);
  }
  return 'sendrecv';
};

SDPUtils.getKind = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  return mline[0].substr(2);
};

SDPUtils.isRejected = function(mediaSection) {
  return mediaSection.split(' ', 2)[1] === '0';
};

SDPUtils.parseMLine = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var parts = lines[0].substr(2).split(' ');
  return {
    kind: parts[0],
    port: parseInt(parts[1], 10),
    protocol: parts[2],
    fmt: parts.slice(3).join(' ')
  };
};

SDPUtils.parseOLine = function(mediaSection) {
  var line = SDPUtils.matchPrefix(mediaSection, 'o=')[0];
  var parts = line.substr(2).split(' ');
  return {
    username: parts[0],
    sessionId: parts[1],
    sessionVersion: parseInt(parts[2], 10),
    netType: parts[3],
    addressType: parts[4],
    address: parts[5]
  };
};

// a very naive interpretation of a valid SDP.
SDPUtils.isValidSDP = function(blob) {
  if (typeof blob !== 'string' || blob.length === 0) {
    return false;
  }
  var lines = SDPUtils.splitLines(blob);
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].length < 2 || lines[i].charAt(1) !== '=') {
      return false;
    }
    // TODO: check the modifier a bit more.
  }
  return true;
};

// Expose public methods.
{
  module.exports = SDPUtils;
}
});

function fixStatsType(stat) {
  return {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  }[stat.type] || stat.type;
}

function writeMediaSection(transceiver, caps, type, stream, dtlsRole) {
  var sdp$$1 = sdp.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp$$1 += sdp.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp$$1 += sdp.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : dtlsRole || 'active');

  sdp$$1 += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp$$1 += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp$$1 += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp$$1 += 'a=recvonly\r\n';
  } else {
    sdp$$1 += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    var trackId = transceiver.rtpSender._initialTrackId ||
        transceiver.rtpSender.track.id;
    transceiver.rtpSender._initialTrackId = trackId;
    // spec.
    var msid = 'msid:' + (stream ? stream.id : '-') + ' ' +
        trackId + '\r\n';
    sdp$$1 += 'a=' + msid;
    // for Chrome. Legacy should no longer be required.
    sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;

    // RTX
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp$$1 += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + sdp.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + sdp.localCName + '\r\n';
  }
  return sdp$$1;
}

// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
function filterIceServers(iceServers, edgeVersion) {
  var hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(function(server) {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        console.warn('RTCIceServer.url is deprecated! Use urls instead.');
      }
      var isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(function(url) {
        var validTurn = url.indexOf('turn:') === 0 &&
            url.indexOf('transport=udp') !== -1 &&
            url.indexOf('turn:[') === -1 &&
            !hasTurn;

        if (validTurn) {
          hasTurn = true;
          return true;
        }
        return url.indexOf('stun:') === 0 && edgeVersion >= 14393 &&
            url.indexOf('?transport=udp') === -1;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
}

// Determines the intersection of local and remote capabilities.
function getCommonCapabilities(localCapabilities, remoteCapabilities) {
  var commonCapabilities = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: []
  };

  var findCodecByPayloadType = function(pt, codecs) {
    pt = parseInt(pt, 10);
    for (var i = 0; i < codecs.length; i++) {
      if (codecs[i].payloadType === pt ||
          codecs[i].preferredPayloadType === pt) {
        return codecs[i];
      }
    }
  };

  var rtxCapabilityMatches = function(lRtx, rRtx, lCodecs, rCodecs) {
    var lCodec = findCodecByPayloadType(lRtx.parameters.apt, lCodecs);
    var rCodec = findCodecByPayloadType(rRtx.parameters.apt, rCodecs);
    return lCodec && rCodec &&
        lCodec.name.toLowerCase() === rCodec.name.toLowerCase();
  };

  localCapabilities.codecs.forEach(function(lCodec) {
    for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
      var rCodec = remoteCapabilities.codecs[i];
      if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
          lCodec.clockRate === rCodec.clockRate) {
        if (lCodec.name.toLowerCase() === 'rtx' &&
            lCodec.parameters && rCodec.parameters.apt) {
          // for RTX we need to find the local rtx that has a apt
          // which points to the same local codec as the remote one.
          if (!rtxCapabilityMatches(lCodec, rCodec,
              localCapabilities.codecs, remoteCapabilities.codecs)) {
            continue;
          }
        }
        rCodec = JSON.parse(JSON.stringify(rCodec)); // deepcopy
        // number of channels is the highest common number of channels
        rCodec.numChannels = Math.min(lCodec.numChannels,
            rCodec.numChannels);
        // push rCodec so we reply with offerer payload type
        commonCapabilities.codecs.push(rCodec);

        // determine common feedback mechanisms
        rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
          for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
            if (lCodec.rtcpFeedback[j].type === fb.type &&
                lCodec.rtcpFeedback[j].parameter === fb.parameter) {
              return true;
            }
          }
          return false;
        });
        // FIXME: also need to determine .parameters
        //  see https://github.com/openpeer/ortc/issues/569
        break;
      }
    }
  });

  localCapabilities.headerExtensions.forEach(function(lHeaderExtension) {
    for (var i = 0; i < remoteCapabilities.headerExtensions.length;
         i++) {
      var rHeaderExtension = remoteCapabilities.headerExtensions[i];
      if (lHeaderExtension.uri === rHeaderExtension.uri) {
        commonCapabilities.headerExtensions.push(rHeaderExtension);
        break;
      }
    }
  });

  // FIXME: fecMechanisms
  return commonCapabilities;
}

// is action=setLocalDescription with type allowed in signalingState
function isActionAllowedInSignalingState(action, type, signalingState) {
  return {
    offer: {
      setLocalDescription: ['stable', 'have-local-offer'],
      setRemoteDescription: ['stable', 'have-remote-offer']
    },
    answer: {
      setLocalDescription: ['have-remote-offer', 'have-local-pranswer'],
      setRemoteDescription: ['have-local-offer', 'have-remote-pranswer']
    }
  }[type][action].indexOf(signalingState) !== -1;
}

function maybeAddCandidate(iceTransport, candidate) {
  // Edge's internal representation adds some fields therefore
  // not all fieldѕ are taken into account.
  var alreadyAdded = iceTransport.getRemoteCandidates()
      .find(function(remoteCandidate) {
        return candidate.foundation === remoteCandidate.foundation &&
            candidate.ip === remoteCandidate.ip &&
            candidate.port === remoteCandidate.port &&
            candidate.priority === remoteCandidate.priority &&
            candidate.protocol === remoteCandidate.protocol &&
            candidate.type === remoteCandidate.type;
      });
  if (!alreadyAdded) {
    iceTransport.addRemoteCandidate(candidate);
  }
  return !alreadyAdded;
}


function makeError(name, description) {
  var e = new Error(description);
  e.name = name;
  // legacy error codes from https://heycam.github.io/webidl/#idl-DOMException-error-names
  e.code = {
    NotSupportedError: 9,
    InvalidStateError: 11,
    InvalidAccessError: 15,
    TypeError: undefined,
    OperationError: undefined
  }[name];
  return e;
}

var rtcpeerconnection = function(window, edgeVersion) {
  // https://w3c.github.io/mediacapture-main/#mediastream
  // Helper function to add the track to the stream and
  // dispatch the event ourselves.
  function addTrackToStreamAndFireEvent(track, stream) {
    stream.addTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('addtrack',
        {track: track}));
  }

  function removeTrackFromStreamAndFireEvent(track, stream) {
    stream.removeTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('removetrack',
        {track: track}));
  }

  function fireAddTrack(pc, track, receiver, streams) {
    var trackEvent = new Event('track');
    trackEvent.track = track;
    trackEvent.receiver = receiver;
    trackEvent.transceiver = {receiver: receiver};
    trackEvent.streams = streams;
    window.setTimeout(function() {
      pc._dispatchEvent('track', trackEvent);
    });
  }

  var RTCPeerConnection = function(config) {
    var pc = this;

    var _eventTarget = document.createDocumentFragment();
    ['addEventListener', 'removeEventListener', 'dispatchEvent']
        .forEach(function(method) {
          pc[method] = _eventTarget[method].bind(_eventTarget);
        });

    this.canTrickleIceCandidates = null;

    this.needNegotiation = false;

    this.localStreams = [];
    this.remoteStreams = [];

    this._localDescription = null;
    this._remoteDescription = null;

    this.signalingState = 'stable';
    this.iceConnectionState = 'new';
    this.connectionState = 'new';
    this.iceGatheringState = 'new';

    config = JSON.parse(JSON.stringify(config || {}));

    this.usingBundle = config.bundlePolicy === 'max-bundle';
    if (config.rtcpMuxPolicy === 'negotiate') {
      throw(makeError('NotSupportedError',
          'rtcpMuxPolicy \'negotiate\' is not supported'));
    } else if (!config.rtcpMuxPolicy) {
      config.rtcpMuxPolicy = 'require';
    }

    switch (config.iceTransportPolicy) {
      case 'all':
      case 'relay':
        break;
      default:
        config.iceTransportPolicy = 'all';
        break;
    }

    switch (config.bundlePolicy) {
      case 'balanced':
      case 'max-compat':
      case 'max-bundle':
        break;
      default:
        config.bundlePolicy = 'balanced';
        break;
    }

    config.iceServers = filterIceServers(config.iceServers || [], edgeVersion);

    this._iceGatherers = [];
    if (config.iceCandidatePoolSize) {
      for (var i = config.iceCandidatePoolSize; i > 0; i--) {
        this._iceGatherers.push(new window.RTCIceGatherer({
          iceServers: config.iceServers,
          gatherPolicy: config.iceTransportPolicy
        }));
      }
    } else {
      config.iceCandidatePoolSize = 0;
    }

    this._config = config;

    // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
    // everything that is needed to describe a SDP m-line.
    this.transceivers = [];

    this._sdpSessionId = sdp.generateSessionId();
    this._sdpSessionVersion = 0;

    this._dtlsRole = undefined; // role for a=setup to use in answers.

    this._isClosed = false;
  };

  Object.defineProperty(RTCPeerConnection.prototype, 'localDescription', {
    configurable: true,
    get: function() {
      return this._localDescription;
    }
  });
  Object.defineProperty(RTCPeerConnection.prototype, 'remoteDescription', {
    configurable: true,
    get: function() {
      return this._remoteDescription;
    }
  });

  // set up event handlers on prototype
  RTCPeerConnection.prototype.onicecandidate = null;
  RTCPeerConnection.prototype.onaddstream = null;
  RTCPeerConnection.prototype.ontrack = null;
  RTCPeerConnection.prototype.onremovestream = null;
  RTCPeerConnection.prototype.onsignalingstatechange = null;
  RTCPeerConnection.prototype.oniceconnectionstatechange = null;
  RTCPeerConnection.prototype.onconnectionstatechange = null;
  RTCPeerConnection.prototype.onicegatheringstatechange = null;
  RTCPeerConnection.prototype.onnegotiationneeded = null;
  RTCPeerConnection.prototype.ondatachannel = null;

  RTCPeerConnection.prototype._dispatchEvent = function(name, event) {
    if (this._isClosed) {
      return;
    }
    this.dispatchEvent(event);
    if (typeof this['on' + name] === 'function') {
      this['on' + name](event);
    }
  };

  RTCPeerConnection.prototype._emitGatheringStateChange = function() {
    var event = new Event('icegatheringstatechange');
    this._dispatchEvent('icegatheringstatechange', event);
  };

  RTCPeerConnection.prototype.getConfiguration = function() {
    return this._config;
  };

  RTCPeerConnection.prototype.getLocalStreams = function() {
    return this.localStreams;
  };

  RTCPeerConnection.prototype.getRemoteStreams = function() {
    return this.remoteStreams;
  };

  // internal helper to create a transceiver object.
  // (which is not yet the same as the WebRTC 1.0 transceiver)
  RTCPeerConnection.prototype._createTransceiver = function(kind, doNotAdd) {
    var hasBundleTransport = this.transceivers.length > 0;
    var transceiver = {
      track: null,
      iceGatherer: null,
      iceTransport: null,
      dtlsTransport: null,
      localCapabilities: null,
      remoteCapabilities: null,
      rtpSender: null,
      rtpReceiver: null,
      kind: kind,
      mid: null,
      sendEncodingParameters: null,
      recvEncodingParameters: null,
      stream: null,
      associatedRemoteMediaStreams: [],
      wantReceive: true
    };
    if (this.usingBundle && hasBundleTransport) {
      transceiver.iceTransport = this.transceivers[0].iceTransport;
      transceiver.dtlsTransport = this.transceivers[0].dtlsTransport;
    } else {
      var transports = this._createIceAndDtlsTransports();
      transceiver.iceTransport = transports.iceTransport;
      transceiver.dtlsTransport = transports.dtlsTransport;
    }
    if (!doNotAdd) {
      this.transceivers.push(transceiver);
    }
    return transceiver;
  };

  RTCPeerConnection.prototype.addTrack = function(track, stream) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call addTrack on a closed peerconnection.');
    }

    var alreadyExists = this.transceivers.find(function(s) {
      return s.track === track;
    });

    if (alreadyExists) {
      throw makeError('InvalidAccessError', 'Track already exists.');
    }

    var transceiver;
    for (var i = 0; i < this.transceivers.length; i++) {
      if (!this.transceivers[i].track &&
          this.transceivers[i].kind === track.kind) {
        transceiver = this.transceivers[i];
      }
    }
    if (!transceiver) {
      transceiver = this._createTransceiver(track.kind);
    }

    this._maybeFireNegotiationNeeded();

    if (this.localStreams.indexOf(stream) === -1) {
      this.localStreams.push(stream);
    }

    transceiver.track = track;
    transceiver.stream = stream;
    transceiver.rtpSender = new window.RTCRtpSender(track,
        transceiver.dtlsTransport);
    return transceiver.rtpSender;
  };

  RTCPeerConnection.prototype.addStream = function(stream) {
    var pc = this;
    if (edgeVersion >= 15025) {
      stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
      });
    } else {
      // Clone is necessary for local demos mostly, attaching directly
      // to two different senders does not work (build 10547).
      // Fixed in 15025 (or earlier)
      var clonedStream = stream.clone();
      stream.getTracks().forEach(function(track, idx) {
        var clonedTrack = clonedStream.getTracks()[idx];
        track.addEventListener('enabled', function(event) {
          clonedTrack.enabled = event.enabled;
        });
      });
      clonedStream.getTracks().forEach(function(track) {
        pc.addTrack(track, clonedStream);
      });
    }
  };

  RTCPeerConnection.prototype.removeTrack = function(sender) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call removeTrack on a closed peerconnection.');
    }

    if (!(sender instanceof window.RTCRtpSender)) {
      throw new TypeError('Argument 1 of RTCPeerConnection.removeTrack ' +
          'does not implement interface RTCRtpSender.');
    }

    var transceiver = this.transceivers.find(function(t) {
      return t.rtpSender === sender;
    });

    if (!transceiver) {
      throw makeError('InvalidAccessError',
          'Sender was not created by this connection.');
    }
    var stream = transceiver.stream;

    transceiver.rtpSender.stop();
    transceiver.rtpSender = null;
    transceiver.track = null;
    transceiver.stream = null;

    // remove the stream from the set of local streams
    var localStreams = this.transceivers.map(function(t) {
      return t.stream;
    });
    if (localStreams.indexOf(stream) === -1 &&
        this.localStreams.indexOf(stream) > -1) {
      this.localStreams.splice(this.localStreams.indexOf(stream), 1);
    }

    this._maybeFireNegotiationNeeded();
  };

  RTCPeerConnection.prototype.removeStream = function(stream) {
    var pc = this;
    stream.getTracks().forEach(function(track) {
      var sender = pc.getSenders().find(function(s) {
        return s.track === track;
      });
      if (sender) {
        pc.removeTrack(sender);
      }
    });
  };

  RTCPeerConnection.prototype.getSenders = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpSender;
    })
    .map(function(transceiver) {
      return transceiver.rtpSender;
    });
  };

  RTCPeerConnection.prototype.getReceivers = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpReceiver;
    })
    .map(function(transceiver) {
      return transceiver.rtpReceiver;
    });
  };


  RTCPeerConnection.prototype._createIceGatherer = function(sdpMLineIndex,
      usingBundle) {
    var pc = this;
    if (usingBundle && sdpMLineIndex > 0) {
      return this.transceivers[0].iceGatherer;
    } else if (this._iceGatherers.length) {
      return this._iceGatherers.shift();
    }
    var iceGatherer = new window.RTCIceGatherer({
      iceServers: this._config.iceServers,
      gatherPolicy: this._config.iceTransportPolicy
    });
    Object.defineProperty(iceGatherer, 'state',
        {value: 'new', writable: true}
    );

    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = [];
    this.transceivers[sdpMLineIndex].bufferCandidates = function(event) {
      var end = !event.candidate || Object.keys(event.candidate).length === 0;
      // polyfill since RTCIceGatherer.state is not implemented in
      // Edge 10547 yet.
      iceGatherer.state = end ? 'completed' : 'gathering';
      if (pc.transceivers[sdpMLineIndex].bufferedCandidateEvents !== null) {
        pc.transceivers[sdpMLineIndex].bufferedCandidateEvents.push(event);
      }
    };
    iceGatherer.addEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    return iceGatherer;
  };

  // start gathering from an RTCIceGatherer.
  RTCPeerConnection.prototype._gather = function(mid, sdpMLineIndex) {
    var pc = this;
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer.onlocalcandidate) {
      return;
    }
    var bufferedCandidateEvents =
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents;
    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = null;
    iceGatherer.removeEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    iceGatherer.onlocalcandidate = function(evt) {
      if (pc.usingBundle && sdpMLineIndex > 0) {
        // if we know that we use bundle we can drop candidates with
        // ѕdpMLineIndex > 0. If we don't do this then our state gets
        // confused since we dispose the extra ice gatherer.
        return;
      }
      var event = new Event('icecandidate');
      event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};

      var cand = evt.candidate;
      // Edge emits an empty object for RTCIceCandidateComplete‥
      var end = !cand || Object.keys(cand).length === 0;
      if (end) {
        // polyfill since RTCIceGatherer.state is not implemented in
        // Edge 10547 yet.
        if (iceGatherer.state === 'new' || iceGatherer.state === 'gathering') {
          iceGatherer.state = 'completed';
        }
      } else {
        if (iceGatherer.state === 'new') {
          iceGatherer.state = 'gathering';
        }
        // RTCIceCandidate doesn't have a component, needs to be added
        cand.component = 1;
        // also the usernameFragment. TODO: update SDP to take both variants.
        cand.ufrag = iceGatherer.getLocalParameters().usernameFragment;

        var serializedCandidate = sdp.writeCandidate(cand);
        event.candidate = Object.assign(event.candidate,
            sdp.parseCandidate(serializedCandidate));

        event.candidate.candidate = serializedCandidate;
        event.candidate.toJSON = function() {
          return {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          };
        };
      }

      // update local description.
      var sections = sdp.getMediaSections(pc._localDescription.sdp);
      if (!end) {
        sections[event.candidate.sdpMLineIndex] +=
            'a=' + event.candidate.candidate + '\r\n';
      } else {
        sections[event.candidate.sdpMLineIndex] +=
            'a=end-of-candidates\r\n';
      }
      pc._localDescription.sdp =
          sdp.getDescription(pc._localDescription.sdp) +
          sections.join('');
      var complete = pc.transceivers.every(function(transceiver) {
        return transceiver.iceGatherer &&
            transceiver.iceGatherer.state === 'completed';
      });

      if (pc.iceGatheringState !== 'gathering') {
        pc.iceGatheringState = 'gathering';
        pc._emitGatheringStateChange();
      }

      // Emit candidate. Also emit null candidate when all gatherers are
      // complete.
      if (!end) {
        pc._dispatchEvent('icecandidate', event);
      }
      if (complete) {
        pc._dispatchEvent('icecandidate', new Event('icecandidate'));
        pc.iceGatheringState = 'complete';
        pc._emitGatheringStateChange();
      }
    };

    // emit already gathered candidates.
    window.setTimeout(function() {
      bufferedCandidateEvents.forEach(function(e) {
        iceGatherer.onlocalcandidate(e);
      });
    }, 0);
  };

  // Create ICE transport and DTLS transport.
  RTCPeerConnection.prototype._createIceAndDtlsTransports = function() {
    var pc = this;
    var iceTransport = new window.RTCIceTransport(null);
    iceTransport.onicestatechange = function() {
      pc._updateIceConnectionState();
      pc._updateConnectionState();
    };

    var dtlsTransport = new window.RTCDtlsTransport(iceTransport);
    dtlsTransport.ondtlsstatechange = function() {
      pc._updateConnectionState();
    };
    dtlsTransport.onerror = function() {
      // onerror does not set state to failed by itself.
      Object.defineProperty(dtlsTransport, 'state',
          {value: 'failed', writable: true});
      pc._updateConnectionState();
    };

    return {
      iceTransport: iceTransport,
      dtlsTransport: dtlsTransport
    };
  };

  // Destroy ICE gatherer, ICE transport and DTLS transport.
  // Without triggering the callbacks.
  RTCPeerConnection.prototype._disposeIceAndDtlsTransports = function(
      sdpMLineIndex) {
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer) {
      delete iceGatherer.onlocalcandidate;
      delete this.transceivers[sdpMLineIndex].iceGatherer;
    }
    var iceTransport = this.transceivers[sdpMLineIndex].iceTransport;
    if (iceTransport) {
      delete iceTransport.onicestatechange;
      delete this.transceivers[sdpMLineIndex].iceTransport;
    }
    var dtlsTransport = this.transceivers[sdpMLineIndex].dtlsTransport;
    if (dtlsTransport) {
      delete dtlsTransport.ondtlsstatechange;
      delete dtlsTransport.onerror;
      delete this.transceivers[sdpMLineIndex].dtlsTransport;
    }
  };

  // Start the RTP Sender and Receiver for a transceiver.
  RTCPeerConnection.prototype._transceive = function(transceiver,
      send, recv) {
    var params = getCommonCapabilities(transceiver.localCapabilities,
        transceiver.remoteCapabilities);
    if (send && transceiver.rtpSender) {
      params.encodings = transceiver.sendEncodingParameters;
      params.rtcp = {
        cname: sdp.localCName,
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.recvEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
      }
      transceiver.rtpSender.send(params);
    }
    if (recv && transceiver.rtpReceiver && params.codecs.length > 0) {
      // remove RTX field in Edge 14942
      if (transceiver.kind === 'video'
          && transceiver.recvEncodingParameters
          && edgeVersion < 15019) {
        transceiver.recvEncodingParameters.forEach(function(p) {
          delete p.rtx;
        });
      }
      if (transceiver.recvEncodingParameters.length) {
        params.encodings = transceiver.recvEncodingParameters;
      } else {
        params.encodings = [{}];
      }
      params.rtcp = {
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.rtcpParameters.cname) {
        params.rtcp.cname = transceiver.rtcpParameters.cname;
      }
      if (transceiver.sendEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
      }
      transceiver.rtpReceiver.receive(params);
    }
  };

  RTCPeerConnection.prototype.setLocalDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setLocalDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set local ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var sections;
    var sessionpart;
    if (description.type === 'offer') {
      // VERY limited support for SDP munging. Limited to:
      // * changing the order of codecs
      sections = sdp.splitSections(description.sdp);
      sessionpart = sections.shift();
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var caps = sdp.parseRtpParameters(mediaSection);
        pc.transceivers[sdpMLineIndex].localCapabilities = caps;
      });

      pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
        pc._gather(transceiver.mid, sdpMLineIndex);
      });
    } else if (description.type === 'answer') {
      sections = sdp.splitSections(pc._remoteDescription.sdp);
      sessionpart = sections.shift();
      var isIceLite = sdp.matchPrefix(sessionpart,
          'a=ice-lite').length > 0;
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var transceiver = pc.transceivers[sdpMLineIndex];
        var iceGatherer = transceiver.iceGatherer;
        var iceTransport = transceiver.iceTransport;
        var dtlsTransport = transceiver.dtlsTransport;
        var localCapabilities = transceiver.localCapabilities;
        var remoteCapabilities = transceiver.remoteCapabilities;

        // treat bundle-only as not-rejected.
        var rejected = sdp.isRejected(mediaSection) &&
            sdp.matchPrefix(mediaSection, 'a=bundle-only').length === 0;

        if (!rejected && !transceiver.rejected) {
          var remoteIceParameters = sdp.getIceParameters(
              mediaSection, sessionpart);
          var remoteDtlsParameters = sdp.getDtlsParameters(
              mediaSection, sessionpart);
          if (isIceLite) {
            remoteDtlsParameters.role = 'server';
          }

          if (!pc.usingBundle || sdpMLineIndex === 0) {
            pc._gather(transceiver.mid, sdpMLineIndex);
            if (iceTransport.state === 'new') {
              iceTransport.start(iceGatherer, remoteIceParameters,
                  isIceLite ? 'controlling' : 'controlled');
            }
            if (dtlsTransport.state === 'new') {
              dtlsTransport.start(remoteDtlsParameters);
            }
          }

          // Calculate intersection of capabilities.
          var params = getCommonCapabilities(localCapabilities,
              remoteCapabilities);

          // Start the RTCRtpSender. The RTCRtpReceiver for this
          // transceiver has already been started in setRemoteDescription.
          pc._transceive(transceiver,
              params.codecs.length > 0,
              false);
        }
      });
    }

    pc._localDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-local-offer');
    } else {
      pc._updateSignalingState('stable');
    }

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.setRemoteDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setRemoteDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set remote ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var streams = {};
    pc.remoteStreams.forEach(function(stream) {
      streams[stream.id] = stream;
    });
    var receiverList = [];
    var sections = sdp.splitSections(description.sdp);
    var sessionpart = sections.shift();
    var isIceLite = sdp.matchPrefix(sessionpart,
        'a=ice-lite').length > 0;
    var usingBundle = sdp.matchPrefix(sessionpart,
        'a=group:BUNDLE ').length > 0;
    pc.usingBundle = usingBundle;
    var iceOptions = sdp.matchPrefix(sessionpart,
        'a=ice-options:')[0];
    if (iceOptions) {
      pc.canTrickleIceCandidates = iceOptions.substr(14).split(' ')
          .indexOf('trickle') >= 0;
    } else {
      pc.canTrickleIceCandidates = false;
    }

    sections.forEach(function(mediaSection, sdpMLineIndex) {
      var lines = sdp.splitLines(mediaSection);
      var kind = sdp.getKind(mediaSection);
      // treat bundle-only as not-rejected.
      var rejected = sdp.isRejected(mediaSection) &&
          sdp.matchPrefix(mediaSection, 'a=bundle-only').length === 0;
      var protocol = lines[0].substr(2).split(' ')[2];

      var direction = sdp.getDirection(mediaSection, sessionpart);
      var remoteMsid = sdp.parseMsid(mediaSection);

      var mid = sdp.getMid(mediaSection) || sdp.generateIdentifier();

      // Reject datachannels which are not implemented yet.
      if (rejected || (kind === 'application' && (protocol === 'DTLS/SCTP' ||
          protocol === 'UDP/DTLS/SCTP'))) {
        // TODO: this is dangerous in the case where a non-rejected m-line
        //     becomes rejected.
        pc.transceivers[sdpMLineIndex] = {
          mid: mid,
          kind: kind,
          protocol: protocol,
          rejected: true
        };
        return;
      }

      if (!rejected && pc.transceivers[sdpMLineIndex] &&
          pc.transceivers[sdpMLineIndex].rejected) {
        // recycle a rejected transceiver.
        pc.transceivers[sdpMLineIndex] = pc._createTransceiver(kind, true);
      }

      var transceiver;
      var iceGatherer;
      var iceTransport;
      var dtlsTransport;
      var rtpReceiver;
      var sendEncodingParameters;
      var recvEncodingParameters;
      var localCapabilities;

      var track;
      // FIXME: ensure the mediaSection has rtcp-mux set.
      var remoteCapabilities = sdp.parseRtpParameters(mediaSection);
      var remoteIceParameters;
      var remoteDtlsParameters;
      if (!rejected) {
        remoteIceParameters = sdp.getIceParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters = sdp.getDtlsParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters.role = 'client';
      }
      recvEncodingParameters =
          sdp.parseRtpEncodingParameters(mediaSection);

      var rtcpParameters = sdp.parseRtcpParameters(mediaSection);

      var isComplete = sdp.matchPrefix(mediaSection,
          'a=end-of-candidates', sessionpart).length > 0;
      var cands = sdp.matchPrefix(mediaSection, 'a=candidate:')
          .map(function(cand) {
            return sdp.parseCandidate(cand);
          })
          .filter(function(cand) {
            return cand.component === 1;
          });

      // Check if we can use BUNDLE and dispose transports.
      if ((description.type === 'offer' || description.type === 'answer') &&
          !rejected && usingBundle && sdpMLineIndex > 0 &&
          pc.transceivers[sdpMLineIndex]) {
        pc._disposeIceAndDtlsTransports(sdpMLineIndex);
        pc.transceivers[sdpMLineIndex].iceGatherer =
            pc.transceivers[0].iceGatherer;
        pc.transceivers[sdpMLineIndex].iceTransport =
            pc.transceivers[0].iceTransport;
        pc.transceivers[sdpMLineIndex].dtlsTransport =
            pc.transceivers[0].dtlsTransport;
        if (pc.transceivers[sdpMLineIndex].rtpSender) {
          pc.transceivers[sdpMLineIndex].rtpSender.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
        if (pc.transceivers[sdpMLineIndex].rtpReceiver) {
          pc.transceivers[sdpMLineIndex].rtpReceiver.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
      }
      if (description.type === 'offer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex] ||
            pc._createTransceiver(kind);
        transceiver.mid = mid;

        if (!transceiver.iceGatherer) {
          transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
              usingBundle);
        }

        if (cands.length && transceiver.iceTransport.state === 'new') {
          if (isComplete && (!usingBundle || sdpMLineIndex === 0)) {
            transceiver.iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        localCapabilities = window.RTCRtpReceiver.getCapabilities(kind);

        // filter RTX until additional stuff needed for RTX is implemented
        // in adapter.js
        if (edgeVersion < 15019) {
          localCapabilities.codecs = localCapabilities.codecs.filter(
              function(codec) {
                return codec.name !== 'rtx';
              });
        }

        sendEncodingParameters = transceiver.sendEncodingParameters || [{
          ssrc: (2 * sdpMLineIndex + 2) * 1001
        }];

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        var isNewTrack = false;
        if (direction === 'sendrecv' || direction === 'sendonly') {
          isNewTrack = !transceiver.rtpReceiver;
          rtpReceiver = transceiver.rtpReceiver ||
              new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);

          if (isNewTrack) {
            var stream;
            track = rtpReceiver.track;
            // FIXME: does not work with Plan B.
            if (remoteMsid && remoteMsid.stream === '-') {
              // no-op. a stream id of '-' means: no associated stream.
            } else if (remoteMsid) {
              if (!streams[remoteMsid.stream]) {
                streams[remoteMsid.stream] = new window.MediaStream();
                Object.defineProperty(streams[remoteMsid.stream], 'id', {
                  get: function() {
                    return remoteMsid.stream;
                  }
                });
              }
              Object.defineProperty(track, 'id', {
                get: function() {
                  return remoteMsid.track;
                }
              });
              stream = streams[remoteMsid.stream];
            } else {
              if (!streams.default) {
                streams.default = new window.MediaStream();
              }
              stream = streams.default;
            }
            if (stream) {
              addTrackToStreamAndFireEvent(track, stream);
              transceiver.associatedRemoteMediaStreams.push(stream);
            }
            receiverList.push([track, rtpReceiver, stream]);
          }
        } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track) {
          transceiver.associatedRemoteMediaStreams.forEach(function(s) {
            var nativeTrack = s.getTracks().find(function(t) {
              return t.id === transceiver.rtpReceiver.track.id;
            });
            if (nativeTrack) {
              removeTrackFromStreamAndFireEvent(nativeTrack, s);
            }
          });
          transceiver.associatedRemoteMediaStreams = [];
        }

        transceiver.localCapabilities = localCapabilities;
        transceiver.remoteCapabilities = remoteCapabilities;
        transceiver.rtpReceiver = rtpReceiver;
        transceiver.rtcpParameters = rtcpParameters;
        transceiver.sendEncodingParameters = sendEncodingParameters;
        transceiver.recvEncodingParameters = recvEncodingParameters;

        // Start the RTCRtpReceiver now. The RTPSender is started in
        // setLocalDescription.
        pc._transceive(pc.transceivers[sdpMLineIndex],
            false,
            isNewTrack);
      } else if (description.type === 'answer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex];
        iceGatherer = transceiver.iceGatherer;
        iceTransport = transceiver.iceTransport;
        dtlsTransport = transceiver.dtlsTransport;
        rtpReceiver = transceiver.rtpReceiver;
        sendEncodingParameters = transceiver.sendEncodingParameters;
        localCapabilities = transceiver.localCapabilities;

        pc.transceivers[sdpMLineIndex].recvEncodingParameters =
            recvEncodingParameters;
        pc.transceivers[sdpMLineIndex].remoteCapabilities =
            remoteCapabilities;
        pc.transceivers[sdpMLineIndex].rtcpParameters = rtcpParameters;

        if (cands.length && iceTransport.state === 'new') {
          if ((isIceLite || isComplete) &&
              (!usingBundle || sdpMLineIndex === 0)) {
            iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        if (!usingBundle || sdpMLineIndex === 0) {
          if (iceTransport.state === 'new') {
            iceTransport.start(iceGatherer, remoteIceParameters,
                'controlling');
          }
          if (dtlsTransport.state === 'new') {
            dtlsTransport.start(remoteDtlsParameters);
          }
        }

        pc._transceive(transceiver,
            direction === 'sendrecv' || direction === 'recvonly',
            direction === 'sendrecv' || direction === 'sendonly');

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        if (rtpReceiver &&
            (direction === 'sendrecv' || direction === 'sendonly')) {
          track = rtpReceiver.track;
          if (remoteMsid) {
            if (!streams[remoteMsid.stream]) {
              streams[remoteMsid.stream] = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams[remoteMsid.stream]);
            receiverList.push([track, rtpReceiver, streams[remoteMsid.stream]]);
          } else {
            if (!streams.default) {
              streams.default = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams.default);
            receiverList.push([track, rtpReceiver, streams.default]);
          }
        } else {
          // FIXME: actually the receiver should be created later.
          delete transceiver.rtpReceiver;
        }
      }
    });

    if (pc._dtlsRole === undefined) {
      pc._dtlsRole = description.type === 'offer' ? 'active' : 'passive';
    }

    pc._remoteDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-remote-offer');
    } else {
      pc._updateSignalingState('stable');
    }
    Object.keys(streams).forEach(function(sid) {
      var stream = streams[sid];
      if (stream.getTracks().length) {
        if (pc.remoteStreams.indexOf(stream) === -1) {
          pc.remoteStreams.push(stream);
          var event = new Event('addstream');
          event.stream = stream;
          window.setTimeout(function() {
            pc._dispatchEvent('addstream', event);
          });
        }

        receiverList.forEach(function(item) {
          var track = item[0];
          var receiver = item[1];
          if (stream.id !== item[2].id) {
            return;
          }
          fireAddTrack(pc, track, receiver, [stream]);
        });
      }
    });
    receiverList.forEach(function(item) {
      if (item[2]) {
        return;
      }
      fireAddTrack(pc, item[0], item[1], []);
    });

    // check whether addIceCandidate({}) was called within four seconds after
    // setRemoteDescription.
    window.setTimeout(function() {
      if (!(pc && pc.transceivers)) {
        return;
      }
      pc.transceivers.forEach(function(transceiver) {
        if (transceiver.iceTransport &&
            transceiver.iceTransport.state === 'new' &&
            transceiver.iceTransport.getRemoteCandidates().length > 0) {
          console.warn('Timeout for addRemoteCandidate. Consider sending ' +
              'an end-of-candidates notification');
          transceiver.iceTransport.addRemoteCandidate({});
        }
      });
    }, 4000);

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.close = function() {
    this.transceivers.forEach(function(transceiver) {
      /* not yet
      if (transceiver.iceGatherer) {
        transceiver.iceGatherer.close();
      }
      */
      if (transceiver.iceTransport) {
        transceiver.iceTransport.stop();
      }
      if (transceiver.dtlsTransport) {
        transceiver.dtlsTransport.stop();
      }
      if (transceiver.rtpSender) {
        transceiver.rtpSender.stop();
      }
      if (transceiver.rtpReceiver) {
        transceiver.rtpReceiver.stop();
      }
    });
    // FIXME: clean up tracks, local streams, remote streams, etc
    this._isClosed = true;
    this._updateSignalingState('closed');
  };

  // Update the signaling state.
  RTCPeerConnection.prototype._updateSignalingState = function(newState) {
    this.signalingState = newState;
    var event = new Event('signalingstatechange');
    this._dispatchEvent('signalingstatechange', event);
  };

  // Determine whether to fire the negotiationneeded event.
  RTCPeerConnection.prototype._maybeFireNegotiationNeeded = function() {
    var pc = this;
    if (this.signalingState !== 'stable' || this.needNegotiation === true) {
      return;
    }
    this.needNegotiation = true;
    window.setTimeout(function() {
      if (pc.needNegotiation) {
        pc.needNegotiation = false;
        var event = new Event('negotiationneeded');
        pc._dispatchEvent('negotiationneeded', event);
      }
    }, 0);
  };

  // Update the ice connection state.
  RTCPeerConnection.prototype._updateIceConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      checking: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      states[transceiver.iceTransport.state]++;
    });

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.checking > 0) {
      newState = 'checking';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    } else if (states.completed > 0) {
      newState = 'completed';
    }

    if (newState !== this.iceConnectionState) {
      this.iceConnectionState = newState;
      var event = new Event('iceconnectionstatechange');
      this._dispatchEvent('iceconnectionstatechange', event);
    }
  };

  // Update the connection state.
  RTCPeerConnection.prototype._updateConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      connecting: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      states[transceiver.iceTransport.state]++;
      states[transceiver.dtlsTransport.state]++;
    });
    // ICETransport.completed and connected are the same for this purpose.
    states.connected += states.completed;

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.connecting > 0) {
      newState = 'connecting';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    }

    if (newState !== this.connectionState) {
      this.connectionState = newState;
      var event = new Event('connectionstatechange');
      this._dispatchEvent('connectionstatechange', event);
    }
  };

  RTCPeerConnection.prototype.createOffer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createOffer after close'));
    }

    var numAudioTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'audio';
    }).length;
    var numVideoTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'video';
    }).length;

    // Determine number of audio and video tracks we need to send/recv.
    var offerOptions = arguments[0];
    if (offerOptions) {
      // Reject Chrome legacy constraints.
      if (offerOptions.mandatory || offerOptions.optional) {
        throw new TypeError(
            'Legacy mandatory/optional constraints not supported.');
      }
      if (offerOptions.offerToReceiveAudio !== undefined) {
        if (offerOptions.offerToReceiveAudio === true) {
          numAudioTracks = 1;
        } else if (offerOptions.offerToReceiveAudio === false) {
          numAudioTracks = 0;
        } else {
          numAudioTracks = offerOptions.offerToReceiveAudio;
        }
      }
      if (offerOptions.offerToReceiveVideo !== undefined) {
        if (offerOptions.offerToReceiveVideo === true) {
          numVideoTracks = 1;
        } else if (offerOptions.offerToReceiveVideo === false) {
          numVideoTracks = 0;
        } else {
          numVideoTracks = offerOptions.offerToReceiveVideo;
        }
      }
    }

    pc.transceivers.forEach(function(transceiver) {
      if (transceiver.kind === 'audio') {
        numAudioTracks--;
        if (numAudioTracks < 0) {
          transceiver.wantReceive = false;
        }
      } else if (transceiver.kind === 'video') {
        numVideoTracks--;
        if (numVideoTracks < 0) {
          transceiver.wantReceive = false;
        }
      }
    });

    // Create M-lines for recvonly streams.
    while (numAudioTracks > 0 || numVideoTracks > 0) {
      if (numAudioTracks > 0) {
        pc._createTransceiver('audio');
        numAudioTracks--;
      }
      if (numVideoTracks > 0) {
        pc._createTransceiver('video');
        numVideoTracks--;
      }
    }

    var sdp$$1 = sdp.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      // For each track, create an ice gatherer, ice transport,
      // dtls transport, potentially rtpsender and rtpreceiver.
      var track = transceiver.track;
      var kind = transceiver.kind;
      var mid = transceiver.mid || sdp.generateIdentifier();
      transceiver.mid = mid;

      if (!transceiver.iceGatherer) {
        transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
            pc.usingBundle);
      }

      var localCapabilities = window.RTCRtpSender.getCapabilities(kind);
      // filter RTX until additional stuff needed for RTX is implemented
      // in adapter.js
      if (edgeVersion < 15019) {
        localCapabilities.codecs = localCapabilities.codecs.filter(
            function(codec) {
              return codec.name !== 'rtx';
            });
      }
      localCapabilities.codecs.forEach(function(codec) {
        // work around https://bugs.chromium.org/p/webrtc/issues/detail?id=6552
        // by adding level-asymmetry-allowed=1
        if (codec.name === 'H264' &&
            codec.parameters['level-asymmetry-allowed'] === undefined) {
          codec.parameters['level-asymmetry-allowed'] = '1';
        }

        // for subsequent offers, we might have to re-use the payload
        // type of the last offer.
        if (transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.codecs) {
          transceiver.remoteCapabilities.codecs.forEach(function(remoteCodec) {
            if (codec.name.toLowerCase() === remoteCodec.name.toLowerCase() &&
                codec.clockRate === remoteCodec.clockRate) {
              codec.preferredPayloadType = remoteCodec.payloadType;
            }
          });
        }
      });
      localCapabilities.headerExtensions.forEach(function(hdrExt) {
        var remoteExtensions = transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.headerExtensions || [];
        remoteExtensions.forEach(function(rHdrExt) {
          if (hdrExt.uri === rHdrExt.uri) {
            hdrExt.id = rHdrExt.id;
          }
        });
      });

      // generate an ssrc now, to be used later in rtpSender.send
      var sendEncodingParameters = transceiver.sendEncodingParameters || [{
        ssrc: (2 * sdpMLineIndex + 1) * 1001
      }];
      if (track) {
        // add RTX
        if (edgeVersion >= 15019 && kind === 'video' &&
            !sendEncodingParameters[0].rtx) {
          sendEncodingParameters[0].rtx = {
            ssrc: sendEncodingParameters[0].ssrc + 1
          };
        }
      }

      if (transceiver.wantReceive) {
        transceiver.rtpReceiver = new window.RTCRtpReceiver(
            transceiver.dtlsTransport, kind);
      }

      transceiver.localCapabilities = localCapabilities;
      transceiver.sendEncodingParameters = sendEncodingParameters;
    });

    // always offer BUNDLE and dispose on return if not supported.
    if (pc._config.bundlePolicy !== 'max-compat') {
      sdp$$1 += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    sdp$$1 += 'a=ice-options:trickle\r\n';

    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      sdp$$1 += writeMediaSection(transceiver, transceiver.localCapabilities,
          'offer', transceiver.stream, pc._dtlsRole);
      sdp$$1 += 'a=rtcp-rsize\r\n';

      if (transceiver.iceGatherer && pc.iceGatheringState !== 'new' &&
          (sdpMLineIndex === 0 || !pc.usingBundle)) {
        transceiver.iceGatherer.getLocalCandidates().forEach(function(cand) {
          cand.component = 1;
          sdp$$1 += 'a=' + sdp.writeCandidate(cand) + '\r\n';
        });

        if (transceiver.iceGatherer.state === 'completed') {
          sdp$$1 += 'a=end-of-candidates\r\n';
        }
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'offer',
      sdp: sdp$$1
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.createAnswer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer after close'));
    }

    if (!(pc.signalingState === 'have-remote-offer' ||
        pc.signalingState === 'have-local-pranswer')) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer in signalingState ' + pc.signalingState));
    }

    var sdp$$1 = sdp.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    if (pc.usingBundle) {
      sdp$$1 += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    var mediaSectionsInOffer = sdp.getMediaSections(
        pc._remoteDescription.sdp).length;
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      if (sdpMLineIndex + 1 > mediaSectionsInOffer) {
        return;
      }
      if (transceiver.rejected) {
        if (transceiver.kind === 'application') {
          if (transceiver.protocol === 'DTLS/SCTP') { // legacy fmt
            sdp$$1 += 'm=application 0 DTLS/SCTP 5000\r\n';
          } else {
            sdp$$1 += 'm=application 0 ' + transceiver.protocol +
                ' webrtc-datachannel\r\n';
          }
        } else if (transceiver.kind === 'audio') {
          sdp$$1 += 'm=audio 0 UDP/TLS/RTP/SAVPF 0\r\n' +
              'a=rtpmap:0 PCMU/8000\r\n';
        } else if (transceiver.kind === 'video') {
          sdp$$1 += 'm=video 0 UDP/TLS/RTP/SAVPF 120\r\n' +
              'a=rtpmap:120 VP8/90000\r\n';
        }
        sdp$$1 += 'c=IN IP4 0.0.0.0\r\n' +
            'a=inactive\r\n' +
            'a=mid:' + transceiver.mid + '\r\n';
        return;
      }

      // FIXME: look at direction.
      if (transceiver.stream) {
        var localTrack;
        if (transceiver.kind === 'audio') {
          localTrack = transceiver.stream.getAudioTracks()[0];
        } else if (transceiver.kind === 'video') {
          localTrack = transceiver.stream.getVideoTracks()[0];
        }
        if (localTrack) {
          // add RTX
          if (edgeVersion >= 15019 && transceiver.kind === 'video' &&
              !transceiver.sendEncodingParameters[0].rtx) {
            transceiver.sendEncodingParameters[0].rtx = {
              ssrc: transceiver.sendEncodingParameters[0].ssrc + 1
            };
          }
        }
      }

      // Calculate intersection of capabilities.
      var commonCapabilities = getCommonCapabilities(
          transceiver.localCapabilities,
          transceiver.remoteCapabilities);

      var hasRtx = commonCapabilities.codecs.filter(function(c) {
        return c.name.toLowerCase() === 'rtx';
      }).length;
      if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
        delete transceiver.sendEncodingParameters[0].rtx;
      }

      sdp$$1 += writeMediaSection(transceiver, commonCapabilities,
          'answer', transceiver.stream, pc._dtlsRole);
      if (transceiver.rtcpParameters &&
          transceiver.rtcpParameters.reducedSize) {
        sdp$$1 += 'a=rtcp-rsize\r\n';
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'answer',
      sdp: sdp$$1
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
    var pc = this;
    var sections;
    if (candidate && !(candidate.sdpMLineIndex !== undefined ||
        candidate.sdpMid)) {
      return Promise.reject(new TypeError('sdpMLineIndex or sdpMid required'));
    }

    // TODO: needs to go into ops queue.
    return new Promise(function(resolve, reject) {
      if (!pc._remoteDescription) {
        return reject(makeError('InvalidStateError',
            'Can not add ICE candidate without a remote description'));
      } else if (!candidate || candidate.candidate === '') {
        for (var j = 0; j < pc.transceivers.length; j++) {
          if (pc.transceivers[j].rejected) {
            continue;
          }
          pc.transceivers[j].iceTransport.addRemoteCandidate({});
          sections = sdp.getMediaSections(pc._remoteDescription.sdp);
          sections[j] += 'a=end-of-candidates\r\n';
          pc._remoteDescription.sdp =
              sdp.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
          if (pc.usingBundle) {
            break;
          }
        }
      } else {
        var sdpMLineIndex = candidate.sdpMLineIndex;
        if (candidate.sdpMid) {
          for (var i = 0; i < pc.transceivers.length; i++) {
            if (pc.transceivers[i].mid === candidate.sdpMid) {
              sdpMLineIndex = i;
              break;
            }
          }
        }
        var transceiver = pc.transceivers[sdpMLineIndex];
        if (transceiver) {
          if (transceiver.rejected) {
            return resolve();
          }
          var cand = Object.keys(candidate.candidate).length > 0 ?
              sdp.parseCandidate(candidate.candidate) : {};
          // Ignore Chrome's invalid candidates since Edge does not like them.
          if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
            return resolve();
          }
          // Ignore RTCP candidates, we assume RTCP-MUX.
          if (cand.component && cand.component !== 1) {
            return resolve();
          }
          // when using bundle, avoid adding candidates to the wrong
          // ice transport. And avoid adding candidates added in the SDP.
          if (sdpMLineIndex === 0 || (sdpMLineIndex > 0 &&
              transceiver.iceTransport !== pc.transceivers[0].iceTransport)) {
            if (!maybeAddCandidate(transceiver.iceTransport, cand)) {
              return reject(makeError('OperationError',
                  'Can not add ICE candidate'));
            }
          }

          // update the remoteDescription.
          var candidateString = candidate.candidate.trim();
          if (candidateString.indexOf('a=') === 0) {
            candidateString = candidateString.substr(2);
          }
          sections = sdp.getMediaSections(pc._remoteDescription.sdp);
          sections[sdpMLineIndex] += 'a=' +
              (cand.type ? candidateString : 'end-of-candidates')
              + '\r\n';
          pc._remoteDescription.sdp =
              sdp.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
        } else {
          return reject(makeError('OperationError',
              'Can not add ICE candidate'));
        }
      }
      resolve();
    });
  };

  RTCPeerConnection.prototype.getStats = function(selector) {
    if (selector && selector instanceof window.MediaStreamTrack) {
      var senderOrReceiver = null;
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.rtpSender &&
            transceiver.rtpSender.track === selector) {
          senderOrReceiver = transceiver.rtpSender;
        } else if (transceiver.rtpReceiver &&
            transceiver.rtpReceiver.track === selector) {
          senderOrReceiver = transceiver.rtpReceiver;
        }
      });
      if (!senderOrReceiver) {
        throw makeError('InvalidAccessError', 'Invalid selector.');
      }
      return senderOrReceiver.getStats();
    }

    var promises = [];
    this.transceivers.forEach(function(transceiver) {
      ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
          'dtlsTransport'].forEach(function(method) {
            if (transceiver[method]) {
              promises.push(transceiver[method].getStats());
            }
          });
    });
    return Promise.all(promises).then(function(allStats) {
      var results = new Map();
      allStats.forEach(function(stats) {
        stats.forEach(function(stat) {
          results.set(stat.id, stat);
        });
      });
      return results;
    });
  };

  // fix low-level stat names and return Map instead of object.
  var ortcObjects = ['RTCRtpSender', 'RTCRtpReceiver', 'RTCIceGatherer',
    'RTCIceTransport', 'RTCDtlsTransport'];
  ortcObjects.forEach(function(ortcObjectName) {
    var obj = window[ortcObjectName];
    if (obj && obj.prototype && obj.prototype.getStats) {
      var nativeGetstats = obj.prototype.getStats;
      obj.prototype.getStats = function() {
        return nativeGetstats.apply(this)
        .then(function(nativeStats) {
          var mapStats = new Map();
          Object.keys(nativeStats).forEach(function(id) {
            nativeStats[id].type = fixStatsType(nativeStats[id]);
            mapStats.set(id, nativeStats[id]);
          });
          return mapStats;
        });
      };
    }
  });

  // legacy callback shims. Should be moved to adapter.js some days.
  var methods = ['createOffer', 'createAnswer'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[0] === 'function' ||
          typeof args[1] === 'function') { // legacy
        return nativeMethod.apply(this, [arguments[2]])
        .then(function(description) {
          if (typeof args[0] === 'function') {
            args[0].apply(null, [description]);
          }
        }, function(error) {
          if (typeof args[1] === 'function') {
            args[1].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  methods = ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function' ||
          typeof args[2] === 'function') { // legacy
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        }, function(error) {
          if (typeof args[2] === 'function') {
            args[2].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  // getStats is special. It doesn't have a spec legacy method yet we support
  // getStats(something, cb) without error callbacks.
  ['getStats'].forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function') {
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  return RTCPeerConnection;
};

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
// Expose public methods.
var getusermedia$2 = function(window) {
  var navigator = window && window.navigator;

  var shimError_ = function(e) {
    return {
      name: {PermissionDeniedError: 'NotAllowedError'}[e.name] || e.name,
      message: e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name;
      }
    };
  };

  // getUserMedia error shim.
  var origGetUserMedia = navigator.mediaDevices.getUserMedia.
      bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(c) {
    return origGetUserMedia(c).catch(function(e) {
      return Promise.reject(shimError_(e));
    });
  };
};

var edge_shim = {
  shimGetUserMedia: getusermedia$2,
  shimPeerConnection: function(window) {
    var browserDetails = utils.detectBrowser(window);

    if (window.RTCIceGatherer) {
      if (!window.RTCIceCandidate) {
        window.RTCIceCandidate = function(args) {
          return args;
        };
      }
      if (!window.RTCSessionDescription) {
        window.RTCSessionDescription = function(args) {
          return args;
        };
      }
      // this adds an additional event listener to MediaStrackTrack that signals
      // when a tracks enabled property was changed. Workaround for a bug in
      // addStream, see below. No longer required in 15025+
      if (browserDetails.version < 15025) {
        var origMSTEnabled = Object.getOwnPropertyDescriptor(
            window.MediaStreamTrack.prototype, 'enabled');
        Object.defineProperty(window.MediaStreamTrack.prototype, 'enabled', {
          set: function(value) {
            origMSTEnabled.set.call(this, value);
            var ev = new Event('enabled');
            ev.enabled = value;
            this.dispatchEvent(ev);
          }
        });
      }
    }

    // ORTC defines the DTMF sender a bit different.
    // https://github.com/w3c/ortc/issues/714
    if (window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
      Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
        get: function() {
          if (this._dtmf === undefined) {
            if (this.track.kind === 'audio') {
              this._dtmf = new window.RTCDtmfSender(this);
            } else if (this.track.kind === 'video') {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        }
      });
    }
    // Edge currently only implements the RTCDtmfSender, not the
    // RTCDTMFSender alias. See http://draft.ortc.org/#rtcdtmfsender2*
    if (window.RTCDtmfSender && !window.RTCDTMFSender) {
      window.RTCDTMFSender = window.RTCDtmfSender;
    }

    var RTCPeerConnectionShim = rtcpeerconnection(window,
        browserDetails.version);
    window.RTCPeerConnection = function(config) {
      if (config && config.iceServers) {
        config.iceServers = filtericeservers(config.iceServers);
      }
      return new RTCPeerConnectionShim(config);
    };
    window.RTCPeerConnection.prototype = RTCPeerConnectionShim.prototype;
  },
  shimReplaceTrack: function(window) {
    // ORTC has replaceTrack -- https://github.com/w3c/ortc/issues/614
    if (window.RTCRtpSender &&
        !('replaceTrack' in window.RTCRtpSender.prototype)) {
      window.RTCRtpSender.prototype.replaceTrack =
          window.RTCRtpSender.prototype.setTrack;
    }
  }
};

var logging$2 = utils.log;

// Expose public methods.
var getusermedia$4 = function(window) {
  var browserDetails = utils.detectBrowser(window);
  var navigator = window && window.navigator;
  var MediaStreamTrack = window && window.MediaStreamTrack;

  var shimError_ = function(e) {
    return {
      name: {
        InternalError: 'NotReadableError',
        NotSupportedError: 'TypeError',
        PermissionDeniedError: 'NotAllowedError',
        SecurityError: 'NotAllowedError'
      }[e.name] || e.name,
      message: {
        'The operation is insecure.': 'The request is not allowed by the ' +
        'user agent or the platform in the current context.'
      }[e.message] || e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  // getUserMedia constraints shim.
  var getUserMedia_ = function(constraints, onSuccess, onError) {
    var constraintsToFF37_ = function(c) {
      if (typeof c !== 'object' || c.require) {
        return c;
      }
      var require = [];
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = c[key] = (typeof c[key] === 'object') ?
            c[key] : {ideal: c[key]};
        if (r.min !== undefined ||
            r.max !== undefined || r.exact !== undefined) {
          require.push(key);
        }
        if (r.exact !== undefined) {
          if (typeof r.exact === 'number') {
            r. min = r.max = r.exact;
          } else {
            c[key] = r.exact;
          }
          delete r.exact;
        }
        if (r.ideal !== undefined) {
          c.advanced = c.advanced || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[key] = {min: r.ideal, max: r.ideal};
          } else {
            oc[key] = r.ideal;
          }
          c.advanced.push(oc);
          delete r.ideal;
          if (!Object.keys(r).length) {
            delete c[key];
          }
        }
      });
      if (require.length) {
        c.require = require;
      }
      return c;
    };
    constraints = JSON.parse(JSON.stringify(constraints));
    if (browserDetails.version < 38) {
      logging$2('spec: ' + JSON.stringify(constraints));
      if (constraints.audio) {
        constraints.audio = constraintsToFF37_(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToFF37_(constraints.video);
      }
      logging$2('ff37: ' + JSON.stringify(constraints));
    }
    return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
      onError(shimError_(e));
    });
  };

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      getUserMedia_(constraints, resolve, reject);
    });
  };

  // Shim for mediaDevices on older versions.
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
      addEventListener: function() { },
      removeEventListener: function() { }
    };
  }
  navigator.mediaDevices.enumerateDevices =
      navigator.mediaDevices.enumerateDevices || function() {
        return new Promise(function(resolve) {
          var infos = [
            {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
            {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
          ];
          resolve(infos);
        });
      };

  if (browserDetails.version < 41) {
    // Work around http://bugzil.la/1169665
    var orgEnumerateDevices =
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      return orgEnumerateDevices().then(undefined, function(e) {
        if (e.name === 'NotFoundError') {
          return [];
        }
        throw e;
      });
    };
  }
  if (browserDetails.version < 49) {
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      return origGetUserMedia(c).then(function(stream) {
        // Work around https://bugzil.la/802326
        if (c.audio && !stream.getAudioTracks().length ||
            c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach(function(track) {
            track.stop();
          });
          throw new DOMException('The object can not be found here.',
                                 'NotFoundError');
        }
        return stream;
      }, function(e) {
        return Promise.reject(shimError_(e));
      });
    };
  }
  if (!(browserDetails.version > 55 &&
      'autoGainControl' in navigator.mediaDevices.getSupportedConstraints())) {
    var remap = function(obj, a, b) {
      if (a in obj && !(b in obj)) {
        obj[b] = obj[a];
        delete obj[a];
      }
    };

    var nativeGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      if (typeof c === 'object' && typeof c.audio === 'object') {
        c = JSON.parse(JSON.stringify(c));
        remap(c.audio, 'autoGainControl', 'mozAutoGainControl');
        remap(c.audio, 'noiseSuppression', 'mozNoiseSuppression');
      }
      return nativeGetUserMedia(c);
    };

    if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
      var nativeGetSettings = MediaStreamTrack.prototype.getSettings;
      MediaStreamTrack.prototype.getSettings = function() {
        var obj = nativeGetSettings.apply(this, arguments);
        remap(obj, 'mozAutoGainControl', 'autoGainControl');
        remap(obj, 'mozNoiseSuppression', 'noiseSuppression');
        return obj;
      };
    }

    if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
      var nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
      MediaStreamTrack.prototype.applyConstraints = function(c) {
        if (this.kind === 'audio' && typeof c === 'object') {
          c = JSON.parse(JSON.stringify(c));
          remap(c, 'autoGainControl', 'mozAutoGainControl');
          remap(c, 'noiseSuppression', 'mozNoiseSuppression');
        }
        return nativeApplyConstraints.apply(this, [c]);
      };
    }
  }
  navigator.getUserMedia = function(constraints, onSuccess, onError) {
    if (browserDetails.version < 44) {
      return getUserMedia_(constraints, onSuccess, onError);
    }
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    utils.deprecated('navigator.getUserMedia',
        'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
};

var firefox_shim = {
  shimGetUserMedia: getusermedia$4,
  shimOnTrack: function(window) {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            e.stream.getTracks().forEach(function(track) {
              var event = new Event('track');
              event.track = track;
              event.receiver = {track: track};
              event.transceiver = {receiver: event.receiver};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        },
        enumerable: true,
        configurable: true
      });
    }
    if (typeof window === 'object' && window.RTCTrackEvent &&
        ('receiver' in window.RTCTrackEvent.prototype) &&
        !('transceiver' in window.RTCTrackEvent.prototype)) {
      Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
        get: function() {
          return {receiver: this.receiver};
        }
      });
    }
  },

  shimSourceObject: function(window) {
    // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this.mozSrcObject;
          },
          set: function(stream) {
            this.mozSrcObject = stream;
          }
        });
      }
    }
  },

  shimPeerConnection: function(window) {
    var browserDetails = utils.detectBrowser(window);

    if (typeof window !== 'object' || !(window.RTCPeerConnection ||
        window.mozRTCPeerConnection)) {
      return; // probably media.peerconnection.enabled=false in about:config
    }
    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (browserDetails.version < 38) {
          // .urls is not supported in FF < 38.
          // create RTCIceServers with a single url.
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];
            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];
              if (server.hasOwnProperty('urls')) {
                for (var j = 0; j < server.urls.length; j++) {
                  var newServer = {
                    url: server.urls[j]
                  };
                  if (server.urls[j].indexOf('turn') === 0) {
                    newServer.username = server.username;
                    newServer.credential = server.credential;
                  }
                  newIceServers.push(newServer);
                }
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }
            pcConfig.iceServers = newIceServers;
          }
        }
        return new window.mozRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype =
          window.mozRTCPeerConnection.prototype;

      // wrap static methods. Currently just generateCertificate.
      if (window.mozRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return window.mozRTCPeerConnection.generateCertificate;
          }
        });
      }

      window.RTCSessionDescription = window.mozRTCSessionDescription;
      window.RTCIceCandidate = window.mozRTCIceCandidate;
    }

    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = window.RTCPeerConnection.prototype[method];
          window.RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                window.RTCIceCandidate :
                window.RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        window.RTCPeerConnection.prototype.addIceCandidate;
    window.RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };

    // shim getStats with maplike support
    var makeMapStats = function(stats) {
      var map = new Map();
      Object.keys(stats).forEach(function(key) {
        map.set(key, stats[key]);
        map[key] = stats[key];
      });
      return map;
    };

    var modernStatsTypes = {
      inboundrtp: 'inbound-rtp',
      outboundrtp: 'outbound-rtp',
      candidatepair: 'candidate-pair',
      localcandidate: 'local-candidate',
      remotecandidate: 'remote-candidate'
    };

    var nativeGetStats = window.RTCPeerConnection.prototype.getStats;
    window.RTCPeerConnection.prototype.getStats = function(
      selector,
      onSucc,
      onErr
    ) {
      return nativeGetStats.apply(this, [selector || null])
        .then(function(stats) {
          if (browserDetails.version < 48) {
            stats = makeMapStats(stats);
          }
          if (browserDetails.version < 53 && !onSucc) {
            // Shim only promise getStats with spec-hyphens in type names
            // Leave callback version alone; misc old uses of forEach before Map
            try {
              stats.forEach(function(stat) {
                stat.type = modernStatsTypes[stat.type] || stat.type;
              });
            } catch (e) {
              if (e.name !== 'TypeError') {
                throw e;
              }
              // Avoid TypeError: "type" is read-only, in old versions. 34-43ish
              stats.forEach(function(stat, i) {
                stats.set(i, Object.assign({}, stat, {
                  type: modernStatsTypes[stat.type] || stat.type
                }));
              });
            }
          }
          return stats;
        })
        .then(onSucc, onErr);
    };
  },

  shimSenderGetStats: function(window) {
    if (!(typeof window === 'object' && window.RTCPeerConnection &&
        window.RTCRtpSender)) {
      return;
    }
    if (window.RTCRtpSender && 'getStats' in window.RTCRtpSender.prototype) {
      return;
    }
    var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window.RTCPeerConnection.prototype.getSenders = function() {
        var pc = this;
        var senders = origGetSenders.apply(pc, []);
        senders.forEach(function(sender) {
          sender._pc = pc;
        });
        return senders;
      };
    }

    var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) {
      window.RTCPeerConnection.prototype.addTrack = function() {
        var sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }
    window.RTCRtpSender.prototype.getStats = function() {
      return this.track ? this._pc.getStats(this.track) :
          Promise.resolve(new Map());
    };
  },

  shimReceiverGetStats: function(window) {
    if (!(typeof window === 'object' && window.RTCPeerConnection &&
        window.RTCRtpSender)) {
      return;
    }
    if (window.RTCRtpSender && 'getStats' in window.RTCRtpReceiver.prototype) {
      return;
    }
    var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window.RTCPeerConnection.prototype.getReceivers = function() {
        var pc = this;
        var receivers = origGetReceivers.apply(pc, []);
        receivers.forEach(function(receiver) {
          receiver._pc = pc;
        });
        return receivers;
      };
    }
    utils.wrapPeerConnectionEvent(window, 'track', function(e) {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window.RTCRtpReceiver.prototype.getStats = function() {
      return this._pc.getStats(this.track);
    };
  },

  shimRemoveStream: function(window) {
    if (!window.RTCPeerConnection ||
        'removeStream' in window.RTCPeerConnection.prototype) {
      return;
    }
    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      var pc = this;
      utils.deprecated('removeStream', 'removeTrack');
      this.getSenders().forEach(function(sender) {
        if (sender.track && stream.getTracks().indexOf(sender.track) !== -1) {
          pc.removeTrack(sender);
        }
      });
    };
  },

  shimRTCDataChannel: function(window) {
    // rename DataChannel to RTCDataChannel (native fix in FF60):
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1173851
    if (window.DataChannel && !window.RTCDataChannel) {
      window.RTCDataChannel = window.DataChannel;
    }
  },

  shimGetDisplayMedia: function(window, preferredMediaSource) {
    if ('getDisplayMedia' in window.navigator) {
      return;
    }
    navigator.getDisplayMedia = function(constraints) {
      if (!(constraints && constraints.video)) {
        var err = new DOMException('getDisplayMedia without video ' +
            'constraints is undefined');
        err.name = 'NotFoundError';
        // from https://heycam.github.io/webidl/#idl-DOMException-error-names
        err.code = 8;
        return Promise.reject(err);
      }
      if (constraints.video === true) {
        constraints.video = {mediaSource: preferredMediaSource};
      } else {
        constraints.video.mediaSource = preferredMediaSource;
      }
      return navigator.mediaDevices.getUserMedia(constraints);
    };
  }
};

var safari_shim = {
  shimLocalStreamsAPI: function(window) {
    if (typeof window !== 'object' || !window.RTCPeerConnection) {
      return;
    }
    if (!('getLocalStreams' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.getLocalStreams = function() {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        return this._localStreams;
      };
    }
    if (!('getStreamById' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.getStreamById = function(id) {
        var result = null;
        if (this._localStreams) {
          this._localStreams.forEach(function(stream) {
            if (stream.id === id) {
              result = stream;
            }
          });
        }
        if (this._remoteStreams) {
          this._remoteStreams.forEach(function(stream) {
            if (stream.id === id) {
              result = stream;
            }
          });
        }
        return result;
      };
    }
    if (!('addStream' in window.RTCPeerConnection.prototype)) {
      var _addTrack = window.RTCPeerConnection.prototype.addTrack;
      window.RTCPeerConnection.prototype.addStream = function(stream) {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        if (this._localStreams.indexOf(stream) === -1) {
          this._localStreams.push(stream);
        }
        var pc = this;
        stream.getTracks().forEach(function(track) {
          _addTrack.call(pc, track, stream);
        });
      };

      window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
        if (stream) {
          if (!this._localStreams) {
            this._localStreams = [stream];
          } else if (this._localStreams.indexOf(stream) === -1) {
            this._localStreams.push(stream);
          }
        }
        return _addTrack.call(this, track, stream);
      };
    }
    if (!('removeStream' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.removeStream = function(stream) {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        var index = this._localStreams.indexOf(stream);
        if (index === -1) {
          return;
        }
        this._localStreams.splice(index, 1);
        var pc = this;
        var tracks = stream.getTracks();
        this.getSenders().forEach(function(sender) {
          if (tracks.indexOf(sender.track) !== -1) {
            pc.removeTrack(sender);
          }
        });
      };
    }
  },
  shimRemoteStreamsAPI: function(window) {
    if (typeof window !== 'object' || !window.RTCPeerConnection) {
      return;
    }
    if (!('getRemoteStreams' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.getRemoteStreams = function() {
        return this._remoteStreams ? this._remoteStreams : [];
      };
    }
    if (!('onaddstream' in window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
        get: function() {
          return this._onaddstream;
        },
        set: function(f) {
          if (this._onaddstream) {
            this.removeEventListener('addstream', this._onaddstream);
          }
          this.addEventListener('addstream', this._onaddstream = f);
        }
      });
      var origSetRemoteDescription =
          window.RTCPeerConnection.prototype.setRemoteDescription;
      window.RTCPeerConnection.prototype.setRemoteDescription = function() {
        var pc = this;
        if (!this._onaddstreampoly) {
          this.addEventListener('track', this._onaddstreampoly = function(e) {
            e.streams.forEach(function(stream) {
              if (!pc._remoteStreams) {
                pc._remoteStreams = [];
              }
              if (pc._remoteStreams.indexOf(stream) >= 0) {
                return;
              }
              pc._remoteStreams.push(stream);
              var event = new Event('addstream');
              event.stream = stream;
              pc.dispatchEvent(event);
            });
          });
        }
        return origSetRemoteDescription.apply(pc, arguments);
      };
    }
  },
  shimCallbacksAPI: function(window) {
    if (typeof window !== 'object' || !window.RTCPeerConnection) {
      return;
    }
    var prototype = window.RTCPeerConnection.prototype;
    var createOffer = prototype.createOffer;
    var createAnswer = prototype.createAnswer;
    var setLocalDescription = prototype.setLocalDescription;
    var setRemoteDescription = prototype.setRemoteDescription;
    var addIceCandidate = prototype.addIceCandidate;

    prototype.createOffer = function(successCallback, failureCallback) {
      var options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      var promise = createOffer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

    prototype.createAnswer = function(successCallback, failureCallback) {
      var options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      var promise = createAnswer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

    var withCallback = function(description, successCallback, failureCallback) {
      var promise = setLocalDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setLocalDescription = withCallback;

    withCallback = function(description, successCallback, failureCallback) {
      var promise = setRemoteDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setRemoteDescription = withCallback;

    withCallback = function(candidate, successCallback, failureCallback) {
      var promise = addIceCandidate.apply(this, [candidate]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.addIceCandidate = withCallback;
  },
  shimGetUserMedia: function(window) {
    var navigator = window && window.navigator;

    if (!navigator.getUserMedia) {
      if (navigator.webkitGetUserMedia) {
        navigator.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
      } else if (navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia) {
        navigator.getUserMedia = function(constraints, cb, errcb) {
          navigator.mediaDevices.getUserMedia(constraints)
          .then(cb, errcb);
        }.bind(navigator);
      }
    }
  },
  shimRTCIceServerUrls: function(window) {
    // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
    var OrigPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      if (pcConfig && pcConfig.iceServers) {
        var newIceServers = [];
        for (var i = 0; i < pcConfig.iceServers.length; i++) {
          var server = pcConfig.iceServers[i];
          if (!server.hasOwnProperty('urls') &&
              server.hasOwnProperty('url')) {
            utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
            server = JSON.parse(JSON.stringify(server));
            server.urls = server.url;
            delete server.url;
            newIceServers.push(server);
          } else {
            newIceServers.push(pcConfig.iceServers[i]);
          }
        }
        pcConfig.iceServers = newIceServers;
      }
      return new OrigPeerConnection(pcConfig, pcConstraints);
    };
    window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
    // wrap static methods. Currently just generateCertificate.
    if ('generateCertificate' in window.RTCPeerConnection) {
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          return OrigPeerConnection.generateCertificate;
        }
      });
    }
  },
  shimTrackEventTransceiver: function(window) {
    // Add event.transceiver member over deprecated event.receiver
    if (typeof window === 'object' && window.RTCPeerConnection &&
        ('receiver' in window.RTCTrackEvent.prototype) &&
        // can't check 'transceiver' in window.RTCTrackEvent.prototype, as it is
        // defined for some reason even when window.RTCTransceiver is not.
        !window.RTCTransceiver) {
      Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
        get: function() {
          return {receiver: this.receiver};
        }
      });
    }
  },

  shimCreateOfferLegacy: function(window) {
    var origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
    window.RTCPeerConnection.prototype.createOffer = function(offerOptions) {
      var pc = this;
      if (offerOptions) {
        if (typeof offerOptions.offerToReceiveAudio !== 'undefined') {
          // support bit values
          offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
        }
        var audioTransceiver = pc.getTransceivers().find(function(transceiver) {
          return transceiver.sender.track &&
              transceiver.sender.track.kind === 'audio';
        });
        if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
          if (audioTransceiver.direction === 'sendrecv') {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection('sendonly');
            } else {
              audioTransceiver.direction = 'sendonly';
            }
          } else if (audioTransceiver.direction === 'recvonly') {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection('inactive');
            } else {
              audioTransceiver.direction = 'inactive';
            }
          }
        } else if (offerOptions.offerToReceiveAudio === true &&
            !audioTransceiver) {
          pc.addTransceiver('audio');
        }


        if (typeof offerOptions.offerToReceiveVideo !== 'undefined') {
          // support bit values
          offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
        }
        var videoTransceiver = pc.getTransceivers().find(function(transceiver) {
          return transceiver.sender.track &&
              transceiver.sender.track.kind === 'video';
        });
        if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
          if (videoTransceiver.direction === 'sendrecv') {
            videoTransceiver.setDirection('sendonly');
          } else if (videoTransceiver.direction === 'recvonly') {
            videoTransceiver.setDirection('inactive');
          }
        } else if (offerOptions.offerToReceiveVideo === true &&
            !videoTransceiver) {
          pc.addTransceiver('video');
        }
      }
      return origCreateOffer.apply(pc, arguments);
    };
  }
};

var common_shim = {
  shimRTCIceCandidate: function(window) {
    // foundation is arbitrarily chosen as an indicator for full support for
    // https://w3c.github.io/webrtc-pc/#rtcicecandidate-interface
    if (!window.RTCIceCandidate || (window.RTCIceCandidate && 'foundation' in
        window.RTCIceCandidate.prototype)) {
      return;
    }

    var NativeRTCIceCandidate = window.RTCIceCandidate;
    window.RTCIceCandidate = function(args) {
      // Remove the a= which shouldn't be part of the candidate string.
      if (typeof args === 'object' && args.candidate &&
          args.candidate.indexOf('a=') === 0) {
        args = JSON.parse(JSON.stringify(args));
        args.candidate = args.candidate.substr(2);
      }

      if (args.candidate && args.candidate.length) {
        // Augment the native candidate with the parsed fields.
        var nativeCandidate = new NativeRTCIceCandidate(args);
        var parsedCandidate = sdp.parseCandidate(args.candidate);
        var augmentedCandidate = Object.assign(nativeCandidate,
            parsedCandidate);

        // Add a serializer that does not serialize the extra attributes.
        augmentedCandidate.toJSON = function() {
          return {
            candidate: augmentedCandidate.candidate,
            sdpMid: augmentedCandidate.sdpMid,
            sdpMLineIndex: augmentedCandidate.sdpMLineIndex,
            usernameFragment: augmentedCandidate.usernameFragment,
          };
        };
        return augmentedCandidate;
      }
      return new NativeRTCIceCandidate(args);
    };
    window.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;

    // Hook up the augmented candidate in onicecandidate and
    // addEventListener('icecandidate', ...)
    utils.wrapPeerConnectionEvent(window, 'icecandidate', function(e) {
      if (e.candidate) {
        Object.defineProperty(e, 'candidate', {
          value: new window.RTCIceCandidate(e.candidate),
          writable: 'false'
        });
      }
      return e;
    });
  },

  // shimCreateObjectURL must be called before shimSourceObject to avoid loop.

  shimCreateObjectURL: function(window) {
    var URL = window && window.URL;

    if (!(typeof window === 'object' && window.HTMLMediaElement &&
          'srcObject' in window.HTMLMediaElement.prototype &&
        URL.createObjectURL && URL.revokeObjectURL)) {
      // Only shim CreateObjectURL using srcObject if srcObject exists.
      return undefined;
    }

    var nativeCreateObjectURL = URL.createObjectURL.bind(URL);
    var nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);
    var streams = new Map(), newId = 0;

    URL.createObjectURL = function(stream) {
      if ('getTracks' in stream) {
        var url = 'polyblob:' + (++newId);
        streams.set(url, stream);
        utils.deprecated('URL.createObjectURL(stream)',
            'elem.srcObject = stream');
        return url;
      }
      return nativeCreateObjectURL(stream);
    };
    URL.revokeObjectURL = function(url) {
      nativeRevokeObjectURL(url);
      streams.delete(url);
    };

    var dsc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype,
                                              'src');
    Object.defineProperty(window.HTMLMediaElement.prototype, 'src', {
      get: function() {
        return dsc.get.apply(this);
      },
      set: function(url) {
        this.srcObject = streams.get(url) || null;
        return dsc.set.apply(this, [url]);
      }
    });

    var nativeSetAttribute = window.HTMLMediaElement.prototype.setAttribute;
    window.HTMLMediaElement.prototype.setAttribute = function() {
      if (arguments.length === 2 &&
          ('' + arguments[0]).toLowerCase() === 'src') {
        this.srcObject = streams.get(arguments[1]) || null;
      }
      return nativeSetAttribute.apply(this, arguments);
    };
  },

  shimMaxMessageSize: function(window) {
    if (window.RTCSctpTransport || !window.RTCPeerConnection) {
      return;
    }
    var browserDetails = utils.detectBrowser(window);

    if (!('sctp' in window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'sctp', {
        get: function() {
          return typeof this._sctp === 'undefined' ? null : this._sctp;
        }
      });
    }

    var sctpInDescription = function(description) {
      var sections = sdp.splitSections(description.sdp);
      sections.shift();
      return sections.some(function(mediaSection) {
        var mLine = sdp.parseMLine(mediaSection);
        return mLine && mLine.kind === 'application'
            && mLine.protocol.indexOf('SCTP') !== -1;
      });
    };

    var getRemoteFirefoxVersion = function(description) {
      // TODO: Is there a better solution for detecting Firefox?
      var match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
      if (match === null || match.length < 2) {
        return -1;
      }
      var version = parseInt(match[1], 10);
      // Test for NaN (yes, this is ugly)
      return version !== version ? -1 : version;
    };

    var getCanSendMaxMessageSize = function(remoteIsFirefox) {
      // Every implementation we know can send at least 64 KiB.
      // Note: Although Chrome is technically able to send up to 256 KiB, the
      //       data does not reach the other peer reliably.
      //       See: https://bugs.chromium.org/p/webrtc/issues/detail?id=8419
      var canSendMaxMessageSize = 65536;
      if (browserDetails.browser === 'firefox') {
        if (browserDetails.version < 57) {
          if (remoteIsFirefox === -1) {
            // FF < 57 will send in 16 KiB chunks using the deprecated PPID
            // fragmentation.
            canSendMaxMessageSize = 16384;
          } else {
            // However, other FF (and RAWRTC) can reassemble PPID-fragmented
            // messages. Thus, supporting ~2 GiB when sending.
            canSendMaxMessageSize = 2147483637;
          }
        } else if (browserDetails.version < 60) {
          // Currently, all FF >= 57 will reset the remote maximum message size
          // to the default value when a data channel is created at a later
          // stage. :(
          // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831
          canSendMaxMessageSize =
            browserDetails.version === 57 ? 65535 : 65536;
        } else {
          // FF >= 60 supports sending ~2 GiB
          canSendMaxMessageSize = 2147483637;
        }
      }
      return canSendMaxMessageSize;
    };

    var getMaxMessageSize = function(description, remoteIsFirefox) {
      // Note: 65536 bytes is the default value from the SDP spec. Also,
      //       every implementation we know supports receiving 65536 bytes.
      var maxMessageSize = 65536;

      // FF 57 has a slightly incorrect default remote max message size, so
      // we need to adjust it here to avoid a failure when sending.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1425697
      if (browserDetails.browser === 'firefox'
           && browserDetails.version === 57) {
        maxMessageSize = 65535;
      }

      var match = sdp.matchPrefix(description.sdp, 'a=max-message-size:');
      if (match.length > 0) {
        maxMessageSize = parseInt(match[0].substr(19), 10);
      } else if (browserDetails.browser === 'firefox' &&
                  remoteIsFirefox !== -1) {
        // If the maximum message size is not present in the remote SDP and
        // both local and remote are Firefox, the remote peer can receive
        // ~2 GiB.
        maxMessageSize = 2147483637;
      }
      return maxMessageSize;
    };

    var origSetRemoteDescription =
        window.RTCPeerConnection.prototype.setRemoteDescription;
    window.RTCPeerConnection.prototype.setRemoteDescription = function() {
      var pc = this;
      pc._sctp = null;

      if (sctpInDescription(arguments[0])) {
        // Check if the remote is FF.
        var isFirefox = getRemoteFirefoxVersion(arguments[0]);

        // Get the maximum message size the local peer is capable of sending
        var canSendMMS = getCanSendMaxMessageSize(isFirefox);

        // Get the maximum message size of the remote peer.
        var remoteMMS = getMaxMessageSize(arguments[0], isFirefox);

        // Determine final maximum message size
        var maxMessageSize;
        if (canSendMMS === 0 && remoteMMS === 0) {
          maxMessageSize = Number.POSITIVE_INFINITY;
        } else if (canSendMMS === 0 || remoteMMS === 0) {
          maxMessageSize = Math.max(canSendMMS, remoteMMS);
        } else {
          maxMessageSize = Math.min(canSendMMS, remoteMMS);
        }

        // Create a dummy RTCSctpTransport object and the 'maxMessageSize'
        // attribute.
        var sctp = {};
        Object.defineProperty(sctp, 'maxMessageSize', {
          get: function() {
            return maxMessageSize;
          }
        });
        pc._sctp = sctp;
      }

      return origSetRemoteDescription.apply(pc, arguments);
    };
  },

  shimSendThrowTypeError: function(window) {
    if (!(window.RTCPeerConnection &&
        'createDataChannel' in window.RTCPeerConnection.prototype)) {
      return;
    }

    // Note: Although Firefox >= 57 has a native implementation, the maximum
    //       message size can be reset for all data channels at a later stage.
    //       See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831

    function wrapDcSend(dc, pc) {
      var origDataChannelSend = dc.send;
      dc.send = function() {
        var data = arguments[0];
        var length = data.length || data.size || data.byteLength;
        if (dc.readyState === 'open' &&
            pc.sctp && length > pc.sctp.maxMessageSize) {
          throw new TypeError('Message too large (can send a maximum of ' +
            pc.sctp.maxMessageSize + ' bytes)');
        }
        return origDataChannelSend.apply(dc, arguments);
      };
    }
    var origCreateDataChannel =
      window.RTCPeerConnection.prototype.createDataChannel;
    window.RTCPeerConnection.prototype.createDataChannel = function() {
      var pc = this;
      var dataChannel = origCreateDataChannel.apply(pc, arguments);
      wrapDcSend(dataChannel, pc);
      return dataChannel;
    };
    utils.wrapPeerConnectionEvent(window, 'datachannel', function(e) {
      wrapDcSend(e.channel, e.target);
      return e;
    });
  }
};

// Shimming starts here.
var adapter_factory = function(dependencies, opts) {
  var window = dependencies && dependencies.window;

  var options = {
    shimChrome: true,
    shimFirefox: true,
    shimEdge: true,
    shimSafari: true,
  };

  for (var key in opts) {
    if (hasOwnProperty.call(opts, key)) {
      options[key] = opts[key];
    }
  }

  // Utils.
  var logging = utils.log;
  var browserDetails = utils.detectBrowser(window);

  // Uncomment the line below if you want logging to occur, including logging
  // for the switch statement below. Can also be turned on in the browser via
  // adapter.disableLog(false), but then logging from the switch statement below
  // will not appear.
  // require('./utils').disableLog(false);

  // Browser shims.
  var chromeShim = chrome_shim || null;
  var edgeShim = edge_shim || null;
  var firefoxShim = firefox_shim || null;
  var safariShim = safari_shim || null;
  var commonShim = common_shim || null;

  // Export to the adapter global object visible in the browser.
  var adapter = {
    browserDetails: browserDetails,
    commonShim: commonShim,
    extractVersion: utils.extractVersion,
    disableLog: utils.disableLog,
    disableWarnings: utils.disableWarnings
  };

  // Shim browser if found.
  switch (browserDetails.browser) {
    case 'chrome':
      if (!chromeShim || !chromeShim.shimPeerConnection ||
          !options.shimChrome) {
        logging('Chrome shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming chrome.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = chromeShim;
      commonShim.shimCreateObjectURL(window);

      chromeShim.shimGetUserMedia(window);
      chromeShim.shimMediaStream(window);
      chromeShim.shimSourceObject(window);
      chromeShim.shimPeerConnection(window);
      chromeShim.shimOnTrack(window);
      chromeShim.shimAddTrackRemoveTrack(window);
      chromeShim.shimGetSendersWithDtmf(window);
      chromeShim.shimSenderReceiverGetStats(window);
      chromeShim.fixNegotiationNeeded(window);

      commonShim.shimRTCIceCandidate(window);
      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    case 'firefox':
      if (!firefoxShim || !firefoxShim.shimPeerConnection ||
          !options.shimFirefox) {
        logging('Firefox shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming firefox.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = firefoxShim;
      commonShim.shimCreateObjectURL(window);

      firefoxShim.shimGetUserMedia(window);
      firefoxShim.shimSourceObject(window);
      firefoxShim.shimPeerConnection(window);
      firefoxShim.shimOnTrack(window);
      firefoxShim.shimRemoveStream(window);
      firefoxShim.shimSenderGetStats(window);
      firefoxShim.shimReceiverGetStats(window);
      firefoxShim.shimRTCDataChannel(window);

      commonShim.shimRTCIceCandidate(window);
      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    case 'edge':
      if (!edgeShim || !edgeShim.shimPeerConnection || !options.shimEdge) {
        logging('MS edge shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming edge.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = edgeShim;
      commonShim.shimCreateObjectURL(window);

      edgeShim.shimGetUserMedia(window);
      edgeShim.shimPeerConnection(window);
      edgeShim.shimReplaceTrack(window);

      // the edge shim implements the full RTCIceCandidate object.

      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    case 'safari':
      if (!safariShim || !options.shimSafari) {
        logging('Safari shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming safari.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = safariShim;
      commonShim.shimCreateObjectURL(window);

      safariShim.shimRTCIceServerUrls(window);
      safariShim.shimCreateOfferLegacy(window);
      safariShim.shimCallbacksAPI(window);
      safariShim.shimLocalStreamsAPI(window);
      safariShim.shimRemoteStreamsAPI(window);
      safariShim.shimTrackEventTransceiver(window);
      safariShim.shimGetUserMedia(window);

      commonShim.shimRTCIceCandidate(window);
      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    default:
      logging('Unsupported browser!');
      break;
  }

  return adapter;
};

var adapter_core = adapter_factory({window: commonjsGlobal.window});

/*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {

});

emitter.on('somenamespace*', function (eventName, payloads) {

});

Please note that callbacks triggered by wildcard registered events also get
the event name as the first argument.
*/

var wildemitter = WildEmitter;

function WildEmitter() { }

WildEmitter.mixin = function (constructor) {
    var prototype = constructor.prototype || constructor;

    prototype.isWildEmitter= true;

    // Listen on the given `event` with `fn`. Store a group name if present.
    prototype.on = function (event, groupName, fn) {
        this.callbacks = this.callbacks || {};
        var hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    };

    // Adds an `event` listener that will be invoked a single
    // time then automatically removed.
    prototype.once = function (event, groupName, fn) {
        var self = this,
            hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        function on() {
            self.off(event, on);
            func.apply(this, arguments);
        }
        this.on(event, group, on);
        return this;
    };

    // Unbinds an entire group
    prototype.releaseGroup = function (groupName) {
        this.callbacks = this.callbacks || {};
        var item, i, len, handlers;
        for (item in this.callbacks) {
            handlers = this.callbacks[item];
            for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    //console.log('removing');
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    };

    // Remove the given callback for `event` or all
    // registered callbacks.
    prototype.off = function (event, fn) {
        this.callbacks = this.callbacks || {};
        var callbacks = this.callbacks[event],
            i;

        if (!callbacks) return this;

        // remove all handlers
        if (arguments.length === 1) {
            delete this.callbacks[event];
            return this;
        }

        // remove specific handler
        i = callbacks.indexOf(fn);
        callbacks.splice(i, 1);
        if (callbacks.length === 0) {
            delete this.callbacks[event];
        }
        return this;
    };

    /// Emit `event` with the given args.
    // also calls any `*` handlers
    prototype.emit = function (event) {
        this.callbacks = this.callbacks || {};
        var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event],
            specialCallbacks = this.getWildcardCallbacks(event),
            i,
            len,
            item,
            listeners;

        if (callbacks) {
            listeners = callbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }

        if (specialCallbacks) {
            len = specialCallbacks.length;
            listeners = specialCallbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }

        return this;
    };

    // Helper for for finding special wildcard event handlers that match the event
    prototype.getWildcardCallbacks = function (eventName) {
        this.callbacks = this.callbacks || {};
        var item,
            split,
            result = [];

        for (item in this.callbacks) {
            split = item.split('*');
            if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
    };

};

WildEmitter.mixin(WildEmitter);

/**
 * @fileOverview 一些全局的配置
 * @author benz@youme.im
 * @date 2018/8/15
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
// 信令服务器默认地址
var GATEWAY_URL = 'wss://ymrtc-dev.youme.im/janus/';
var GATEWAY_URL_DEV = 'wss://ymrtc-dev2.youme.im/janus/';
// 默认是否为视频聊天
var ENABLE_VIDEO_BY_DEFAULT = true;

/**
 * @fileOverview
 * @author benz@youme.im
 * @date 2018/8/15
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var CommonData = /** @class */ (function (_super) {
    __extends(CommonData, _super);
    function CommonData() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._data = {
            video: ENABLE_VIDEO_BY_DEFAULT,
            appKey: '',
            userId: '',
            token: '',
            localMediaConstraints: {
                video: {
                    width: { ideal: 320 },
                    frameRate: { ideal: 12 },
                    facingMode: 'user'
                },
                audio: {
                    autoGainControl: true,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: { ideal: 8000 },
                    sampleSize: { ideal: 8 },
                    volume: 0.9
                }
            }
        };
        return _this;
    }
    CommonData.prototype.set = function (key, value) {
        this._data[key] = value;
        this.emit('change:' + key, key, value);
    };
    CommonData.prototype.get = function (key) {
        return this._data[key];
    };
    return CommonData;
}(wildemitter));

/*
	The MIT License (MIT)

	Copyright (c) 2016 Meetecho

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
	THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
	OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
	ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
 */

// List of sessions
Janus.sessions = {};

Janus.isExtensionEnabled = function() {
	if(navigator.getDisplayMedia) {
		// No need for the extension, getDisplayMedia is supported
		return true;
	}
	if(window.navigator.userAgent.match('Chrome')) {
		var chromever = parseInt(window.navigator.userAgent.match(/Chrome\/(.*) /)[1], 10);
		var maxver = 33;
		if(window.navigator.userAgent.match('Linux'))
			maxver = 35;	// "known" crash in chrome 34 and 35 on linux
		if(chromever >= 26 && chromever <= maxver) {
			// Older versions of Chrome don't support this extension-based approach, so lie
			return true;
		}
		return Janus.extension.isInstalled();
	} else {
		// Firefox of others, no need for the extension (but this doesn't mean it will work)
		return true;
	}
};

var defaultExtension = {
	// Screensharing Chrome Extension ID
	extensionId: 'hapfgfdkleiggjjpfpenajgdnfckjpaj',
	isInstalled: function() { return document.querySelector('#janus-extension-installed') !== null; },
	getScreen: function (callback) {
		var pending = window.setTimeout(function () {
			error = new Error('NavigatorUserMediaError');
			error.name = 'The required Chrome extension is not installed: click <a href="#">here</a> to install it. (NOTE: this will need you to refresh the page)';
			return callback(error);
		}, 1000);
		this.cache[pending] = callback;
		window.postMessage({ type: 'janusGetScreen', id: pending }, '*');
	},
	init: function () {
		var cache = {};
		this.cache = cache;
		// Wait for events from the Chrome Extension
		window.addEventListener('message', function (event) {
			if(event.origin != window.location.origin)
				return;
			if(event.data.type == 'janusGotScreen' && cache[event.data.id]) {
				var callback = cache[event.data.id];
				delete cache[event.data.id];

				if (event.data.sourceId === '') {
					// user canceled
					var error = new Error('NavigatorUserMediaError');
					error.name = 'You cancelled the request for permission, giving up...';
					callback(error);
				} else {
					callback(null, event.data.sourceId);
				}
			} else if (event.data.type == 'janusGetScreenPending') {
				console.log('clearing ', event.data.id);
				window.clearTimeout(event.data.id);
			}
		});
	}
};

Janus.useDefaultDependencies = function (deps) {
	var f = (deps && deps.fetch) || fetch;
	var p = (deps && deps.Promise) || Promise;
	var socketCls = (deps && deps.WebSocket) || WebSocket;

	return {
		newWebSocket: function(server, proto) { return new socketCls(server, proto); },
		extension: (deps && deps.extension) || defaultExtension,
		isArray: function(arr) { return Array.isArray(arr); },
		webRTCAdapter: (deps && deps.adapter) || adapter_core,
		httpAPICall: function(url, options) {
			var fetchOptions = {
				method: options.verb,
				headers: {
					'Accept': 'application/json, text/plain, */*'
				},
				cache: 'no-cache'
			};
			if(options.verb === "POST") {
				fetchOptions.headers['Content-Type'] = 'application/json';
			}
			if(options.withCredentials !== undefined) {
				fetchOptions.credentials = options.withCredentials === true ? 'include' : (options.withCredentials ? options.withCredentials : 'omit');
			}
			if(options.body !== undefined) {
				fetchOptions.body = JSON.stringify(options.body);
			}

			var fetching = f(url, fetchOptions).catch(function(error) {
				return p.reject({message: 'Probably a network error, is the server down?', error: error});
			});

			/*
			 * fetch() does not natively support timeouts.
			 * Work around this by starting a timeout manually, and racing it agains the fetch() to see which thing resolves first.
			 */

			if(options.timeout !== undefined) {
				var timeout = new p(function(resolve, reject) {
					var timerId = setTimeout(function() {
						clearTimeout(timerId);
						return reject({message: 'Request timed out', timeout: options.timeout});
					}, options.timeout);
				});
				fetching = p.race([fetching,timeout]);
			}

			fetching.then(function(response) {
				if(response.ok) {
					if(typeof(options.success) === typeof(Janus.noop)) {
						return response.json().then(function(parsed) {
							options.success(parsed);
						}).catch(function(error) {
							return p.reject({message: 'Failed to parse response body', error: error, response: response});
						});
					}
				}
				else {
					return p.reject({message: 'API call failed', response: response});
				}
			}).catch(function(error) {
				if(typeof(options.error) === typeof(Janus.noop)) {
					options.error(error.message || '<< internal error >>', error);
				}
			});

			return fetching;
		}
	}
};

Janus.useOldDependencies = function (deps) {
	var jq = (deps && deps.jQuery) || jQuery;
	var socketCls = (deps && deps.WebSocket) || WebSocket;
	return {
		newWebSocket: function(server, proto) { return new socketCls(server, proto); },
		isArray: function(arr) { return jq.isArray(arr); },
		extension: (deps && deps.extension) || defaultExtension,
		webRTCAdapter: (deps && deps.adapter) || adapter_core,
		httpAPICall: function(url, options) {
			var payload = options.body !== undefined ? {
				contentType: 'application/json',
				data: JSON.stringify(options.body)
			} : {};
			var credentials = options.withCredentials !== undefined ? {xhrFields: {withCredentials: options.withCredentials}} : {};

			return jq.ajax(jq.extend(payload, credentials, {
				url: url,
				type: options.verb,
				cache: false,
				dataType: 'json',
				async: options.async,
				timeout: options.timeout,
				success: function(result) {
					if(typeof(options.success) === typeof(Janus.noop)) {
						options.success(result);
					}
				},
				error: function(xhr, status, err) {
					if(typeof(options.error) === typeof(Janus.noop)) {
						options.error(status, err);
					}
				}
			}));
		},
	};
};

Janus.noop = function() {};

// Initialization
Janus.init = function(options) {
	options = options || {};
	options.callback = (typeof options.callback == "function") ? options.callback : Janus.noop;
	if(Janus.initDone === true) {
		// Already initialized
		options.callback();
	} else {
		if(typeof console == "undefined" || typeof console.log == "undefined")
			console = { log: function() {} };
		// Console logging (all debugging disabled by default)
		Janus.trace = Janus.noop;
		Janus.debug = Janus.noop;
		Janus.vdebug = Janus.noop;
		Janus.log = Janus.noop;
		Janus.warn = Janus.noop;
		Janus.error = Janus.noop;
		if(options.debug === true || options.debug === "all") {
			// Enable all debugging levels
			Janus.trace = console.trace.bind(console);
			Janus.debug = console.debug.bind(console);
			Janus.vdebug = console.debug.bind(console);
			Janus.log = console.log.bind(console);
			Janus.warn = console.warn.bind(console);
			Janus.error = console.error.bind(console);
		} else if(Array.isArray(options.debug)) {
			for(var i in options.debug) {
				var d = options.debug[i];
				switch(d) {
					case "trace":
						Janus.trace = console.trace.bind(console);
						break;
					case "debug":
						Janus.debug = console.debug.bind(console);
						break;
					case "vdebug":
						Janus.vdebug = console.debug.bind(console);
						break;
					case "log":
						Janus.log = console.log.bind(console);
						break;
					case "warn":
						Janus.warn = console.warn.bind(console);
						break;
					case "error":
						Janus.error = console.error.bind(console);
						break;
					default:
						console.error("Unknown debugging option '" + d + "' (supported: 'trace', 'debug', 'vdebug', 'log', warn', 'error')");
						break;
				}
			}
		}
		Janus.log("Initializing library");

		var usedDependencies = options.dependencies || Janus.useDefaultDependencies();
		Janus.isArray = usedDependencies.isArray;
		Janus.webRTCAdapter = usedDependencies.webRTCAdapter;
		Janus.httpAPICall = usedDependencies.httpAPICall;
		Janus.newWebSocket = usedDependencies.newWebSocket;
		Janus.extension = usedDependencies.extension;
		Janus.extension.init();

		// Helper method to enumerate devices
		Janus.listDevices = function(callback, config) {
			callback = (typeof callback == "function") ? callback : Janus.noop;
			if (config == null) config = { audio: true, video: true };
			if(navigator.mediaDevices) {
				navigator.mediaDevices.getUserMedia(config)
				.then(function(stream) {
					navigator.mediaDevices.enumerateDevices().then(function(devices) {
						Janus.debug(devices);
						callback(devices);
						// Get rid of the now useless stream
						try {
							var tracks = stream.getTracks();
							for(var i in tracks) {
								var mst = tracks[i];
								if(mst !== null && mst !== undefined)
									mst.stop();
							}
						} catch(e) {}
					});
				})
				.catch(function(err) {
					Janus.error(err);
					callback([]);
				});
			} else {
				Janus.warn("navigator.mediaDevices unavailable");
				callback([]);
			}
		};
		// Helper methods to attach/reattach a stream to a video element (previously part of adapter.js)
		Janus.attachMediaStream = function(element, stream) {
			if(Janus.webRTCAdapter.browserDetails.browser === 'chrome') {
				var chromever = Janus.webRTCAdapter.browserDetails.version;
				if(chromever >= 52) {
					element.srcObject = stream;
				} else if(typeof element.src !== 'undefined') {
					element.src = URL.createObjectURL(stream);
				} else {
					Janus.error("Error attaching stream to element");
				}
			} else {
				element.srcObject = stream;
			}
		};
		Janus.reattachMediaStream = function(to, from) {
			if(Janus.webRTCAdapter.browserDetails.browser === 'chrome') {
				var chromever = Janus.webRTCAdapter.browserDetails.version;
				if(chromever >= 52) {
					to.srcObject = from.srcObject;
				} else if(typeof to.src !== 'undefined') {
					to.src = from.src;
				} else {
					Janus.error("Error reattaching stream to element");
				}
			} else {
				to.srcObject = from.srcObject;
			}
		};
		// Detect tab close: make sure we don't loose existing onbeforeunload handlers
		// (note: for iOS we need to subscribe to a different event, 'pagehide', see
		// https://gist.github.com/thehunmonkgroup/6bee8941a49b86be31a787fe8f4b8cfe)
		var iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
		var eventName = iOS ? 'pagehide' : 'beforeunload';
		var oldOBF = window["on" + eventName];
		window.addEventListener(eventName, function(event) {
			Janus.log("Closing window");
			for(var s in Janus.sessions) {
				if(Janus.sessions[s] !== null && Janus.sessions[s] !== undefined &&
						Janus.sessions[s].destroyOnUnload) {
					Janus.log("Destroying session " + s);
					Janus.sessions[s].destroy({asyncRequest: false, notifyDestroyed: false});
				}
			}
			if(oldOBF && typeof oldOBF == "function")
				oldOBF();
		});
		// If this is a Safari Technology Preview, check if VP8 is supported
		Janus.safariVp8 = false;
		if(Janus.webRTCAdapter.browserDetails.browser === 'safari' &&
				Janus.webRTCAdapter.browserDetails.version >= 605) {
			// We do it in a very ugly way, as there's no alternative...
			// We create a PeerConnection to see if VP8 is in an offer
			var testpc = new RTCPeerConnection({}, {});
			testpc.createOffer({offerToReceiveVideo: true}).then(function(offer) {
				Janus.safariVp8 = offer.sdp.indexOf("VP8") !== -1;
				if(Janus.safariVp8) {
					Janus.log("This version of Safari supports VP8");
				} else {
					Janus.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, " +
						"try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
				}
				testpc.close();
				testpc = null;
			});
		}
		Janus.initDone = true;
		options.callback();
	}
};

// Helper method to check whether WebRTC is supported by this browser
Janus.isWebrtcSupported = function() {
	return window.RTCPeerConnection !== undefined && window.RTCPeerConnection !== null &&
		navigator.getUserMedia !== undefined && navigator.getUserMedia !== null;
};

// Helper method to create random identifiers (e.g., transaction)
Janus.randomString = function(len) {
	var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var randomString = '';
	for (var i = 0; i < len; i++) {
		var randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(randomPoz,randomPoz+1);
	}
	return randomString;
};


function Janus(gatewayCallbacks) {
	if(Janus.initDone === undefined) {
		gatewayCallbacks.error("Library not initialized");
		return {};
	}
	if(!Janus.isWebrtcSupported()) {
		gatewayCallbacks.error("WebRTC not supported by this browser");
		return {};
	}
	Janus.log("Library initialized: " + Janus.initDone);
	gatewayCallbacks = gatewayCallbacks || {};
	gatewayCallbacks.success = (typeof gatewayCallbacks.success == "function") ? gatewayCallbacks.success : Janus.noop;
	gatewayCallbacks.error = (typeof gatewayCallbacks.error == "function") ? gatewayCallbacks.error : Janus.noop;
	gatewayCallbacks.destroyed = (typeof gatewayCallbacks.destroyed == "function") ? gatewayCallbacks.destroyed : Janus.noop;
	if(gatewayCallbacks.server === null || gatewayCallbacks.server === undefined) {
		gatewayCallbacks.error("Invalid server url");
		return {};
	}
	var websockets = false;
	var ws = null;
	var wsHandlers = {};
	var wsKeepaliveTimeoutId = null;

	var servers = null, serversIndex = 0;
	var server = gatewayCallbacks.server;
	if(Janus.isArray(server)) {
		Janus.log("Multiple servers provided (" + server.length + "), will use the first that works");
		server = null;
		servers = gatewayCallbacks.server;
		Janus.debug(servers);
	} else {
		if(server.indexOf("ws") === 0) {
			websockets = true;
			Janus.log("Using WebSockets to contact Janus: " + server);
		} else {
			websockets = false;
			Janus.log("Using REST API to contact Janus: " + server);
		}
	}
	var iceServers = gatewayCallbacks.iceServers;
	if(iceServers === undefined || iceServers === null)
		iceServers = [{urls: "stun:106.75.128.136:3478"},{urls: "stun:stun.l.google.com:19302"}];
	var iceTransportPolicy = gatewayCallbacks.iceTransportPolicy;
	var bundlePolicy = gatewayCallbacks.bundlePolicy;
	// Whether IPv6 candidates should be gathered
	var ipv6Support = gatewayCallbacks.ipv6;
	if(ipv6Support === undefined || ipv6Support === null)
		ipv6Support = false;
	// Whether we should enable the withCredentials flag for XHR requests
	var withCredentials = false;
	if(gatewayCallbacks.withCredentials !== undefined && gatewayCallbacks.withCredentials !== null)
		withCredentials = gatewayCallbacks.withCredentials === true;
	// Optional max events
	var maxev = null;
	if(gatewayCallbacks.max_poll_events !== undefined && gatewayCallbacks.max_poll_events !== null)
		maxev = gatewayCallbacks.max_poll_events;
	if(maxev < 1)
		maxev = 1;
	// Token to use (only if the token based authentication mechanism is enabled)
	var token = null;
	if(gatewayCallbacks.token !== undefined && gatewayCallbacks.token !== null)
		token = gatewayCallbacks.token;
	// API secret to use (only if the shared API secret is enabled)
	var apisecret = null;
	if(gatewayCallbacks.apisecret !== undefined && gatewayCallbacks.apisecret !== null)
		apisecret = gatewayCallbacks.apisecret;
	// Whether we should destroy this session when onbeforeunload is called
	this.destroyOnUnload = true;
	if(gatewayCallbacks.destroyOnUnload !== undefined && gatewayCallbacks.destroyOnUnload !== null)
		this.destroyOnUnload = (gatewayCallbacks.destroyOnUnload === true);
	// Some timeout-related values
	var keepAlivePeriod = 25000;
	if(gatewayCallbacks.keepAlivePeriod !== undefined && gatewayCallbacks.keepAlivePeriod !== null)
		keepAlivePeriod = gatewayCallbacks.keepAlivePeriod;
	if(isNaN(keepAlivePeriod))
		keepAlivePeriod = 25000;
	var longPollTimeout = 60000;
	if(gatewayCallbacks.longPollTimeout !== undefined && gatewayCallbacks.longPollTimeout !== null)
		longPollTimeout = gatewayCallbacks.longPollTimeout;
	if(isNaN(longPollTimeout))
		longPollTimeout = 60000;

	var connected = false;
	var sessionId = null;
	var pluginHandles = {};
	var that = this;
	var retries = 0;
	var transactions = {};
	createSession(gatewayCallbacks);

	// Public methods
	this.getServer = function() { return server; };
	this.isConnected = function() { return connected; };
	this.reconnect = function(callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		callbacks["reconnect"] = true;
		createSession(callbacks);
	};
	this.getSessionId = function() { return sessionId; };
	this.destroy = function(callbacks) { destroySession(callbacks); };
	this.attach = function(callbacks) { createHandle(callbacks); };

	function eventHandler() {
		if(sessionId == null)
			return;
		Janus.debug('Long poll...');
		if(!connected) {
			Janus.warn("Is the server down? (connected=false)");
			return;
		}
		var longpoll = server + "/" + sessionId + "?rid=" + new Date().getTime();
		if(maxev !== undefined && maxev !== null)
			longpoll = longpoll + "&maxev=" + maxev;
		if(token !== null && token !== undefined)
			longpoll = longpoll + "&token=" + encodeURIComponent(token);
		if(apisecret !== null && apisecret !== undefined)
			longpoll = longpoll + "&apisecret=" + encodeURIComponent(apisecret);
		Janus.httpAPICall(longpoll, {
			verb: 'GET',
			withCredentials: withCredentials,
			success: handleEvent,
			timeout: longPollTimeout,
			error: function(textStatus, errorThrown) {
				Janus.error(textStatus + ":", errorThrown);
				retries++;
				if(retries > 3) {
					// Did we just lose the server? :-(
					connected = false;
					gatewayCallbacks.error("Lost connection to the server (is it down?)");
					return;
				}
				eventHandler();
			}
		});
	}

	// Private event handler: this will trigger plugin callbacks, if set
	function handleEvent(json, skipTimeout) {
		retries = 0;
		if(!websockets && sessionId !== undefined && sessionId !== null && skipTimeout !== true)
			setTimeout(eventHandler, 200);
		if(!websockets && Janus.isArray(json)) {
			// We got an array: it means we passed a maxev > 1, iterate on all objects
			for(var i=0; i<json.length; i++) {
				handleEvent(json[i], true);
			}
			return;
		}
		if(json["janus"] === "keepalive") {
			// Nothing happened
			Janus.vdebug("Got a keepalive on session " + sessionId);
			return;
		} else if(json["janus"] === "ack") {
			// Just an ack, we can probably ignore
			Janus.debug("Got an ack on session " + sessionId);
			Janus.debug(json);
			var transaction = json["transaction"];
			if(transaction !== null && transaction !== undefined) {
				var reportSuccess = transactions[transaction];
				if(reportSuccess !== null && reportSuccess !== undefined) {
					reportSuccess(json);
				}
				delete transactions[transaction];
			}
			return;
		} else if(json["janus"] === "success") {
			// Success!
			Janus.debug("Got a success on session " + sessionId);
			Janus.debug(json);
			var transaction = json["transaction"];
			if(transaction !== null && transaction !== undefined) {
				var reportSuccess = transactions[transaction];
				if(reportSuccess !== null && reportSuccess !== undefined) {
					reportSuccess(json);
				}
				delete transactions[transaction];
			}
			return;
		} else if(json["janus"] === "trickle") {
			// We got a trickle candidate from Janus
			var sender = json["sender"];
			if(sender === undefined || sender === null) {
				Janus.warn("Missing sender...");
				return;
			}
			var pluginHandle = pluginHandles[sender];
			if(pluginHandle === undefined || pluginHandle === null) {
				Janus.debug("This handle is not attached to this session");
				return;
			}
			var candidate = json["candidate"];
			Janus.debug("Got a trickled candidate on session " + sessionId);
			Janus.debug(candidate);
			var config = pluginHandle.webrtcStuff;
			if(config.pc && config.remoteSdp) {
				// Add candidate right now
				Janus.debug("Adding remote candidate:", candidate);
				if(!candidate || candidate.completed === true) {
					// end-of-candidates
					config.pc.addIceCandidate();
				} else {
					// New candidate
					config.pc.addIceCandidate(candidate);
				}
			} else {
				// We didn't do setRemoteDescription (trickle got here before the offer?)
				Janus.debug("We didn't do setRemoteDescription (trickle got here before the offer?), caching candidate");
				if(!config.candidates)
					config.candidates = [];
				config.candidates.push(candidate);
				Janus.debug(config.candidates);
			}
		} else if(json["janus"] === "webrtcup") {
			// The PeerConnection with the server is up! Notify this
			Janus.debug("Got a webrtcup event on session " + sessionId);
			Janus.debug(json);
			var sender = json["sender"];
			if(sender === undefined || sender === null) {
				Janus.warn("Missing sender...");
				return;
			}
			var pluginHandle = pluginHandles[sender];
			if(pluginHandle === undefined || pluginHandle === null) {
				Janus.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.webrtcState(true);
			return;
		} else if(json["janus"] === "hangup") {
			// A plugin asked the core to hangup a PeerConnection on one of our handles
			Janus.debug("Got a hangup event on session " + sessionId);
			Janus.debug(json);
			var sender = json["sender"];
			if(sender === undefined || sender === null) {
				Janus.warn("Missing sender...");
				return;
			}
			var pluginHandle = pluginHandles[sender];
			if(pluginHandle === undefined || pluginHandle === null) {
				Janus.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.webrtcState(false, json["reason"]);
			pluginHandle.hangup();
		} else if(json["janus"] === "detached") {
			// A plugin asked the core to detach one of our handles
			Janus.debug("Got a detached event on session " + sessionId);
			Janus.debug(json);
			var sender = json["sender"];
			if(sender === undefined || sender === null) {
				Janus.warn("Missing sender...");
				return;
			}
			var pluginHandle = pluginHandles[sender];
			if(pluginHandle === undefined || pluginHandle === null) {
				// Don't warn here because destroyHandle causes this situation.
				return;
			}
			pluginHandle.detached = true;
			pluginHandle.ondetached();
			pluginHandle.detach();
		} else if(json["janus"] === "media") {
			// Media started/stopped flowing
			Janus.debug("Got a media event on session " + sessionId);
			Janus.debug(json);
			var sender = json["sender"];
			if(sender === undefined || sender === null) {
				Janus.warn("Missing sender...");
				return;
			}
			var pluginHandle = pluginHandles[sender];
			if(pluginHandle === undefined || pluginHandle === null) {
				Janus.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.mediaState(json["type"], json["receiving"]);
		} else if(json["janus"] === "slowlink") {
			Janus.debug("Got a slowlink event on session " + sessionId);
			Janus.debug(json);
			// Trouble uplink or downlink
			var sender = json["sender"];
			if(sender === undefined || sender === null) {
				Janus.warn("Missing sender...");
				return;
			}
			var pluginHandle = pluginHandles[sender];
			if(pluginHandle === undefined || pluginHandle === null) {
				Janus.debug("This handle is not attached to this session");
				return;
			}
			pluginHandle.slowLink(json["uplink"], json["nacks"]);
		} else if(json["janus"] === "error") {
			// Oops, something wrong happened
			Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
			Janus.debug(json);
			var transaction = json["transaction"];
			if(transaction !== null && transaction !== undefined) {
				var reportSuccess = transactions[transaction];
				if(reportSuccess !== null && reportSuccess !== undefined) {
					reportSuccess(json);
				}
				delete transactions[transaction];
			}
			return;
		} else if(json["janus"] === "event") {
			Janus.debug("Got a plugin event on session " + sessionId);
			Janus.debug(json);
			var sender = json["sender"];
			if(sender === undefined || sender === null) {
				Janus.warn("Missing sender...");
				return;
			}
			var plugindata = json["plugindata"];
			if(plugindata === undefined || plugindata === null) {
				Janus.warn("Missing plugindata...");
				return;
			}
			Janus.debug("  -- Event is coming from " + sender + " (" + plugindata["plugin"] + ")");
			var data = plugindata["data"];
			Janus.debug(data);
			var pluginHandle = pluginHandles[sender];
			if(pluginHandle === undefined || pluginHandle === null) {
				Janus.warn("This handle is not attached to this session");
				return;
			}
			var jsep = json["jsep"];
			if(jsep !== undefined && jsep !== null) {
				Janus.debug("Handling SDP as well...");
				Janus.debug(jsep);
			}
			var callback = pluginHandle.onmessage;
			if(callback !== null && callback !== undefined) {
				Janus.debug("Notifying application...");
				// Send to callback specified when attaching plugin handle
				callback(data, jsep);
			} else {
				// Send to generic callback (?)
				Janus.debug("No provided notification callback");
			}
		} else {
			Janus.warn("Unknown message/event  '" + json["janus"] + "' on session " + sessionId);
			Janus.debug(json);
		}
	}

	// Private helper to send keep-alive messages on WebSockets
	function keepAlive() {
		if(server === null || !websockets || !connected)
			return;
		wsKeepaliveTimeoutId = setTimeout(keepAlive, keepAlivePeriod);
		var request = { "janus": "keepalive", "session_id": sessionId, "transaction": Janus.randomString(12) };
		if(token !== null && token !== undefined)
			request["token"] = token;
		if(apisecret !== null && apisecret !== undefined)
			request["apisecret"] = apisecret;
		ws.send(JSON.stringify(request));
	}

	// Private method to create a session
	function createSession(callbacks) {
		var transaction = Janus.randomString(12);
		var request = { "janus": "create", "transaction": transaction };
		if(callbacks["reconnect"]) {
			// We're reconnecting, claim the session
			connected = false;
			request["janus"] = "claim";
			request["session_id"] = sessionId;
			// If we were using websockets, ignore the old connection
			if(ws) {
				ws.onopen = null;
				ws.onerror = null;
				ws.onclose = null;
				if(wsKeepaliveTimeoutId) {
					clearTimeout(wsKeepaliveTimeoutId);
					wsKeepaliveTimeoutId = null;
				}
			}
		}
		if(token !== null && token !== undefined)
			request["token"] = token;
		if(apisecret !== null && apisecret !== undefined)
			request["apisecret"] = apisecret;
		if(server === null && Janus.isArray(servers)) {
			// We still need to find a working server from the list we were given
			server = servers[serversIndex];
			if(server.indexOf("ws") === 0) {
				websockets = true;
				Janus.log("Server #" + (serversIndex+1) + ": trying WebSockets to contact YMRTC (" + server + ")");
			} else {
				websockets = false;
				Janus.log("Server #" + (serversIndex+1) + ": trying REST API to contact YMRTC (" + server + ")");
			}
		}
		if(websockets) {
			ws = Janus.newWebSocket(server, 'janus-protocol');
			wsHandlers = {
				'error': function() {
					Janus.error("Error connecting to the YMRTC WebSockets server... " + server);
					if (Janus.isArray(servers) && !callbacks["reconnect"]) {
						serversIndex++;
						if (serversIndex == servers.length) {
							// We tried all the servers the user gave us and they all failed
							callbacks.error("Error connecting to any of the provided YMRTC servers: Is the server down?");
							return;
						}
						// Let's try the next server
						server = null;
						setTimeout(function() {
							createSession(callbacks);
						}, 200);
						return;
					}
					callbacks.error("Error connecting to the YMRTC WebSockets server: Is the server down?");
				},

				'open': function() {
					// We need to be notified about the success
					transactions[transaction] = function(json) {
						Janus.debug(json);
						if (json["janus"] !== "success") {
							Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
							callbacks.error(json["error"].reason);
							return;
						}
						wsKeepaliveTimeoutId = setTimeout(keepAlive, keepAlivePeriod);
						connected = true;
						sessionId = json["session_id"] ? json["session_id"] : json.data["id"];
						if(callbacks["reconnect"]) {
							Janus.log("Claimed session: " + sessionId);
						} else {
							Janus.log("Created session: " + sessionId);
						}
						Janus.sessions[sessionId] = that;
						callbacks.success();
					};
					ws.send(JSON.stringify(request));
				},

				'message': function(event) {
					handleEvent(JSON.parse(event.data));
				},

				'close': function() {
					if (server === null || !connected) {
						return;
					}
					connected = false;
					// FIXME What if this is called when the page is closed?
					gatewayCallbacks.error("Lost connection to the server (is it down?)");
				}
			};

			for(var eventName in wsHandlers) {
				ws.addEventListener(eventName, wsHandlers[eventName]);
			}

			return;
		}
		Janus.httpAPICall(server, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Janus.debug(json);
				if(json["janus"] !== "success") {
					Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					callbacks.error(json["error"].reason);
					return;
				}
				connected = true;
				sessionId = json["session_id"] ? json["session_id"] : json.data["id"];
				if(callbacks["reconnect"]) {
					Janus.log("Claimed session: " + sessionId);
				} else {
					Janus.log("Created session: " + sessionId);
				}
				Janus.sessions[sessionId] = that;
				eventHandler();
				callbacks.success();
			},
			error: function(textStatus, errorThrown) {
				Janus.error(textStatus + ":", errorThrown);	// FIXME
				if(Janus.isArray(servers) && !callbacks["reconnect"]) {
					serversIndex++;
					if(serversIndex == servers.length) {
						// We tried all the servers the user gave us and they all failed
						callbacks.error("Error connecting to any of the provided YMRTC servers: Is the server down?");
						return;
					}
					// Let's try the next server
					server = null;
					setTimeout(function() { createSession(callbacks); }, 200);
					return;
				}
				if(errorThrown === "")
					callbacks.error(textStatus + ": Is the server down?");
				else
					callbacks.error(textStatus + ": " + errorThrown);
			}
		});
	}

	// Private method to destroy a session
	function destroySession(callbacks) {
		callbacks = callbacks || {};
		// FIXME This method triggers a success even when we fail
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		var asyncRequest = true;
		if(callbacks.asyncRequest !== undefined && callbacks.asyncRequest !== null)
			asyncRequest = (callbacks.asyncRequest === true);
		var notifyDestroyed = true;
		if(callbacks.notifyDestroyed !== undefined && callbacks.notifyDestroyed !== null)
			notifyDestroyed = (callbacks.notifyDestroyed === true);
		Janus.log("Destroying session " + sessionId + " (async=" + asyncRequest + ")");
		if(!connected) {
			Janus.warn("Is the server down? (connected=false)");
			callbacks.success();
			return;
		}
		if(sessionId === undefined || sessionId === null) {
			Janus.warn("No session to destroy");
			callbacks.success();
			if(notifyDestroyed)
				gatewayCallbacks.destroyed();
			return;
		}
		delete Janus.sessions[sessionId];
		// No need to destroy all handles first, YMRTC will do that itself
		var request = { "janus": "destroy", "transaction": Janus.randomString(12) };
		if(token !== null && token !== undefined)
			request["token"] = token;
		if(apisecret !== null && apisecret !== undefined)
			request["apisecret"] = apisecret;
		if(websockets) {
			request["session_id"] = sessionId;

			var unbindWebSocket = function() {
				for(var eventName in wsHandlers) {
					ws.removeEventListener(eventName, wsHandlers[eventName]);
				}
				ws.removeEventListener('message', onUnbindMessage);
				ws.removeEventListener('error', onUnbindError);
				if(wsKeepaliveTimeoutId) {
					clearTimeout(wsKeepaliveTimeoutId);
				}
				ws.close();
			};

			var onUnbindMessage = function(event){
				var data = JSON.parse(event.data);
				if(data.session_id == request.session_id && data.transaction == request.transaction) {
					unbindWebSocket();
					callbacks.success();
					if(notifyDestroyed)
						gatewayCallbacks.destroyed();
				}
			};
			var onUnbindError = function(event) {
				unbindWebSocket();
				callbacks.error("Failed to destroy the server: Is the server down?");
				if(notifyDestroyed)
					gatewayCallbacks.destroyed();
			};

			ws.addEventListener('message', onUnbindMessage);
			ws.addEventListener('error', onUnbindError);

			ws.send(JSON.stringify(request));
			return;
		}
		Janus.httpAPICall(server + "/" + sessionId, {
			verb: 'POST',
			async: asyncRequest,	// Sometimes we need false here, or destroying in onbeforeunload won't work
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Janus.log("Destroyed session:");
				Janus.debug(json);
				sessionId = null;
				connected = false;
				if(json["janus"] !== "success") {
					Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
				}
				callbacks.success();
				if(notifyDestroyed)
					gatewayCallbacks.destroyed();
			},
			error: function(textStatus, errorThrown) {
				Janus.error(textStatus + ":", errorThrown);	// FIXME
				// Reset everything anyway
				sessionId = null;
				connected = false;
				callbacks.success();
				if(notifyDestroyed)
					gatewayCallbacks.destroyed();
			}
		});
	}

	// Private method to create a plugin handle
	function createHandle(callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		callbacks.consentDialog = (typeof callbacks.consentDialog == "function") ? callbacks.consentDialog : Janus.noop;
		callbacks.iceState = (typeof callbacks.iceState == "function") ? callbacks.iceState : Janus.noop;
		callbacks.mediaState = (typeof callbacks.mediaState == "function") ? callbacks.mediaState : Janus.noop;
		callbacks.webrtcState = (typeof callbacks.webrtcState == "function") ? callbacks.webrtcState : Janus.noop;
		callbacks.slowLink = (typeof callbacks.slowLink == "function") ? callbacks.slowLink : Janus.noop;
		callbacks.onmessage = (typeof callbacks.onmessage == "function") ? callbacks.onmessage : Janus.noop;
		callbacks.onlocalstream = (typeof callbacks.onlocalstream == "function") ? callbacks.onlocalstream : Janus.noop;
		callbacks.onremotestream = (typeof callbacks.onremotestream == "function") ? callbacks.onremotestream : Janus.noop;
		callbacks.ondata = (typeof callbacks.ondata == "function") ? callbacks.ondata : Janus.noop;
		callbacks.ondataopen = (typeof callbacks.ondataopen == "function") ? callbacks.ondataopen : Janus.noop;
		callbacks.oncleanup = (typeof callbacks.oncleanup == "function") ? callbacks.oncleanup : Janus.noop;
		callbacks.ondetached = (typeof callbacks.ondetached == "function") ? callbacks.ondetached : Janus.noop;
		if(!connected) {
			Janus.warn("Is the server down? (connected=false)");
			callbacks.error("Is the server down? (connected=false)");
			return;
		}
		var plugin = callbacks.plugin;
		if(plugin === undefined || plugin === null) {
			Janus.error("Invalid plugin");
			callbacks.error("Invalid plugin");
			return;
		}
		var opaqueId = callbacks.opaqueId;
		var handleToken = callbacks.token ? callbacks.token : token;
		var transaction = Janus.randomString(12);
		var request = { "janus": "attach", "plugin": plugin, "opaque_id": opaqueId, "transaction": transaction };
		if(handleToken !== null && handleToken !== undefined)
			request["token"] = handleToken;
		if(apisecret !== null && apisecret !== undefined)
			request["apisecret"] = apisecret;
		if(websockets) {
			transactions[transaction] = function(json) {
				Janus.debug(json);
				if(json["janus"] !== "success") {
					Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					callbacks.error("Ooops: " + json["error"].code + " " + json["error"].reason);
					return;
				}
				var handleId = json.data["id"];
				Janus.log("Created handle: " + handleId);
				var pluginHandle =
					{
						session : that,
						plugin : plugin,
						id : handleId,
						token : handleToken,
						detached : false,
						webrtcStuff : {
							started : false,
							myStream : null,
							streamExternal : false,
							remoteStream : null,
							mySdp : null,
							mediaConstraints : null,
							pc : null,
							dataChannel : null,
							dtmfSender : null,
							trickle : true,
							iceDone : false,
							volume : {
								value : null,
								timer : null
							},
							bitrate : {
								value : null,
								bsnow : null,
								bsbefore : null,
								tsnow : null,
								tsbefore : null,
								timer : null
							}
						},
						getId : function() { return handleId; },
						getPlugin : function() { return plugin; },
						getVolume : function() { return getVolume(handleId, true); },
						getRemoteVolume : function() { return getVolume(handleId, true); },
						getLocalVolume : function() { return getVolume(handleId, false); },
						isAudioMuted : function() { return isMuted(handleId, false); },
						muteAudio : function() { return mute(handleId, false, true); },
						unmuteAudio : function() { return mute(handleId, false, false); },
						isVideoMuted : function() { return isMuted(handleId, true); },
						muteVideo : function() { return mute(handleId, true, true); },
						unmuteVideo : function() { return mute(handleId, true, false); },
						getBitrate : function() { return getBitrate(handleId); },
						send : function(callbacks) { sendMessage(handleId, callbacks); },
						data : function(callbacks) { sendData(handleId, callbacks); },
						dtmf : function(callbacks) { sendDtmf(handleId, callbacks); },
						consentDialog : callbacks.consentDialog,
						iceState : callbacks.iceState,
						mediaState : callbacks.mediaState,
						webrtcState : callbacks.webrtcState,
						slowLink : callbacks.slowLink,
						onmessage : callbacks.onmessage,
						createOffer : function(callbacks) { prepareWebrtc(handleId, callbacks); },
						createAnswer : function(callbacks) { prepareWebrtc(handleId, callbacks); },
						handleRemoteJsep : function(callbacks) { prepareWebrtcPeer(handleId, callbacks); },
						onlocalstream : callbacks.onlocalstream,
						onremotestream : callbacks.onremotestream,
						ondata : callbacks.ondata,
						ondataopen : callbacks.ondataopen,
						oncleanup : callbacks.oncleanup,
						ondetached : callbacks.ondetached,
						hangup : function(sendRequest) { cleanupWebrtc(handleId, sendRequest === true); },
						detach : function(callbacks) { destroyHandle(handleId, callbacks); }
					};
				pluginHandles[handleId] = pluginHandle;
				callbacks.success(pluginHandle);
			};
			request["session_id"] = sessionId;
			ws.send(JSON.stringify(request));
			return;
		}
		Janus.httpAPICall(server + "/" + sessionId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Janus.debug(json);
				if(json["janus"] !== "success") {
					Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					callbacks.error("Ooops: " + json["error"].code + " " + json["error"].reason);
					return;
				}
				var handleId = json.data["id"];
				Janus.log("Created handle: " + handleId);
				var pluginHandle =
					{
						session : that,
						plugin : plugin,
						id : handleId,
						token : handleToken,
						detached : false,
						webrtcStuff : {
							started : false,
							myStream : null,
							streamExternal : false,
							remoteStream : null,
							mySdp : null,
							mediaConstraints : null,
							pc : null,
							dataChannel : null,
							dtmfSender : null,
							trickle : true,
							iceDone : false,
							volume : {
								value : null,
								timer : null
							},
							bitrate : {
								value : null,
								bsnow : null,
								bsbefore : null,
								tsnow : null,
								tsbefore : null,
								timer : null
							}
						},
						getId : function() { return handleId; },
						getPlugin : function() { return plugin; },
						getVolume : function() { return getVolume(handleId, true); },
						getRemoteVolume : function() { return getVolume(handleId, true); },
						getLocalVolume : function() { return getVolume(handleId, false); },
						isAudioMuted : function() { return isMuted(handleId, false); },
						muteAudio : function() { return mute(handleId, false, true); },
						unmuteAudio : function() { return mute(handleId, false, false); },
						isVideoMuted : function() { return isMuted(handleId, true); },
						muteVideo : function() { return mute(handleId, true, true); },
						unmuteVideo : function() { return mute(handleId, true, false); },
						getBitrate : function() { return getBitrate(handleId); },
						send : function(callbacks) { sendMessage(handleId, callbacks); },
						data : function(callbacks) { sendData(handleId, callbacks); },
						dtmf : function(callbacks) { sendDtmf(handleId, callbacks); },
						consentDialog : callbacks.consentDialog,
						iceState : callbacks.iceState,
						mediaState : callbacks.mediaState,
						webrtcState : callbacks.webrtcState,
						slowLink : callbacks.slowLink,
						onmessage : callbacks.onmessage,
						createOffer : function(callbacks) { prepareWebrtc(handleId, callbacks); },
						createAnswer : function(callbacks) { prepareWebrtc(handleId, callbacks); },
						handleRemoteJsep : function(callbacks) { prepareWebrtcPeer(handleId, callbacks); },
						onlocalstream : callbacks.onlocalstream,
						onremotestream : callbacks.onremotestream,
						ondata : callbacks.ondata,
						ondataopen : callbacks.ondataopen,
						oncleanup : callbacks.oncleanup,
						ondetached : callbacks.ondetached,
						hangup : function(sendRequest) { cleanupWebrtc(handleId, sendRequest === true); },
						detach : function(callbacks) { destroyHandle(handleId, callbacks); }
					};
				pluginHandles[handleId] = pluginHandle;
				callbacks.success(pluginHandle);
			},
			error: function(textStatus, errorThrown) {
				Janus.error(textStatus + ":", errorThrown);	// FIXME
			}
		});
	}

	// Private method to send a message
	function sendMessage(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		if(!connected) {
			Janus.warn("Is the server down? (connected=false)");
			callbacks.error("Is the server down? (connected=false)");
			return;
		}
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var message = callbacks.message;
		var jsep = callbacks.jsep;
		var transaction = Janus.randomString(12);
		var request = { "janus": "message", "body": message, "transaction": transaction };
		if(pluginHandle.token !== null && pluginHandle.token !== undefined)
			request["token"] = pluginHandle.token;
		if(apisecret !== null && apisecret !== undefined)
			request["apisecret"] = apisecret;
		if(jsep !== null && jsep !== undefined)
			request.jsep = jsep;
		Janus.debug("Sending message to plugin (handle=" + handleId + "):");
		Janus.debug(request);
		if(websockets) {
			request["session_id"] = sessionId;
			request["handle_id"] = handleId;
			transactions[transaction] = function(json) {
				Janus.debug("Message sent!");
				Janus.debug(json);
				if(json["janus"] === "success") {
					// We got a success, must have been a synchronous transaction
					var plugindata = json["plugindata"];
					if(plugindata === undefined || plugindata === null) {
						Janus.warn("Request succeeded, but missing plugindata...");
						callbacks.success();
						return;
					}
					Janus.log("Synchronous transaction successful (" + plugindata["plugin"] + ")");
					var data = plugindata["data"];
					Janus.debug(data);
					callbacks.success(data);
					return;
				} else if(json["janus"] !== "ack") {
					// Not a success and not an ack, must be an error
					if(json["error"] !== undefined && json["error"] !== null) {
						Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
						callbacks.error(json["error"].code + " " + json["error"].reason);
					} else {
						Janus.error("Unknown error");	// FIXME
						callbacks.error("Unknown error");
					}
					return;
				}
				// If we got here, the plugin decided to handle the request asynchronously
				callbacks.success();
			};
			ws.send(JSON.stringify(request));
			return;
		}
		Janus.httpAPICall(server + "/" + sessionId + "/" + handleId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Janus.debug("Message sent!");
				Janus.debug(json);
				if(json["janus"] === "success") {
					// We got a success, must have been a synchronous transaction
					var plugindata = json["plugindata"];
					if(plugindata === undefined || plugindata === null) {
						Janus.warn("Request succeeded, but missing plugindata...");
						callbacks.success();
						return;
					}
					Janus.log("Synchronous transaction successful (" + plugindata["plugin"] + ")");
					var data = plugindata["data"];
					Janus.debug(data);
					callbacks.success(data);
					return;
				} else if(json["janus"] !== "ack") {
					// Not a success and not an ack, must be an error
					if(json["error"] !== undefined && json["error"] !== null) {
						Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
						callbacks.error(json["error"].code + " " + json["error"].reason);
					} else {
						Janus.error("Unknown error");	// FIXME
						callbacks.error("Unknown error");
					}
					return;
				}
				// If we got here, the plugin decided to handle the request asynchronously
				callbacks.success();
			},
			error: function(textStatus, errorThrown) {
				Janus.error(textStatus + ":", errorThrown);	// FIXME
				callbacks.error(textStatus + ": " + errorThrown);
			}
		});
	}

	// Private method to send a trickle candidate
	function sendTrickleCandidate(handleId, candidate) {
		if(!connected) {
			Janus.warn("Is the server down? (connected=false)");
			return;
		}
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			return;
		}
		var request = { "janus": "trickle", "candidate": candidate, "transaction": Janus.randomString(12) };
		if(pluginHandle.token !== null && pluginHandle.token !== undefined)
			request["token"] = pluginHandle.token;
		if(apisecret !== null && apisecret !== undefined)
			request["apisecret"] = apisecret;
		Janus.vdebug("Sending trickle candidate (handle=" + handleId + "):");
		Janus.vdebug(request);
		if(websockets) {
			request["session_id"] = sessionId;
			request["handle_id"] = handleId;
			ws.send(JSON.stringify(request));
			return;
		}
		Janus.httpAPICall(server + "/" + sessionId + "/" + handleId, {
			verb: 'POST',
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Janus.vdebug("Candidate sent!");
				Janus.vdebug(json);
				if(json["janus"] !== "ack") {
					Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
					return;
				}
			},
			error: function(textStatus, errorThrown) {
				Janus.error(textStatus + ":", errorThrown);	// FIXME
			}
		});
	}

	// Private method to send a data channel message
	function sendData(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		var text = callbacks.text;
		if(text === null || text === undefined) {
			Janus.warn("Invalid text");
			callbacks.error("Invalid text");
			return;
		}
		Janus.log("Sending string on data channel: " + text);
		config.dataChannel.send(text);
		callbacks.success();
	}

	// Private method to send a DTMF tone
	function sendDtmf(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		if(config.dtmfSender === null || config.dtmfSender === undefined) {
			// Create the DTMF sender the proper way, if possible
			if(config.pc !== undefined && config.pc !== null) {
				var senders = config.pc.getSenders();
				var audioSender = senders.find(function(sender) {
					return sender.track && sender.track.kind === 'audio';
				});
				if(!audioSender) {
					Janus.warn("Invalid DTMF configuration (no audio track)");
					callbacks.error("Invalid DTMF configuration (no audio track)");
					return;
				}
				config.dtmfSender = audioSender.dtmf;
				if(config.dtmfSender) {
					Janus.log("Created DTMF Sender");
					config.dtmfSender.ontonechange = function(tone) { Janus.debug("Sent DTMF tone: " + tone.tone); };
				}
			}
			if(config.dtmfSender === null || config.dtmfSender === undefined) {
				Janus.warn("Invalid DTMF configuration");
				callbacks.error("Invalid DTMF configuration");
				return;
			}
		}
		var dtmf = callbacks.dtmf;
		if(dtmf === null || dtmf === undefined) {
			Janus.warn("Invalid DTMF parameters");
			callbacks.error("Invalid DTMF parameters");
			return;
		}
		var tones = dtmf.tones;
		if(tones === null || tones === undefined) {
			Janus.warn("Invalid DTMF string");
			callbacks.error("Invalid DTMF string");
			return;
		}
		var duration = dtmf.duration;
		if(duration === null || duration === undefined)
			duration = 500;	// We choose 500ms as the default duration for a tone
		var gap = dtmf.gap;
		if(gap === null || gap === undefined)
			gap = 50;	// We choose 50ms as the default gap between tones
		Janus.debug("Sending DTMF string " + tones + " (duration " + duration + "ms, gap " + gap + "ms)");
		config.dtmfSender.insertDTMF(tones, duration, gap);
	}

	// Private method to destroy a plugin handle
	function destroyHandle(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		var asyncRequest = true;
		if(callbacks.asyncRequest !== undefined && callbacks.asyncRequest !== null)
			asyncRequest = (callbacks.asyncRequest === true);
		Janus.log("Destroying handle " + handleId + " (async=" + asyncRequest + ")");
		cleanupWebrtc(handleId);
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined || pluginHandle.detached) {
			// Plugin was already detached by Janus, calling detach again will return a handle not found error, so just exit here
			delete pluginHandles[handleId];
			callbacks.success();
			return;
		}
		if(!connected) {
			Janus.warn("Is the server down? (connected=false)");
			callbacks.error("Is the server down? (connected=false)");
			return;
		}
		var request = { "janus": "detach", "transaction": Janus.randomString(12) };
		if(pluginHandle.token !== null && pluginHandle.token !== undefined)
			request["token"] = pluginHandle.token;
		if(apisecret !== null && apisecret !== undefined)
			request["apisecret"] = apisecret;
		if(websockets) {
			request["session_id"] = sessionId;
			request["handle_id"] = handleId;
			ws.send(JSON.stringify(request));
			delete pluginHandles[handleId];
			callbacks.success();
			return;
		}
		Janus.httpAPICall(server + "/" + sessionId + "/" + handleId, {
			verb: 'POST',
			async: asyncRequest,	// Sometimes we need false here, or destroying in onbeforeunload won't work
			withCredentials: withCredentials,
			body: request,
			success: function(json) {
				Janus.log("Destroyed handle:");
				Janus.debug(json);
				if(json["janus"] !== "success") {
					Janus.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
				}
				delete pluginHandles[handleId];
				callbacks.success();
			},
			error: function(textStatus, errorThrown) {
				Janus.error(textStatus + ":", errorThrown);	// FIXME
				// We cleanup anyway
				delete pluginHandles[handleId];
				callbacks.success();
			}
		});
	}

	// WebRTC stuff
	function streamsDone(handleId, jsep, media, callbacks, stream) {
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		Janus.debug("streamsDone:", stream);
		if(stream) {
			Janus.debug("  -- Audio tracks:", stream.getAudioTracks());
			Janus.debug("  -- Video tracks:", stream.getVideoTracks());
		}
		// We're now capturing the new stream: check if we're updating or if it's a new thing
		var addTracks = false;
		if(!config.myStream || !media.update || config.streamExternal) {
			config.myStream = stream;
			addTracks = true;
		} else {
			// We only need to update the existing stream
			if(((!media.update && isAudioSendEnabled(media)) || (media.update && (media.addAudio || media.replaceAudio))) &&
					stream.getAudioTracks() && stream.getAudioTracks().length) {
				config.myStream.addTrack(stream.getAudioTracks()[0]);
				if(media.replaceAudio && Janus.webRTCAdapter.browserDetails.browser === "firefox") {
					Janus.log("Replacing audio track:", stream.getAudioTracks()[0]);
					for(var index in config.pc.getSenders()) {
						var s = config.pc.getSenders()[index];
						if(s && s.track && s.track.kind === "audio") {
							s.replaceTrack(stream.getAudioTracks()[0]);
						}
					}
				} else {
					if(Janus.webRTCAdapter.browserDetails.browser === "firefox" && Janus.webRTCAdapter.browserDetails.version >= 59) {
						// Firefox >= 59 uses Transceivers
						Janus.log((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
						var audioTransceiver = null;
						var transceivers = config.pc.getTransceivers();
						if(transceivers && transceivers.length > 0) {
							for(var i in transceivers) {
								var t = transceivers[i];
								if((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
										(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
									audioTransceiver = t;
									break;
								}
							}
						}
						if(audioTransceiver && audioTransceiver.sender) {
							audioTransceiver.sender.replaceTrack(stream.getVideoTracks()[0]);
						} else {
							config.pc.addTrack(stream.getVideoTracks()[0], stream);
						}
					} else {
						Janus.log((media.replaceAudio ? "Replacing" : "Adding") + " audio track:", stream.getAudioTracks()[0]);
						config.pc.addTrack(stream.getAudioTracks()[0], stream);
					}
				}
			}
			if(((!media.update && isVideoSendEnabled(media)) || (media.update && (media.addVideo || media.replaceVideo))) &&
					stream.getVideoTracks() && stream.getVideoTracks().length) {
				config.myStream.addTrack(stream.getVideoTracks()[0]);
				if(media.replaceVideo && Janus.webRTCAdapter.browserDetails.browser === "firefox") {
					Janus.log("Replacing video track:", stream.getVideoTracks()[0]);
					for(var index in config.pc.getSenders()) {
						var s = config.pc.getSenders()[index];
						if(s && s.track && s.track.kind === "video") {
							s.replaceTrack(stream.getVideoTracks()[0]);
						}
					}
				} else {
					if(Janus.webRTCAdapter.browserDetails.browser === "firefox" && Janus.webRTCAdapter.browserDetails.version >= 59) {
						// Firefox >= 59 uses Transceivers
						Janus.log((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
						var videoTransceiver = null;
						var transceivers = config.pc.getTransceivers();
						if(transceivers && transceivers.length > 0) {
							for(var i in transceivers) {
								var t = transceivers[i];
								if((t.sender && t.sender.track && t.sender.track.kind === "video") ||
										(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
									videoTransceiver = t;
									break;
								}
							}
						}
						if(videoTransceiver && videoTransceiver.sender) {
							videoTransceiver.sender.replaceTrack(stream.getVideoTracks()[0]);
						} else {
							config.pc.addTrack(stream.getVideoTracks()[0], stream);
						}
					} else {
						Janus.log((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
						config.pc.addTrack(stream.getVideoTracks()[0], stream);
					}
				}
			}
		}
		// If we still need to create a PeerConnection, let's do that
		if(!config.pc) {
			var pc_config = {"iceServers": iceServers, "iceTransportPolicy": iceTransportPolicy, "bundlePolicy": bundlePolicy};
			//~ var pc_constraints = {'mandatory': {'MozDontOfferDataChannel':true}};
			var pc_constraints = {
				"optional": [{"DtlsSrtpKeyAgreement": true}]
			};
			if(ipv6Support === true) {
				pc_constraints.optional.push({"googIPv6":true});
			}
			// Any custom constraint to add?
			if(callbacks.rtcConstraints && typeof callbacks.rtcConstraints === 'object') {
				Janus.debug("Adding custom PeerConnection constraints:", callbacks.rtcConstraints);
				for(var i in callbacks.rtcConstraints) {
					pc_constraints.optional.push(callbacks.rtcConstraints[i]);
				}
			}
			if(Janus.webRTCAdapter.browserDetails.browser === "edge") {
				// This is Edge, enable BUNDLE explicitly
				pc_config.bundlePolicy = "max-bundle";
			}
			Janus.log("Creating PeerConnection");
			Janus.debug(pc_constraints);
			config.pc = new RTCPeerConnection(pc_config, pc_constraints);
			Janus.debug(config.pc);
			if(config.pc.getStats) {	// FIXME
				config.volume = {};
				config.bitrate.value = "0 kbits/sec";
			}
			Janus.log("Preparing local SDP and gathering candidates (trickle=" + config.trickle + ")");
			config.pc.oniceconnectionstatechange = function(e) {
				if(config.pc)
					pluginHandle.iceState(config.pc.iceConnectionState);
			};
			config.pc.onicecandidate = function(event) {
				if (event.candidate == null ||
						(Janus.webRTCAdapter.browserDetails.browser === 'edge' && event.candidate.candidate.indexOf('endOfCandidates') > 0)) {
					Janus.log("End of candidates.");
					config.iceDone = true;
					if(config.trickle === true) {
						// Notify end of candidates
						sendTrickleCandidate(handleId, {"completed": true});
					} else {
						// No trickle, time to send the complete SDP (including all candidates)
						sendSDP(handleId, callbacks);
					}
				} else {
					// JSON.stringify doesn't work on some WebRTC objects anymore
					// See https://code.google.com/p/chromium/issues/detail?id=467366
					var candidate = {
						"candidate": event.candidate.candidate,
						"sdpMid": event.candidate.sdpMid,
						"sdpMLineIndex": event.candidate.sdpMLineIndex
					};
					if(config.trickle === true) {
						// Send candidate
						sendTrickleCandidate(handleId, candidate);
					}
				}
			};
			config.pc.ontrack = function(event) {
				Janus.log("Handling Remote Track");
				Janus.debug(event);
				if(!event.streams)
					return;
				config.remoteStream = event.streams[0];
				pluginHandle.onremotestream(config.remoteStream);
				if(event.track && !event.track.onended) {
					Janus.log("Adding onended callback to track:", event.track);
					event.track.onended = function(ev) {
						Janus.log("Remote track removed:", ev);
						if(config.remoteStream) {
							config.remoteStream.removeTrack(ev.target);
							pluginHandle.onremotestream(config.remoteStream);
						}
					};
				}
			};
		}
		if(addTracks && stream !== null && stream !== undefined) {
			Janus.log('Adding local stream');
			stream.getTracks().forEach(function(track) {
				Janus.log('Adding local track:', track);
				config.pc.addTrack(track, stream);
			});
		}
		// Any data channel to create?
		if(isDataEnabled(media) && !config.dataChannel) {
			Janus.log("Creating data channel");
			var onDataChannelMessage = function(event) {
				Janus.log('Received message on data channel: ' + event.data);
				pluginHandle.ondata(event.data);	// FIXME
			};
			var onDataChannelStateChange = function() {
				var dcState = config.dataChannel !== null ? config.dataChannel.readyState : "null";
				Janus.log('State change on data channel: ' + dcState);
				if(dcState === 'open') {
					pluginHandle.ondataopen();	// FIXME
				}
			};
			var onDataChannelError = function(error) {
				Janus.error('Got error on data channel:', error);
				// TODO
			};
			// Until we implement the proxying of open requests within the YMRTC core, we open a channel ourselves whatever the case
			config.dataChannel = config.pc.createDataChannel("JanusDataChannel", {ordered:false});	// FIXME Add options (ordered, maxRetransmits, etc.)
			config.dataChannel.onmessage = onDataChannelMessage;
			config.dataChannel.onopen = onDataChannelStateChange;
			config.dataChannel.onclose = onDataChannelStateChange;
			config.dataChannel.onerror = onDataChannelError;
		}
		// If there's a new local stream, let's notify the application
		if(config.myStream)
			pluginHandle.onlocalstream(config.myStream);
		// Create offer/answer now
		if(jsep === null || jsep === undefined) {
			createOffer(handleId, media, callbacks);
		} else {
			config.pc.setRemoteDescription(jsep)
				.then(function() {
					Janus.log("Remote description accepted!");
					config.remoteSdp = jsep.sdp;
					// Any trickle candidate we cached?
					if(config.candidates && config.candidates.length > 0) {
						for(var i in config.candidates) {
							var candidate = config.candidates[i];
							Janus.debug("Adding remote candidate:", candidate);
							if(!candidate || candidate.completed === true) {
								// end-of-candidates
								config.pc.addIceCandidate();
							} else {
								// New candidate
								config.pc.addIceCandidate(candidate);
							}
						}
						config.candidates = [];
					}
					// Create the answer now
					createAnswer(handleId, media, callbacks);
				}, callbacks.error);
		}
	}

	function prepareWebrtc(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : webrtcError;
		var jsep = callbacks.jsep;
		callbacks.media = callbacks.media || { audio: true, video: true };
		var media = callbacks.media;
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		config.trickle = isTrickleEnabled(callbacks.trickle);
		// Are we updating a session?
		if(config.pc === undefined || config.pc === null) {
			// Nope, new PeerConnection
			media.update = false;
			media.keepAudio = false;
			media.keepVideo = false;
		} else if(config.pc !== undefined && config.pc !== null) {
			Janus.log("Updating existing media session");
			media.update = true;
			// Check if there's anything to add/remove/replace, or if we
			// can go directly to preparing the new SDP offer or answer
			if(callbacks.stream !== null && callbacks.stream !== undefined) {
				// External stream: is this the same as the one we were using before?
				if(callbacks.stream !== config.myStream) {
					Janus.log("Renegotiation involves a new external stream");
				}
			} else {
				// Check if there are changes on audio
				if(media.addAudio) {
					media.keepAudio = false;
					media.replaceAudio = false;
					media.removeAudio = false;
					media.audioSend = true;
					if(config.myStream && config.myStream.getAudioTracks() && config.myStream.getAudioTracks().length) {
						Janus.error("Can't add audio stream, there already is one");
						callbacks.error("Can't add audio stream, there already is one");
						return;
					}
				} else if(media.removeAudio) {
					media.keepAudio = false;
					media.replaceAudio = false;
					media.addAudio = false;
					media.audioSend = false;
				} else if(media.replaceAudio) {
					media.keepAudio = false;
					media.addAudio = false;
					media.removeAudio = false;
					media.audioSend = true;
				}
				if(config.myStream === null || config.myStream === undefined) {
					// No media stream: if we were asked to replace, it's actually an "add"
					if(media.replaceAudio) {
						media.keepAudio = false;
						media.replaceAudio = false;
						media.addAudio = true;
						media.audioSend = true;
					}
					if(isAudioSendEnabled(media)) {
						media.keepAudio = false;
						media.addAudio = true;
					}
				} else {
					if(config.myStream.getAudioTracks() === null
							|| config.myStream.getAudioTracks() === undefined
							|| config.myStream.getAudioTracks().length === 0) {
						// No audio track: if we were asked to replace, it's actually an "add"
						if(media.replaceAudio) {
							media.keepAudio = false;
							media.replaceAudio = false;
							media.addAudio = true;
							media.audioSend = true;
						}
						if(isAudioSendEnabled(media)) {
							media.keepVideo = false;
							media.addAudio = true;
						}
					} else {
						// We have an audio track: should we keep it as it is?
						if(isAudioSendEnabled(media) &&
								!media.removeAudio && !media.replaceAudio) {
							media.keepAudio = true;
						}
					}
				}
				// Check if there are changes on video
				if(media.addVideo) {
					media.keepVideo = false;
					media.replaceVideo = false;
					media.removeVideo = false;
					media.videoSend = true;
					if(config.myStream && config.myStream.getVideoTracks() && config.myStream.getVideoTracks().length) {
						Janus.error("Can't add video stream, there already is one");
						callbacks.error("Can't add video stream, there already is one");
						return;
					}
				} else if(media.removeVideo) {
					media.keepVideo = false;
					media.replaceVideo = false;
					media.addVideo = false;
					media.videoSend = false;
				} else if(media.replaceVideo) {
					media.keepVideo = false;
					media.addVideo = false;
					media.removeVideo = false;
					media.videoSend = true;
				}
				if(config.myStream === null || config.myStream === undefined) {
					// No media stream: if we were asked to replace, it's actually an "add"
					if(media.replaceVideo) {
						media.keepVideo = false;
						media.replaceVideo = false;
						media.addVideo = true;
						media.videoSend = true;
					}
					if(isVideoSendEnabled(media)) {
						media.keepVideo = false;
						media.addVideo = true;
					}
				} else {
					if(config.myStream.getVideoTracks() === null
							|| config.myStream.getVideoTracks() === undefined
							|| config.myStream.getVideoTracks().length === 0) {
						// No video track: if we were asked to replace, it's actually an "add"
						if(media.replaceVideo) {
							media.keepVideo = false;
							media.replaceVideo = false;
							media.addVideo = true;
							media.videoSend = true;
						}
						if(isVideoSendEnabled(media)) {
							media.keepVideo = false;
							media.addVideo = true;
						}
					} else {
						// We have a video track: should we keep it as it is?
						if(isVideoSendEnabled(media) &&
								!media.removeVideo && !media.replaceVideo) {
							media.keepVideo = true;
						}
					}
				}
				// Data channels can only be added
				if(media.addData)
					media.data = true;
			}
			// If we're updating and keeping all tracks, let's skip the getUserMedia part
			if((isAudioSendEnabled(media) && media.keepAudio) &&
					(isVideoSendEnabled(media) && media.keepVideo)) {
				streamsDone(handleId, jsep, media, callbacks, config.myStream);
				return;
			}
		}
		// If we're updating, check if we need to remove/replace one of the tracks
		if(media.update && !config.streamExternal) {
			if(media.removeAudio || media.replaceAudio) {
				if(config.myStream && config.myStream.getAudioTracks() && config.myStream.getAudioTracks().length) {
					var s = config.myStream.getAudioTracks()[0];
					Janus.log("Removing audio track:", s);
					config.myStream.removeTrack(s);
					try {
						s.stop();
					} catch(e) {}
				}
				if(config.pc.getSenders() && config.pc.getSenders().length) {
					var ra = true;
					if(media.replaceAudio && Janus.webRTCAdapter.browserDetails.browser === "firefox") {
						// On Firefox we can use replaceTrack
						ra = false;
					}
					if(ra) {
						for(var index in config.pc.getSenders()) {
							var s = config.pc.getSenders()[index];
							if(s && s.track && s.track.kind === "audio") {
								Janus.log("Removing audio sender:", s);
								config.pc.removeTrack(s);
							}
						}
					}
				}
			}
			if(media.removeVideo || media.replaceVideo) {
				if(config.myStream && config.myStream.getVideoTracks() && config.myStream.getVideoTracks().length) {
					var s = config.myStream.getVideoTracks()[0];
					Janus.log("Removing video track:", s);
					config.myStream.removeTrack(s);
					try {
						s.stop();
					} catch(e) {}
				}
				if(config.pc.getSenders() && config.pc.getSenders().length) {
					var rv = true;
					if(media.replaceVideo && Janus.webRTCAdapter.browserDetails.browser === "firefox") {
						// On Firefox we can use replaceTrack
						rv = false;
					}
					if(rv) {
						for(var index in config.pc.getSenders()) {
							var s = config.pc.getSenders()[index];
							if(s && s.track && s.track.kind === "video") {
								Janus.log("Removing video sender:", s);
								config.pc.removeTrack(s);
							}
						}
					}
				}
			}
		}
		// Was a MediaStream object passed, or do we need to take care of that?
		if(callbacks.stream !== null && callbacks.stream !== undefined) {
			var stream = callbacks.stream;
			Janus.log("MediaStream provided by the application");
			Janus.debug(stream);
			// If this is an update, let's check if we need to release the previous stream
			if(media.update) {
				if(config.myStream && config.myStream !== callbacks.stream && !config.streamExternal) {
					// We're replacing a stream we captured ourselves with an external one
					try {
						// Try a MediaStreamTrack.stop() for each track
						var tracks = config.myStream.getTracks();
						for(var i in tracks) {
							var mst = tracks[i];
							Janus.log(mst);
							if(mst !== null && mst !== undefined)
								mst.stop();
						}
					} catch(e) {
						// Do nothing if this fails
					}
					config.myStream = null;
				}
			}
			// Skip the getUserMedia part
			config.streamExternal = true;
			streamsDone(handleId, jsep, media, callbacks, stream);
			return;
		}
		if(isAudioSendEnabled(media) || isVideoSendEnabled(media)) {
			var constraints = { mandatory: {}, optional: []};
			pluginHandle.consentDialog(true);
			var audioSupport = isAudioSendEnabled(media);
			if(audioSupport === true && media != undefined && media != null) {
				if(typeof media.audio === 'object') {
					audioSupport = media.audio;
				}
			}
			var videoSupport = isVideoSendEnabled(media);
			if(videoSupport === true && media != undefined && media != null) {
				var simulcast = callbacks.simulcast === true ? true : false;
				if(simulcast && !jsep && (media.video === undefined || media.video === false))
					media.video = "hires";
				if(media.video && media.video != 'screen' && media.video != 'window') {
					if(typeof media.video === 'object') {
						videoSupport = media.video;
					} else {
						var width = 0;
						var height = 0;
						if(media.video === 'lowres') {
							// Small resolution, 4:3
							height = 240;
							width = 320;
						} else if(media.video === 'lowres-16:9') {
							// Small resolution, 16:9
							height = 180;
							width = 320;
						} else if(media.video === 'hires' || media.video === 'hires-16:9' || media.video === 'hdres') {
							// High(HD) resolution is only 16:9
							height = 720;
							width = 1280;
						} else if(media.video === 'fhdres') {
							// Full HD resolution is only 16:9
							height = 1080;
							width = 1920;
						} else if(media.video === '4kres') {
							// 4K resolution is only 16:9
							height = 2160;
							width = 3840;
						} else if(media.video === 'stdres') {
							// Normal resolution, 4:3
							height = 480;
							width  = 640;
						} else if(media.video === 'stdres-16:9') {
							// Normal resolution, 16:9
							height = 360;
							width = 640;
						} else {
							Janus.log("Default video setting is stdres 4:3");
							height = 480;
							width = 640;
						}
						Janus.log("Adding media constraint:", media.video);
						videoSupport = {
							'height': {'ideal': height},
							'width':  {'ideal': width}
						};
						Janus.log("Adding video constraint:", videoSupport);
					}
				} else if(media.video === 'screen' || media.video === 'window') {
					if(!media.screenshareFrameRate) {
						media.screenshareFrameRate = 3;
					}
					if(navigator.getDisplayMedia) {
						// The new experimental getDisplayMedia API is available, let's use that
						// https://groups.google.com/forum/#!topic/discuss-webrtc/Uf0SrR4uxzk
						// https://webrtchacks.com/chrome-screensharing-getdisplaymedia/
						navigator.getDisplayMedia({ video: true })
							.then(function(stream) {
								pluginHandle.consentDialog(false);
								if(isAudioSendEnabled(media) && !media.keepAudio) {
									navigator.mediaDevices.getUserMedia({ audio: true, video: false })
									.then(function (audioStream) {
										stream.addTrack(audioStream.getAudioTracks()[0]);
										streamsDone(handleId, jsep, media, callbacks, stream);
									});
								} else {
									streamsDone(handleId, jsep, media, callbacks, stream);
								}
							}, function (error) {
								pluginHandle.consentDialog(false);
								callbacks.error(error);
							});
						return;
					}
					// We're going to try and use the extension for Chrome 34+, the old approach
					// for older versions of Chrome, or the experimental support in Firefox 33+
					function callbackUserMedia (error, stream) {
						pluginHandle.consentDialog(false);
						if(error) {
							callbacks.error(error);
						} else {
							streamsDone(handleId, jsep, media, callbacks, stream);
						}
					}
					function getScreenMedia(constraints, gsmCallback, useAudio) {
						Janus.log("Adding media constraint (screen capture)");
						Janus.debug(constraints);
						navigator.mediaDevices.getUserMedia(constraints)
							.then(function(stream) {
								if(useAudio) {
									navigator.mediaDevices.getUserMedia({ audio: true, video: false })
									.then(function (audioStream) {
										stream.addTrack(audioStream.getAudioTracks()[0]);
										gsmCallback(null, stream);
									});
								} else {
									gsmCallback(null, stream);
								}
							})
							.catch(function(error) { pluginHandle.consentDialog(false); gsmCallback(error); });
					}
					if(Janus.webRTCAdapter.browserDetails.browser === 'chrome') {
						var chromever = Janus.webRTCAdapter.browserDetails.version;
						var maxver = 33;
						if(window.navigator.userAgent.match('Linux'))
							maxver = 35;	// "known" crash in chrome 34 and 35 on linux
						if(chromever >= 26 && chromever <= maxver) {
							// Chrome 26->33 requires some awkward chrome://flags manipulation
							constraints = {
								video: {
									mandatory: {
										googLeakyBucket: true,
										maxWidth: window.screen.width,
										maxHeight: window.screen.height,
										minFrameRate: media.screenshareFrameRate,
										maxFrameRate: media.screenshareFrameRate,
										chromeMediaSource: 'screen'
									}
								},
								audio: isAudioSendEnabled(media) && !media.keepAudio
							};
							getScreenMedia(constraints, callbackUserMedia);
						} else {
							// Chrome 34+ requires an extension
							Janus.extension.getScreen(function (error, sourceId) {
								if (error) {
									pluginHandle.consentDialog(false);
									return callbacks.error(error);
								}
								constraints = {
									audio: false,
									video: {
										mandatory: {
											chromeMediaSource: 'desktop',
											maxWidth: window.screen.width,
											maxHeight: window.screen.height,
											minFrameRate: media.screenshareFrameRate,
											maxFrameRate: media.screenshareFrameRate,
										},
										optional: [
											{googLeakyBucket: true},
											{googTemporalLayeredScreencast: true}
										]
									}
								};
								constraints.video.mandatory.chromeMediaSourceId = sourceId;
								getScreenMedia(constraints, callbackUserMedia,
									isAudioSendEnabled(media) && !media.keepAudio);
							});
						}
					} else if (window.navigator.userAgent.match('Firefox')) {
						var ffver = parseInt(window.navigator.userAgent.match(/Firefox\/(.*)/)[1], 10);
						if(ffver >= 33) {
							// Firefox 33+ has experimental support for screen sharing
							constraints = {
								video: {
									mozMediaSource: media.video,
									mediaSource: media.video
								},
								audio: isAudioSendEnabled(media) && !media.keepAudio
							};
							getScreenMedia(constraints, function (err, stream) {
								callbackUserMedia(err, stream);
								// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1045810
								if (!err) {
									var lastTime = stream.currentTime;
									var polly = window.setInterval(function () {
										if(!stream)
											window.clearInterval(polly);
										if(stream.currentTime == lastTime) {
											window.clearInterval(polly);
											if(stream.onended) {
												stream.onended();
											}
										}
										lastTime = stream.currentTime;
									}, 500);
								}
							});
						} else {
							var error = new Error('NavigatorUserMediaError');
							error.name = 'Your version of Firefox does not support screen sharing, please install Firefox 33 (or more recent versions)';
							pluginHandle.consentDialog(false);
							callbacks.error(error);
							return;
						}
					}
					return;
				}
			}
			// If we got here, we're not screensharing
			if(media === null || media === undefined || media.video !== 'screen') {
				// Check whether all media sources are actually available or not
				navigator.mediaDevices.enumerateDevices().then(function(devices) {
					var audioExist = devices.some(function(device) {
						return device.kind === 'audioinput';
					}),
					videoExist = isScreenSendEnabled(media) || devices.some(function(device) {
						return device.kind === 'videoinput';
					});

					// Check whether a missing device is really a problem
					var audioSend = isAudioSendEnabled(media);
					var videoSend = isVideoSendEnabled(media);
					var needAudioDevice = isAudioSendRequired(media);
					var needVideoDevice = isVideoSendRequired(media);
					if(audioSend || videoSend || needAudioDevice || needVideoDevice) {
						// We need to send either audio or video
						var haveAudioDevice = audioSend ? audioExist : false;
						var haveVideoDevice = videoSend ? videoExist : false;
						if(!haveAudioDevice && !haveVideoDevice) {
							// FIXME Should we really give up, or just assume recvonly for both?
							pluginHandle.consentDialog(false);
							callbacks.error('No capture device found');
							return false;
						} else if(!haveAudioDevice && needAudioDevice) {
							pluginHandle.consentDialog(false);
							callbacks.error('Audio capture is required, but no capture device found');
							return false;
						} else if(!haveVideoDevice && needVideoDevice) {
							pluginHandle.consentDialog(false);
							callbacks.error('Video capture is required, but no capture device found');
							return false;
						}
					}

					var gumConstraints = {
						audio: (audioExist && !media.keepAudio) ? audioSupport : false,
						video: (videoExist && !media.keepVideo) ? videoSupport : false
					};
					Janus.debug("getUserMedia constraints", gumConstraints);
					navigator.mediaDevices.getUserMedia(gumConstraints)
						.then(function(stream) {
							pluginHandle.consentDialog(false);
							streamsDone(handleId, jsep, media, callbacks, stream);
						}).catch(function(error) {
							pluginHandle.consentDialog(false);
							callbacks.error({code: error.code, name: error.name, message: error.message});
						});
				})
				.catch(function(error) {
					pluginHandle.consentDialog(false);
					callbacks.error('enumerateDevices error', error);
				});
			}
		} else {
			// No need to do a getUserMedia, create offer/answer right away
			streamsDone(handleId, jsep, media, callbacks);
		}
	}

	function prepareWebrtcPeer(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : webrtcError;
		var jsep = callbacks.jsep;
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		if(jsep !== undefined && jsep !== null) {
			if(config.pc === null) {
				Janus.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep");
				callbacks.error("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");
				return;
			}
			config.pc.setRemoteDescription(jsep)
				.then(function() {
					Janus.log("Remote description accepted!");
					config.remoteSdp = jsep.sdp;
					// Any trickle candidate we cached?
					if(config.candidates && config.candidates.length > 0) {
						for(var i in config.candidates) {
							var candidate = config.candidates[i];
							Janus.debug("Adding remote candidate:", candidate);
							if(!candidate || candidate.completed === true) {
								// end-of-candidates
								config.pc.addIceCandidate();
							} else {
								// New candidate
								config.pc.addIceCandidate(candidate);
							}
						}
						config.candidates = [];
					}
					// Done
					callbacks.success();
				}, callbacks.error);
		} else {
			callbacks.error("Invalid JSEP");
		}
	}

	function createOffer(handleId, media, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		var simulcast = callbacks.simulcast === true ? true : false;
		if(!simulcast) {
			Janus.log("Creating offer (iceDone=" + config.iceDone + ")");
		} else {
			Janus.log("Creating offer (iceDone=" + config.iceDone + ", simulcast=" + simulcast + ")");
		}
		// https://code.google.com/p/webrtc/issues/detail?id=3508
		var mediaConstraints = {};
		if(Janus.webRTCAdapter.browserDetails.browser === "firefox" && Janus.webRTCAdapter.browserDetails.version >= 59) {
			// Firefox >= 59 uses Transceivers
			var audioTransceiver = null, videoTransceiver = null;
			var transceivers = config.pc.getTransceivers();
			if(transceivers && transceivers.length > 0) {
				for(var i in transceivers) {
					var t = transceivers[i];
					if((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
							(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
						if(!audioTransceiver)
							audioTransceiver = t;
						continue;
					}
					if((t.sender && t.sender.track && t.sender.track.kind === "video") ||
							(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
						if(!videoTransceiver)
							videoTransceiver = t;
						continue;
					}
				}
			}
			// Handle audio (and related changes, if any)
			var audioSend = isAudioSendEnabled(media);
			var audioRecv = isAudioRecvEnabled(media);
			if(!audioSend && !audioRecv) {
				// Audio disabled: have we removed it?
				if(media.removeAudio && audioTransceiver) {
					audioTransceiver.direction = "inactive";
					Janus.log("Setting audio transceiver to inactive:", audioTransceiver);
				}
			} else {
				// Take care of audio m-line
				if(audioSend && audioRecv) {
					if(audioTransceiver) {
						audioTransceiver.direction = "sendrecv";
						Janus.log("Setting audio transceiver to sendrecv:", audioTransceiver);
					}
				} else if(audioSend && !audioRecv) {
					if(audioTransceiver) {
						audioTransceiver.direction = "sendonly";
						Janus.log("Setting audio transceiver to sendonly:", audioTransceiver);
					}
				} else if(!audioSend && audioRecv) {
					if(audioTransceiver) {
						audioTransceiver.direction = "recvonly";
						Janus.log("Setting audio transceiver to recvonly:", audioTransceiver);
					} else {
						// In theory, this is the only case where we might not have a transceiver yet
						audioTransceiver = config.pc.addTransceiver("audio", { direction: "recvonly" });
						Janus.log("Adding recvonly audio transceiver:", audioTransceiver);
					}
				}
			}
			// Handle video (and related changes, if any)
			var videoSend = isVideoSendEnabled(media);
			var videoRecv = isVideoRecvEnabled(media);
			if(!videoSend && !videoRecv) {
				// Video disabled: have we removed it?
				if(media.removeVideo && videoTransceiver) {
					videoTransceiver.direction = "inactive";
					Janus.log("Setting video transceiver to inactive:", videoTransceiver);
				}
			} else {
				// Take care of video m-line
				if(videoSend && videoRecv) {
					if(videoTransceiver) {
						videoTransceiver.direction = "sendrecv";
						Janus.log("Setting video transceiver to sendrecv:", videoTransceiver);
					}
				} else if(videoSend && !videoRecv) {
					if(videoTransceiver) {
						videoTransceiver.direction = "sendonly";
						Janus.log("Setting video transceiver to sendonly:", videoTransceiver);
					}
				} else if(!videoSend && videoRecv) {
					if(videoTransceiver) {
						videoTransceiver.direction = "recvonly";
						Janus.log("Setting video transceiver to recvonly:", videoTransceiver);
					} else {
						// In theory, this is the only case where we might not have a transceiver yet
						videoTransceiver = config.pc.addTransceiver("video", { direction: "recvonly" });
						Janus.log("Adding recvonly video transceiver:", videoTransceiver);
					}
				}
			}
		} else {
			mediaConstraints["offerToReceiveAudio"] = isAudioRecvEnabled(media);
			mediaConstraints["offerToReceiveVideo"] = isVideoRecvEnabled(media);
		}
		var iceRestart = callbacks.iceRestart === true ? true : false;
		if(iceRestart) {
			mediaConstraints["iceRestart"] = true;
		}
		Janus.debug(mediaConstraints);
		// Check if this is Firefox and we've been asked to do simulcasting
		var sendVideo = isVideoSendEnabled(media);
		if(sendVideo && simulcast && Janus.webRTCAdapter.browserDetails.browser === "firefox") {
			// FIXME Based on https://gist.github.com/voluntas/088bc3cc62094730647b
			Janus.log("Enabling Simulcasting for Firefox (RID)");
			var sender = config.pc.getSenders()[1];
			Janus.log(sender);
			var parameters = sender.getParameters();
			Janus.log(parameters);
			sender.setParameters({encodings: [
				{ rid: "high", active: true, priority: "high", maxBitrate: 1000000 },
				{ rid: "medium", active: true, priority: "medium", maxBitrate: 300000 },
				{ rid: "low", active: true, priority: "low", maxBitrate: 100000 }
			]});
		}
		config.pc.createOffer(mediaConstraints)
			.then(function(offer) {
				Janus.debug(offer);
				Janus.log("Setting local description");
				if(sendVideo && simulcast) {
					// This SDP munging only works with Chrome (Safari STP may support it too)
					if(Janus.webRTCAdapter.browserDetails.browser === "chrome" ||
							Janus.webRTCAdapter.browserDetails.browser === "safari") {
						Janus.log("Enabling Simulcasting for Chrome (SDP munging)");
						offer.sdp = mungeSdpForSimulcasting(offer.sdp);
					} else if(Janus.webRTCAdapter.browserDetails.browser !== "firefox") {
						Janus.warn("simulcast=true, but this is not Chrome nor Firefox, ignoring");
					}
				}
				config.mySdp = offer.sdp;
				config.pc.setLocalDescription(offer)
					.catch(callbacks.error);
				config.mediaConstraints = mediaConstraints;
				if(!config.iceDone && !config.trickle) {
					// Don't do anything until we have all candidates
					Janus.log("Waiting for all candidates...");
					return;
				}
				Janus.log("Offer ready");
				Janus.debug(callbacks);
				// JSON.stringify doesn't work on some WebRTC objects anymore
				// See https://code.google.com/p/chromium/issues/detail?id=467366
				var jsep = {
					"type": offer.type,
					"sdp": offer.sdp
				};
				callbacks.success(jsep);
			}, callbacks.error);
	}

	function createAnswer(handleId, media, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			callbacks.error("Invalid handle");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		var simulcast = callbacks.simulcast === true ? true : false;
		if(!simulcast) {
			Janus.log("Creating answer (iceDone=" + config.iceDone + ")");
		} else {
			Janus.log("Creating answer (iceDone=" + config.iceDone + ", simulcast=" + simulcast + ")");
		}
		var mediaConstraints = null;
		if(Janus.webRTCAdapter.browserDetails.browser === "firefox" && Janus.webRTCAdapter.browserDetails.version >= 59) {
			// Firefox >= 59 uses Transceivers
			mediaConstraints = {};
			var audioTransceiver = null, videoTransceiver = null;
			var transceivers = config.pc.getTransceivers();
			if(transceivers && transceivers.length > 0) {
				for(var i in transceivers) {
					var t = transceivers[i];
					if((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
							(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
						if(!audioTransceiver)
							audioTransceiver = t;
						continue;
					}
					if((t.sender && t.sender.track && t.sender.track.kind === "video") ||
							(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
						if(!videoTransceiver)
							videoTransceiver = t;
						continue;
					}
				}
			}
			// Handle audio (and related changes, if any)
			var audioSend = isAudioSendEnabled(media);
			var audioRecv = isAudioRecvEnabled(media);
			if(!audioSend && !audioRecv) {
				// Audio disabled: have we removed it?
				if(media.removeAudio && audioTransceiver) {
					audioTransceiver.direction = "inactive";
					Janus.log("Setting audio transceiver to inactive:", audioTransceiver);
				}
			} else {
				// Take care of audio m-line
				if(audioSend && audioRecv) {
					if(audioTransceiver) {
						audioTransceiver.direction = "sendrecv";
						Janus.log("Setting audio transceiver to sendrecv:", audioTransceiver);
					}
				} else if(audioSend && !audioRecv) {
					if(audioTransceiver) {
						audioTransceiver.direction = "sendonly";
						Janus.log("Setting audio transceiver to sendonly:", audioTransceiver);
					}
				} else if(!audioSend && audioRecv) {
					if(audioTransceiver) {
						audioTransceiver.direction = "recvonly";
						Janus.log("Setting audio transceiver to recvonly:", audioTransceiver);
					} else {
						// In theory, this is the only case where we might not have a transceiver yet
						audioTransceiver = config.pc.addTransceiver("audio", { direction: "recvonly" });
						Janus.log("Adding recvonly audio transceiver:", audioTransceiver);
					}
				}
			}
			// Handle video (and related changes, if any)
			var videoSend = isVideoSendEnabled(media);
			var videoRecv = isVideoRecvEnabled(media);
			if(!videoSend && !videoRecv) {
				// Video disabled: have we removed it?
				if(media.removeVideo && videoTransceiver) {
					videoTransceiver.direction = "inactive";
					Janus.log("Setting video transceiver to inactive:", videoTransceiver);
				}
			} else {
				// Take care of video m-line
				if(videoSend && videoRecv) {
					if(videoTransceiver) {
						videoTransceiver.direction = "sendrecv";
						Janus.log("Setting video transceiver to sendrecv:", videoTransceiver);
					}
				} else if(videoSend && !videoRecv) {
					if(videoTransceiver) {
						videoTransceiver.direction = "sendonly";
						Janus.log("Setting video transceiver to sendonly:", videoTransceiver);
					}
				} else if(!videoSend && videoRecv) {
					if(videoTransceiver) {
						videoTransceiver.direction = "recvonly";
						Janus.log("Setting video transceiver to recvonly:", videoTransceiver);
					} else {
						// In theory, this is the only case where we might not have a transceiver yet
						videoTransceiver = config.pc.addTransceiver("video", { direction: "recvonly" });
						Janus.log("Adding recvonly video transceiver:", videoTransceiver);
					}
				}
			}
		} else {
			if(Janus.webRTCAdapter.browserDetails.browser == "firefox" || Janus.webRTCAdapter.browserDetails.browser == "edge") {
				mediaConstraints = {
					offerToReceiveAudio: isAudioRecvEnabled(media),
					offerToReceiveVideo: isVideoRecvEnabled(media)
				};
			} else {
				mediaConstraints = {
					mandatory: {
						OfferToReceiveAudio: isAudioRecvEnabled(media),
						OfferToReceiveVideo: isVideoRecvEnabled(media)
					}
				};
			}
		}
		Janus.debug(mediaConstraints);
		// Check if this is Firefox and we've been asked to do simulcasting
		var sendVideo = isVideoSendEnabled(media);
		if(sendVideo && simulcast && Janus.webRTCAdapter.browserDetails.browser === "firefox") {
			// FIXME Based on https://gist.github.com/voluntas/088bc3cc62094730647b
			Janus.log("Enabling Simulcasting for Firefox (RID)");
			var sender = config.pc.getSenders()[1];
			Janus.log(sender);
			var parameters = sender.getParameters();
			Janus.log(parameters);
			sender.setParameters({encodings: [
				{ rid: "high", active: true, priority: "high", maxBitrate: 1000000 },
				{ rid: "medium", active: true, priority: "medium", maxBitrate: 300000 },
				{ rid: "low", active: true, priority: "low", maxBitrate: 100000 }
			]});
		}
		config.pc.createAnswer(mediaConstraints)
			.then(function(answer) {
				Janus.debug(answer);
				Janus.log("Setting local description");
				if(sendVideo && simulcast) {
					// This SDP munging only works with Chrome
					if(Janus.webRTCAdapter.browserDetails.browser === "chrome") {
						// FIXME Apparently trying to simulcast when answering breaks video in Chrome...
						//~ Janus.log("Enabling Simulcasting for Chrome (SDP munging)");
						//~ answer.sdp = mungeSdpForSimulcasting(answer.sdp);
						Janus.warn("simulcast=true, but this is an answer, and video breaks in Chrome if we enable it");
					} else if(Janus.webRTCAdapter.browserDetails.browser !== "firefox") {
						Janus.warn("simulcast=true, but this is not Chrome nor Firefox, ignoring");
					}
				}
				config.mySdp = answer.sdp;
				config.pc.setLocalDescription(answer)
					.catch(callbacks.error);
				config.mediaConstraints = mediaConstraints;
				if(!config.iceDone && !config.trickle) {
					// Don't do anything until we have all candidates
					Janus.log("Waiting for all candidates...");
					return;
				}
				// JSON.stringify doesn't work on some WebRTC objects anymore
				// See https://code.google.com/p/chromium/issues/detail?id=467366
				var jsep = {
					"type": answer.type,
					"sdp": answer.sdp
				};
				callbacks.success(jsep);
			}, callbacks.error);
	}

	function sendSDP(handleId, callbacks) {
		callbacks = callbacks || {};
		callbacks.success = (typeof callbacks.success == "function") ? callbacks.success : Janus.noop;
		callbacks.error = (typeof callbacks.error == "function") ? callbacks.error : Janus.noop;
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle, not sending anything");
			return;
		}
		var config = pluginHandle.webrtcStuff;
		Janus.log("Sending offer/answer SDP...");
		if(config.mySdp === null || config.mySdp === undefined) {
			Janus.warn("Local SDP instance is invalid, not sending anything...");
			return;
		}
		config.mySdp = {
			"type": config.pc.localDescription.type,
			"sdp": config.pc.localDescription.sdp
		};
		if(config.trickle === false)
			config.mySdp["trickle"] = false;
		Janus.debug(callbacks);
		config.sdpSent = true;
		callbacks.success(config.mySdp);
	}

	function getVolume(handleId, remote) {
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			return 0;
		}
		var stream = remote ? "remote" : "local";
		var config = pluginHandle.webrtcStuff;
		if(!config.volume[stream])
			config.volume[stream] = { value: 0 };
		// Start getting the volume, if getStats is supported
		if(config.pc.getStats && Janus.webRTCAdapter.browserDetails.browser === "chrome") {
			if(remote && (config.remoteStream === null || config.remoteStream === undefined)) {
				Janus.warn("Remote stream unavailable");
				return 0;
			} else if(!remote && (config.myStream === null || config.myStream === undefined)) {
				Janus.warn("Local stream unavailable");
				return 0;
			}
			if(config.volume[stream].timer === null || config.volume[stream].timer === undefined) {
				Janus.log("Starting " + stream + " volume monitor");
				config.volume[stream].timer = setInterval(function() {
					config.pc.getStats(function(stats) {
						var results = stats.result();
						for(var i=0; i<results.length; i++) {
							var res = results[i];
							if(res.type == 'ssrc') {
								if(remote && res.stat('audioOutputLevel'))
									config.volume[stream].value = parseInt(res.stat('audioOutputLevel'));
								else if(!remote && res.stat('audioInputLevel'))
									config.volume[stream].value = parseInt(res.stat('audioInputLevel'));
							}
						}
					});
				}, 200);
				return 0;	// We don't have a volume to return yet
			}
			return config.volume[stream].value;
		} else {
			// audioInputLevel and audioOutputLevel seem only available in Chrome? audioLevel
			// seems to be available on Chrome and Firefox, but they don't seem to work
			Janus.warn("Getting the " + stream + " volume unsupported by browser");
			return 0;
		}
	}

	function isMuted(handleId, video) {
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			return true;
		}
		var config = pluginHandle.webrtcStuff;
		if(config.pc === null || config.pc === undefined) {
			Janus.warn("Invalid PeerConnection");
			return true;
		}
		if(config.myStream === undefined || config.myStream === null) {
			Janus.warn("Invalid local MediaStream");
			return true;
		}
		if(video) {
			// Check video track
			if(config.myStream.getVideoTracks() === null
					|| config.myStream.getVideoTracks() === undefined
					|| config.myStream.getVideoTracks().length === 0) {
				Janus.warn("No video track");
				return true;
			}
			return !config.myStream.getVideoTracks()[0].enabled;
		} else {
			// Check audio track
			if(config.myStream.getAudioTracks() === null
					|| config.myStream.getAudioTracks() === undefined
					|| config.myStream.getAudioTracks().length === 0) {
				Janus.warn("No audio track");
				return true;
			}
			return !config.myStream.getAudioTracks()[0].enabled;
		}
	}

	function mute(handleId, video, mute) {
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			return false;
		}
		var config = pluginHandle.webrtcStuff;
		if(config.pc === null || config.pc === undefined) {
			Janus.warn("Invalid PeerConnection");
			return false;
		}
		if(config.myStream === undefined || config.myStream === null) {
			Janus.warn("Invalid local MediaStream");
			return false;
		}
		if(video) {
			// Mute/unmute video track
			if(config.myStream.getVideoTracks() === null
					|| config.myStream.getVideoTracks() === undefined
					|| config.myStream.getVideoTracks().length === 0) {
				Janus.warn("No video track");
				return false;
			}
			config.myStream.getVideoTracks()[0].enabled = mute ? false : true;
			return true;
		} else {
			// Mute/unmute audio track
			if(config.myStream.getAudioTracks() === null
					|| config.myStream.getAudioTracks() === undefined
					|| config.myStream.getAudioTracks().length === 0) {
				Janus.warn("No audio track");
				return false;
			}
			config.myStream.getAudioTracks()[0].enabled = mute ? false : true;
			return true;
		}
	}

	function getBitrate(handleId) {
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined ||
				pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
			Janus.warn("Invalid handle");
			return "Invalid handle";
		}
		var config = pluginHandle.webrtcStuff;
		if(config.pc === null || config.pc === undefined)
			return "Invalid PeerConnection";
		// Start getting the bitrate, if getStats is supported
		if(config.pc.getStats) {
			if(config.bitrate.timer === null || config.bitrate.timer === undefined) {
				Janus.log("Starting bitrate timer (via getStats)");
				config.bitrate.timer = setInterval(function() {
					config.pc.getStats()
						.then(function(stats) {
							stats.forEach(function (res) {
								if(!res)
									return;
								var inStats = false;
								// Check if these are statistics on incoming media
								if((res.mediaType === "video" || res.id.toLowerCase().indexOf("video") > -1) &&
										res.type === "inbound-rtp" && res.id.indexOf("rtcp") < 0) {
									// New stats
									inStats = true;
								} else if(res.type == 'ssrc' && res.bytesReceived &&
										(res.googCodecName === "VP8" || res.googCodecName === "")) {
									// Older Chromer versions
									inStats = true;
								}
								// Parse stats now
								if(inStats) {
									config.bitrate.bsnow = res.bytesReceived;
									config.bitrate.tsnow = res.timestamp;
									if(config.bitrate.bsbefore === null || config.bitrate.tsbefore === null) {
										// Skip this round
										config.bitrate.bsbefore = config.bitrate.bsnow;
										config.bitrate.tsbefore = config.bitrate.tsnow;
									} else {
										// Calculate bitrate
										var timePassed = config.bitrate.tsnow - config.bitrate.tsbefore;
										if(Janus.webRTCAdapter.browserDetails.browser == "safari")
											timePassed = timePassed/1000;	// Apparently the timestamp is in microseconds, in Safari
										var bitRate = Math.round((config.bitrate.bsnow - config.bitrate.bsbefore) * 8 / timePassed);
										if(Janus.webRTCAdapter.browserDetails.browser === 'safari')
											bitRate = parseInt(bitRate/1000);
										config.bitrate.value = bitRate + ' kbits/sec';
										//~ Janus.log("Estimated bitrate is " + config.bitrate.value);
										config.bitrate.bsbefore = config.bitrate.bsnow;
										config.bitrate.tsbefore = config.bitrate.tsnow;
									}
								}
							});
						});
				}, 1000);
				return "0 kbits/sec";	// We don't have a bitrate value yet
			}
			return config.bitrate.value;
		} else {
			Janus.warn("Getting the video bitrate unsupported by browser");
			return "Feature unsupported by browser";
		}
	}

	function webrtcError(error) {
		Janus.error("WebRTC error:", error);
	}

	function cleanupWebrtc(handleId, hangupRequest) {
		Janus.log("Cleaning WebRTC stuff");
		var pluginHandle = pluginHandles[handleId];
		if(pluginHandle === null || pluginHandle === undefined) {
			// Nothing to clean
			return;
		}
		var config = pluginHandle.webrtcStuff;
		if(config !== null && config !== undefined) {
			if(hangupRequest === true) {
				// Send a hangup request (we don't really care about the response)
				var request = { "janus": "hangup", "transaction": Janus.randomString(12) };
				if(pluginHandle.token !== null && pluginHandle.token !== undefined)
					request["token"] = pluginHandle.token;
				if(apisecret !== null && apisecret !== undefined)
					request["apisecret"] = apisecret;
				Janus.debug("Sending hangup request (handle=" + handleId + "):");
				Janus.debug(request);
				if(websockets) {
					request["session_id"] = sessionId;
					request["handle_id"] = handleId;
					ws.send(JSON.stringify(request));
				} else {
					Janus.httpAPICall(server + "/" + sessionId + "/" + handleId, {
						verb: 'POST',
						withCredentials: withCredentials,
						body: request
					});
				}
			}
			// Cleanup stack
			config.remoteStream = null;
			if(config.volume) {
				if(config.volume["local"] && config.volume["local"].timer)
					clearInterval(config.volume["local"].timer);
				if(config.volume["remote"] && config.volume["remote"].timer)
					clearInterval(config.volume["remote"].timer);
			}
			config.volume = {};
			if(config.bitrate.timer)
				clearInterval(config.bitrate.timer);
			config.bitrate.timer = null;
			config.bitrate.bsnow = null;
			config.bitrate.bsbefore = null;
			config.bitrate.tsnow = null;
			config.bitrate.tsbefore = null;
			config.bitrate.value = null;
			try {
				// Try a MediaStreamTrack.stop() for each track
				if(!config.streamExternal && config.myStream !== null && config.myStream !== undefined) {
					Janus.log("Stopping local stream tracks");
					var tracks = config.myStream.getTracks();
					for(var i in tracks) {
						var mst = tracks[i];
						Janus.log(mst);
						if(mst !== null && mst !== undefined)
							mst.stop();
					}
				}
			} catch(e) {
				// Do nothing if this fails
			}
			config.streamExternal = false;
			config.myStream = null;
			// Close PeerConnection
			try {
				config.pc.close();
			} catch(e) {
				// Do nothing
			}
			config.pc = null;
			config.candidates = null;
			config.mySdp = null;
			config.remoteSdp = null;
			config.iceDone = false;
			config.dataChannel = null;
			config.dtmfSender = null;
		}
		pluginHandle.oncleanup();
	}

	// Helper method to munge an SDP to enable simulcasting (Chrome only)
	function mungeSdpForSimulcasting(sdp) {
		// Let's munge the SDP to add the attributes for enabling simulcasting
		// (based on https://gist.github.com/ggarber/a19b4c33510028b9c657)
		var lines = sdp.split("\r\n");
		var video = false;
		var ssrc = [ -1 ], ssrc_fid = [ -1 ];
		var cname = null, msid = null, mslabel = null, label = null;
		var insertAt = -1;
		for(var i=0; i<lines.length; i++) {
			var mline = lines[i].match(/m=(\w+) */);
			if(mline) {
				var medium = mline[1];
				if(medium === "video") {
					// New video m-line: make sure it's the first one
					if(ssrc[0] < 0) {
						video = true;
					} else {
						// We're done, let's add the new attributes here
						insertAt = i;
						break;
					}
				} else {
					// New non-video m-line: do we have what we were looking for?
					if(ssrc[0] > -1) {
						// We're done, let's add the new attributes here
						insertAt = i;
						break;
					}
				}
				continue;
			}
			if(!video)
				continue;
			var fid = lines[i].match(/a=ssrc-group:FID (\d+) (\d+)/);
			if(fid) {
				ssrc[0] = fid[1];
				ssrc_fid[0] = fid[2];
				lines.splice(i, 1); i--;
				continue;
			}
			if(ssrc[0]) {
				var match = lines[i].match('a=ssrc:' + ssrc[0] + ' cname:(.+)');
				if(match) {
					cname = match[1];
				}
				match = lines[i].match('a=ssrc:' + ssrc[0] + ' msid:(.+)');
				if(match) {
					msid = match[1];
				}
				match = lines[i].match('a=ssrc:' + ssrc[0] + ' mslabel:(.+)');
				if(match) {
					mslabel = match[1];
				}
				match = lines[i].match('a=ssrc:' + ssrc + ' label:(.+)');
				if(match) {
					label = match[1];
				}
				if(lines[i].indexOf('a=ssrc:' + ssrc_fid) === 0) {
					lines.splice(i, 1); i--;
					continue;
				}
				if(lines[i].indexOf('a=ssrc:' + ssrc[0]) === 0) {
					lines.splice(i, 1); i--;
					continue;
				}
			}
			if(lines[i].length == 0) {
				lines.splice(i, 1); i--;
				continue;
			}
		}
		if(ssrc[0] < 0) {
			// Couldn't find a FID attribute, let's just take the first video SSRC we find
			insertAt = -1;
			video = false;
			for(var i=0; i<lines.length; i++) {
				var mline = lines[i].match(/m=(\w+) */);
				if(mline) {
					var medium = mline[1];
					if(medium === "video") {
						// New video m-line: make sure it's the first one
						if(ssrc[0] < 0) {
							video = true;
						} else {
							// We're done, let's add the new attributes here
							insertAt = i;
							break;
						}
					} else {
						// New non-video m-line: do we have what we were looking for?
						if(ssrc[0] > -1) {
							// We're done, let's add the new attributes here
							insertAt = i;
							break;
						}
					}
					continue;
				}
				if(!video)
					continue;
				if(ssrc[0] < 0) {
					var value = lines[i].match(/a=ssrc:(\d+)/);
					if(value) {
						ssrc[0] = value[1];
						lines.splice(i, 1); i--;
						continue;
					}
				} else {
					var match = lines[i].match('a=ssrc:' + ssrc[0] + ' cname:(.+)');
					if(match) {
						cname = match[1];
					}
					match = lines[i].match('a=ssrc:' + ssrc[0] + ' msid:(.+)');
					if(match) {
						msid = match[1];
					}
					match = lines[i].match('a=ssrc:' + ssrc[0] + ' mslabel:(.+)');
					if(match) {
						mslabel = match[1];
					}
					match = lines[i].match('a=ssrc:' + ssrc[0] + ' label:(.+)');
					if(match) {
						label = match[1];
					}
					if(lines[i].indexOf('a=ssrc:' + ssrc_fid[0]) === 0) {
						lines.splice(i, 1); i--;
						continue;
					}
					if(lines[i].indexOf('a=ssrc:' + ssrc[0]) === 0) {
						lines.splice(i, 1); i--;
						continue;
					}
				}
				if(lines[i].length == 0) {
					lines.splice(i, 1); i--;
					continue;
				}
			}
		}
		if(ssrc[0] < 0) {
			// Still nothing, let's just return the SDP we were asked to munge
			Janus.warn("Couldn't find the video SSRC, simulcasting NOT enabled");
			return sdp;
		}
		if(insertAt < 0) {
			// Append at the end
			insertAt = lines.length;
		}
		// Generate a couple of SSRCs (for retransmissions too)
		// Note: should we check if there are conflicts, here?
		ssrc[1] = Math.floor(Math.random()*0xFFFFFFFF);
		ssrc[2] = Math.floor(Math.random()*0xFFFFFFFF);
		ssrc_fid[1] = Math.floor(Math.random()*0xFFFFFFFF);
		ssrc_fid[2] = Math.floor(Math.random()*0xFFFFFFFF);
		// Add attributes to the SDP
		for(var i=0; i<ssrc.length; i++) {
			if(cname) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' cname:' + cname);
				insertAt++;
			}
			if(msid) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' msid:' + msid);
				insertAt++;
			}
			if(mslabel) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' mslabel:' + mslabel);
				insertAt++;
			}
			if(label) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' label:' + label);
				insertAt++;
			}
			// Add the same info for the retransmission SSRC
			if(cname) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' cname:' + cname);
				insertAt++;
			}
			if(msid) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' msid:' + msid);
				insertAt++;
			}
			if(mslabel) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' mslabel:' + mslabel);
				insertAt++;
			}
			if(label) {
				lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' label:' + label);
				insertAt++;
			}
		}
		lines.splice(insertAt, 0, 'a=ssrc-group:FID ' + ssrc[2] + ' ' + ssrc_fid[2]);
		lines.splice(insertAt, 0, 'a=ssrc-group:FID ' + ssrc[1] + ' ' + ssrc_fid[1]);
		lines.splice(insertAt, 0, 'a=ssrc-group:FID ' + ssrc[0] + ' ' + ssrc_fid[0]);
		lines.splice(insertAt, 0, 'a=ssrc-group:SIM ' + ssrc[0] + ' ' + ssrc[1] + ' ' + ssrc[2]);
		sdp = lines.join("\r\n");
		if(!sdp.endsWith("\r\n"))
			sdp += "\r\n";
		return sdp;
	}

	// Helper methods to parse a media object
	function isAudioSendEnabled(media) {
		Janus.debug("isAudioSendEnabled:", media);
		if(media === undefined || media === null)
			return true;	// Default
		if(media.audio === false)
			return false;	// Generic audio has precedence
		if(media.audioSend === undefined || media.audioSend === null)
			return true;	// Default
		return (media.audioSend === true);
	}

	function isAudioSendRequired(media) {
		Janus.debug("isAudioSendRequired:", media);
		if(media === undefined || media === null)
			return false;	// Default
		if(media.audio === false || media.audioSend === false)
			return false;	// If we're not asking to capture audio, it's not required
		if(media.failIfNoAudio === undefined || media.failIfNoAudio === null)
			return false;	// Default
		return (media.failIfNoAudio === true);
	}

	function isAudioRecvEnabled(media) {
		Janus.debug("isAudioRecvEnabled:", media);
		if(media === undefined || media === null)
			return true;	// Default
		if(media.audio === false)
			return false;	// Generic audio has precedence
		if(media.audioRecv === undefined || media.audioRecv === null)
			return true;	// Default
		return (media.audioRecv === true);
	}

	function isVideoSendEnabled(media) {
		Janus.debug("isVideoSendEnabled:", media);
		if(media === undefined || media === null)
			return true;	// Default
		if(media.video === false)
			return false;	// Generic video has precedence
		if(media.videoSend === undefined || media.videoSend === null)
			return true;	// Default
		return (media.videoSend === true);
	}

	function isVideoSendRequired(media) {
		Janus.debug("isVideoSendRequired:", media);
		if(media === undefined || media === null)
			return false;	// Default
		if(media.video === false || media.videoSend === false)
			return false;	// If we're not asking to capture video, it's not required
		if(media.failIfNoVideo === undefined || media.failIfNoVideo === null)
			return false;	// Default
		return (media.failIfNoVideo === true);
	}

	function isVideoRecvEnabled(media) {
		Janus.debug("isVideoRecvEnabled:", media);
		if(media === undefined || media === null)
			return true;	// Default
		if(media.video === false)
			return false;	// Generic video has precedence
		if(media.videoRecv === undefined || media.videoRecv === null)
			return true;	// Default
		return (media.videoRecv === true);
	}

	function isScreenSendEnabled(media) {
		Janus.debug("isScreenSendEnabled:", media);
		if (media === undefined || media === null)
			return false;
		if (typeof media.video !== 'object' || typeof media.video.mandatory !== 'object')
			return false;
		var constraints = media.video.mandatory;
		if (constraints.chromeMediaSource)
			return constraints.chromeMediaSource === 'desktop' || constraints.chromeMediaSource === 'screen';
		else if (constraints.mozMediaSource)
			return constraints.mozMediaSource === 'window' || constraints.mozMediaSource === 'screen';
		else if (constraints.mediaSource)
			return constraints.mediaSource === 'window' || constraints.mediaSource === 'screen';
		return false;
	}

	function isDataEnabled(media) {
		Janus.debug("isDataEnabled:", media);
		if(Janus.webRTCAdapter.browserDetails.browser == "edge") {
			Janus.warn("Edge doesn't support data channels yet");
			return false;
		}
		if(media === undefined || media === null)
			return false;	// Default
		return (media.data === true);
	}

	function isTrickleEnabled(trickle) {
		Janus.debug("isTrickleEnabled:", trickle);
		if(trickle === undefined || trickle === null)
			return true;	// Default is true
		return (trickle === true);
	}
}

// Last time updated: 2018-09-04 10:26:18 AM UTC

// _______________
// getStats v1.0.9

// Open-Sourced: https://github.com/muaz-khan/getStats

// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------

window.getStats = function(pc, callback, interval) {

    // var mediaStreamTrack = pc.getLocalStreams()[0].getAudioTracks()[0];

    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    if (typeof MediaStreamTrack === 'undefined') {
        MediaStreamTrack = {}; // todo?
    }

    var systemNetworkType = ((navigator.connection || {}).type || 'unknown').toString().toLowerCase();

    var getStatsResult = {
        encryption: 'sha-256',
        audio: {
            send: {
                tracks: [],
                codecs: [],
                availableBandwidth: 0,
                streams: 0
            },
            recv: {
                tracks: [],
                codecs: [],
                availableBandwidth: 0,
                streams: 0
            },
            bytesSent: 0,
            bytesReceived: 0
        },
        video: {
            send: {
                tracks: [],
                codecs: [],
                availableBandwidth: 0,
                streams: 0
            },
            recv: {
                tracks: [],
                codecs: [],
                availableBandwidth: 0,
                streams: 0
            },
            bytesSent: 0,
            bytesReceived: 0
        },
        bandwidth: {
            systemBandwidth: 0,
            sentPerSecond: 0,
            encodedPerSecond: 0,
            helper: {
                audioBytesSent: 0,
                videoBytesSent: 0
            },
            speed: 0
        },
        results: {},
        connectionType: {
            systemNetworkType: systemNetworkType,
            systemIpAddress: '192.168.1.2',
            local: {
                candidateType: [],
                transport: [],
                ipAddress: [],
                networkType: []
            },
            remote: {
                candidateType: [],
                transport: [],
                ipAddress: [],
                networkType: []
            }
        },
        resolutions: {
            send: {
                width: 0,
                height: 0
            },
            recv: {
                width: 0,
                height: 0
            }
        },
        internal: {
            audio: {
                send: {},
                recv: {}
            },
            video: {
                send: {},
                recv: {}
            },
            candidates: {}
        },
        nomore: function() {
            nomore = true;
        }
    };

    var getStatsParser = {
        checkIfOfferer: function(result) {
            if (result.type === 'googLibjingleSession') {
                getStatsResult.isOfferer = result.googInitiator;
            }
        }
    };

    var peer = this;

    if (pc instanceof RTCPeerConnection) {
        peer = pc;

        /*if (!!navigator.mozGetUserMedia) {
            mediaStreamTrack = arguments[1];
            callback = arguments[2];
            interval = arguments[3];
        }

        if (!(mediaStreamTrack instanceof MediaStreamTrack) && !!navigator.mozGetUserMedia) {
            throw '2nd argument is not instance of MediaStreamTrack.';
        }*/
    }/* else if (!(mediaStreamTrack instanceof MediaStreamTrack) && !!navigator.mozGetUserMedia) {
        throw '1st argument is not instance of MediaStreamTrack.';
    }*/

    var nomore = false;

    function getStatsLooper() {
        getStatsWrapper(function(results) {
            if (!results || typeof results.forEach !== 'function') {
                !nomore && typeof interval !== undefined && interval && setTimeout(getStatsLooper, interval || 1000);
                return;
            }
            results.forEach(function(result) {
                Object.keys(getStatsParser).forEach(function(key) {
                    if (typeof getStatsParser[key] === 'function') {
                        getStatsParser[key](result);
                    }
                });

                if (result.type !== 'local-candidate' && result.type !== 'remote-candidate' && result.type !== 'candidate-pair') {
                    // console.error('result', result);
                }
            });

            try {
                // failed|closed
                if (peer.iceConnectionState.search(/failed/gi) !== -1) {
                    nomore = true;
                }
            } catch (e) {
                nomore = true;
            }

            if (nomore === true) {
                if (getStatsResult.datachannel) {
                    getStatsResult.datachannel.state = 'close';
                }
                getStatsResult.ended = true;
            }

            // allow users to access native results
            getStatsResult.results = results;

            if (getStatsResult.audio && getStatsResult.video) {
                getStatsResult.bandwidth.speed = (getStatsResult.audio.bytesSent - getStatsResult.bandwidth.helper.audioBytesSent) + (getStatsResult.video.bytesSent - getStatsResult.bandwidth.helper.videoBytesSent);
                getStatsResult.bandwidth.helper.audioBytesSent = getStatsResult.audio.bytesSent;
                getStatsResult.bandwidth.helper.videoBytesSent = getStatsResult.video.bytesSent;
            }

            callback(getStatsResult);

            // second argument checks to see, if target-user is still connected.
            if (!nomore) {
                typeof interval !== undefined && interval && setTimeout(getStatsLooper, interval || 1000);
            }
        });
    }

    // a wrapper around getStats which hides the differences (where possible)
    // following code-snippet is taken from somewhere on the github
    function getStatsWrapper(cb) {
        // if !peer or peer.signalingState == 'closed' then return;

        if (typeof window.InstallTrigger !== 'undefined') {
            peer.getStats(null).then(function(res) {
                var items = [];
                res.forEach(function(r) {
                    items.push(r);
                });
                cb(items);
            }).catch(cb);
        } else {
            peer.getStats(function(res) {
                var items = [];
                res.result().forEach(function(res) {
                    var item = {};
                    res.names().forEach(function(name) {
                        item[name] = res.stat(name);
                    });
                    item.id = res.id;
                    item.type = res.type;
                    item.timestamp = res.timestamp;
                    items.push(item);
                });
                cb(items);
            }).catch(function(error){
                console.error(error);
            });
        }
        // peer.getStats(null).then(function(x){console.log(x)});
        // 以下注释掉的是 WebRTC 的最新标准，但是Chrome无法获取分辨率和编码
        /*peer.getStats(null).then(function(res) {
            var items = [];
            res.forEach(function(r) {
                items.push(r);
            });
            cb(items);
        }).catch(cb);*/
    }

    getStatsParser.datachannel = function(result) {
        if (result.type !== 'datachannel') return;

        getStatsResult.datachannel = {
            state: result.state // open or connecting
        };
    };

    getStatsParser.googCertificate = function(result) {
        if (result.type == 'googCertificate') {
            getStatsResult.encryption = result.googFingerprintAlgorithm;
        }
    };

    getStatsParser.checkAudioTracks = function(result) {
        if (/*!result.googCodecName || */result.mediaType !== 'audio') return;

        // if (AUDIO_codecs.indexOf(result.googCodecName.toLowerCase()) === -1) return;

        var sendrecvType = result.id.split('_').pop();

        if (!!getStatsResult.audio[sendrecvType] && getStatsResult.audio[sendrecvType].codecs.indexOf(result.googCodecName) === -1) {
            getStatsResult.audio[sendrecvType].codecs.push(result.googCodecName);
        }

        if (result.bytesSent) {
            sendrecvType = 'send';
            var bytes = 0;
            if (!!result.bytesSent) {
                if (!getStatsResult.internal.audio[sendrecvType].prevBytesSent) {
                    getStatsResult.internal.audio[sendrecvType].prevBytesSent = result.bytesSent;
                }

                bytes = result.bytesSent - getStatsResult.internal.audio[sendrecvType].prevBytesSent;
                getStatsResult.internal.audio[sendrecvType].prevBytesSent = result.bytesSent;
            }

            getStatsResult.audio[sendrecvType].availableBandwidth = bytes;
        }

        if (result.bytesReceived) {
            sendrecvType = 'recv';
            var bytes = 0;
            if (!!result.bytesReceived) {
                if (!getStatsResult.internal.audio[sendrecvType].prevBytesReceived) {
                    getStatsResult.internal.audio[sendrecvType].prevBytesReceived = result.bytesReceived;
                }

                bytes = result.bytesReceived - getStatsResult.internal.audio[sendrecvType].prevBytesReceived;
                getStatsResult.internal.audio[sendrecvType].prevBytesReceived = result.bytesReceived;
            }

            getStatsResult.audio[sendrecvType].availableBandwidth = bytes;
        }

        if (getStatsResult.audio[sendrecvType].tracks.indexOf(result.googTrackId) === -1) {
            getStatsResult.audio[sendrecvType].tracks.push(result.googTrackId);
        }
    };

    getStatsParser.checkVideoTracks = function(result) {
        if (/*!result.googCodecName || */result.mediaType !== 'video') return;

        // if (VIDEO_codecs.indexOf(result.googCodecName.toLowerCase()) === -1) return;

        // googCurrentDelayMs, googRenderDelayMs, googTargetDelayMs
        // transportId === 'Channel-audio-1'
        var sendrecvType = result.id.split('_').pop();

        if (!!getStatsResult.video[sendrecvType] && getStatsResult.video[sendrecvType].codecs.indexOf(result.googCodecName) === -1) {
            getStatsResult.video[sendrecvType].codecs.push(result.googCodecName);
        }

        var bytes = 0;
        if (!!result.bytesSent) {
            sendrecvType = 'send';
            // 若刷新呀SDP重新交换，需要重新计算
            if (!getStatsResult.internal.video[sendrecvType].prevBytesSent || getStatsResult.internal.video[sendrecvType].prevBytesSent > result.bytesSent) {
                getStatsResult.internal.video[sendrecvType].prevBytesSent = result.bytesSent;
            }

            bytes = result.bytesSent - getStatsResult.internal.video[sendrecvType].prevBytesSent;
            getStatsResult.internal.video[sendrecvType].prevBytesSent = result.bytesSent;
        }

        if (!!result.bytesReceived) {
            sendrecvType = 'recv';
            if (!getStatsResult.internal.video[sendrecvType].prevBytesReceived || getStatsResult.internal.video[sendrecvType].prevBytesReceived > result.bytesReceived) {
                getStatsResult.internal.video[sendrecvType].prevBytesReceived = result.bytesReceived;
            }

            bytes = result.bytesReceived - getStatsResult.internal.video[sendrecvType].prevBytesReceived;
            getStatsResult.internal.video[sendrecvType].prevBytesReceived = result.bytesReceived;
        }

        getStatsResult.video[sendrecvType].availableBandwidth = bytes;

        if (!!result.packetsLost) {
            var lostPackets, transPackets;
            if (!!result.packetsSent) {
                sendrecvType = 'send';

                if (!getStatsResult.internal.video[sendrecvType].prevTransPacket) {
                    getStatsResult.internal.video[sendrecvType].prevTransPacket = result.packetsSent;
                }
                transPackets = result.packetsSent - getStatsResult.internal.video[sendrecvType].prevTransPacket;
                getStatsResult.internal.video[sendrecvType].prevTransPacket = result.packetsSent;
            }
            if (!!result.packetsReceived) {
                sendrecvType = 'recv';

                if (!getStatsResult.internal.video[sendrecvType].prevTransPacket) {
                    getStatsResult.internal.video[sendrecvType].prevTransPacket = result.packetsReceived;
                }
                transPackets = result.packetsReceived - getStatsResult.internal.video[sendrecvType].prevTransPacket;
                getStatsResult.internal.video[sendrecvType].prevTransPacket = result.packetsReceived;
            }

            if (!getStatsResult.internal.video[sendrecvType].prevLostPacket) {
                getStatsResult.internal.video[sendrecvType].prevLostPacket = result.packetsLost;
            }

            lostPackets = result.packetsLost - getStatsResult.internal.video[sendrecvType].prevLostPacket;
            getStatsResult.internal.video[sendrecvType].prevLostPacket = result.packetsLost;

            getStatsResult.video[sendrecvType].packetsLost = lostPackets;
            getStatsResult.video[sendrecvType].packetsTransferred = transPackets;
            getStatsResult.video[sendrecvType].packetsLostRate = transPackets !== 0 ? (Math.round((lostPackets / (transPackets + lostPackets)) * 10000)) * 0.01 : 100.0;

        }


        if (result.googFrameHeightReceived && result.googFrameWidthReceived) {
            getStatsResult.resolutions[sendrecvType].width = result.googFrameWidthReceived;
            getStatsResult.resolutions[sendrecvType].height = result.googFrameHeightReceived;
        }

        if (result.googFrameHeightSent && result.googFrameWidthSent) {
            getStatsResult.resolutions[sendrecvType].width = result.googFrameWidthSent;
            getStatsResult.resolutions[sendrecvType].height = result.googFrameHeightSent;
        }

        if (getStatsResult.video[sendrecvType].tracks.indexOf(result.googTrackId) === -1) {
            getStatsResult.video[sendrecvType].tracks.push(result.googTrackId);
        }
    };

    getStatsParser.bweforvideo = function(result) {
        if (result.type !== 'VideoBwe') return;

        getStatsResult.bandwidth.availableSendBandwidth = result.googAvailableSendBandwidth;

        getStatsResult.bandwidth.googActualEncBitrate = result.googActualEncBitrate;
        getStatsResult.bandwidth.googAvailableSendBandwidth = result.googAvailableSendBandwidth;
        getStatsResult.bandwidth.googAvailableReceiveBandwidth = result.googAvailableReceiveBandwidth;
        getStatsResult.bandwidth.googRetransmitBitrate = result.googRetransmitBitrate;
        getStatsResult.bandwidth.googTargetEncBitrate = result.googTargetEncBitrate;
        getStatsResult.bandwidth.googBucketDelay = result.googBucketDelay;
        getStatsResult.bandwidth.googTransmitBitrate = result.googTransmitBitrate;
    };

    getStatsParser.candidatePair = function(result) {
        if (result.type !== 'googCandidatePair' && result.type !== 'candidate-pair') return;

        // result.googActiveConnection means either STUN or TURN is used.

        if (result.googActiveConnection == 'true') {
            // id === 'Conn-audio-1-0'
            // localCandidateId, remoteCandidateId

            // bytesSent, bytesReceived

            Object.keys(getStatsResult.internal.candidates).forEach(function(cid) {
                var candidate = getStatsResult.internal.candidates[cid];
                if (candidate.ipAddress.indexOf(result.googLocalAddress) !== -1) {
                    getStatsResult.connectionType.local.candidateType = candidate.candidateType;
                    getStatsResult.connectionType.local.ipAddress = candidate.ipAddress;
                    getStatsResult.connectionType.local.networkType = candidate.networkType;
                    getStatsResult.connectionType.local.transport = candidate.transport;
                }
                if (candidate.ipAddress.indexOf(result.googRemoteAddress) !== -1) {
                    getStatsResult.connectionType.remote.candidateType = candidate.candidateType;
                    getStatsResult.connectionType.remote.ipAddress = candidate.ipAddress;
                    getStatsResult.connectionType.remote.networkType = candidate.networkType;
                    getStatsResult.connectionType.remote.transport = candidate.transport;
                }
            });

            getStatsResult.connectionType.transport = result.googTransportType;

            var localCandidate = getStatsResult.internal.candidates[result.localCandidateId];
            if (localCandidate) {
                if (localCandidate.ipAddress) {
                    getStatsResult.connectionType.systemIpAddress = localCandidate.ipAddress;
                }
            }

            var remoteCandidate = getStatsResult.internal.candidates[result.remoteCandidateId];
            if (remoteCandidate) {
                if (remoteCandidate.ipAddress) {
                    getStatsResult.connectionType.systemIpAddress = remoteCandidate.ipAddress;
                }
            }
        }

        if (result.type === 'candidate-pair') {
            if (result.selected === true && result.nominated === true && result.state === 'succeeded') {
                // remoteCandidateId, localCandidateId, componentId
                var localCandidate = getStatsResult.internal.candidates[result.remoteCandidateId];
                var remoteCandidate = getStatsResult.internal.candidates[result.remoteCandidateId];

                // Firefox used above two pairs for connection
            }
        }
    };

    var LOCAL_candidateType = {};
    var LOCAL_transport = {};
    var LOCAL_ipAddress = {};
    var LOCAL_networkType = {};

    getStatsParser.localcandidate = function(result) {
        if (result.type !== 'localcandidate' && result.type !== 'local-candidate') return;
        if (!result.id) return;

        if (!LOCAL_candidateType[result.id]) {
            LOCAL_candidateType[result.id] = [];
        }

        if (!LOCAL_transport[result.id]) {
            LOCAL_transport[result.id] = [];
        }

        if (!LOCAL_ipAddress[result.id]) {
            LOCAL_ipAddress[result.id] = [];
        }

        if (!LOCAL_networkType[result.id]) {
            LOCAL_networkType[result.id] = [];
        }

        if (result.candidateType && LOCAL_candidateType[result.id].indexOf(result.candidateType) === -1) {
            LOCAL_candidateType[result.id].push(result.candidateType);
        }

        if (result.transport && LOCAL_transport[result.id].indexOf(result.transport) === -1) {
            LOCAL_transport[result.id].push(result.transport);
        }

        if (result.ipAddress && LOCAL_ipAddress[result.id].indexOf(result.ipAddress + ':' + result.portNumber) === -1) {
            LOCAL_ipAddress[result.id].push(result.ipAddress + ':' + result.portNumber);
        }

        if (result.networkType && LOCAL_networkType[result.id].indexOf(result.networkType) === -1) {
            LOCAL_networkType[result.id].push(result.networkType);
        }

        getStatsResult.internal.candidates[result.id] = {
            candidateType: LOCAL_candidateType[result.id],
            ipAddress: LOCAL_ipAddress[result.id],
            portNumber: result.portNumber,
            networkType: LOCAL_networkType[result.id],
            priority: result.priority,
            transport: LOCAL_transport[result.id],
            timestamp: result.timestamp,
            id: result.id,
            type: result.type
        };

        getStatsResult.connectionType.local.candidateType = LOCAL_candidateType[result.id];
        getStatsResult.connectionType.local.ipAddress = LOCAL_ipAddress[result.id];
        getStatsResult.connectionType.local.networkType = LOCAL_networkType[result.id];
        getStatsResult.connectionType.local.transport = LOCAL_transport[result.id];
    };

    var REMOTE_candidateType = {};
    var REMOTE_transport = {};
    var REMOTE_ipAddress = {};
    var REMOTE_networkType = {};

    getStatsParser.remotecandidate = function(result) {
        if (result.type !== 'remotecandidate' && result.type !== 'remote-candidate') return;
        if (!result.id) return;

        if (!REMOTE_candidateType[result.id]) {
            REMOTE_candidateType[result.id] = [];
        }

        if (!REMOTE_transport[result.id]) {
            REMOTE_transport[result.id] = [];
        }

        if (!REMOTE_ipAddress[result.id]) {
            REMOTE_ipAddress[result.id] = [];
        }

        if (!REMOTE_networkType[result.id]) {
            REMOTE_networkType[result.id] = [];
        }

        if (result.candidateType && REMOTE_candidateType[result.id].indexOf(result.candidateType) === -1) {
            REMOTE_candidateType[result.id].push(result.candidateType);
        }

        if (result.transport && REMOTE_transport[result.id].indexOf(result.transport) === -1) {
            REMOTE_transport[result.id].push(result.transport);
        }

        if (result.ipAddress && REMOTE_ipAddress[result.id].indexOf(result.ipAddress + ':' + result.portNumber) === -1) {
            REMOTE_ipAddress[result.id].push(result.ipAddress + ':' + result.portNumber);
        }

        if (result.networkType && REMOTE_networkType[result.id].indexOf(result.networkType) === -1) {
            REMOTE_networkType[result.id].push(result.networkType);
        }

        getStatsResult.internal.candidates[result.id] = {
            candidateType: REMOTE_candidateType[result.id],
            ipAddress: REMOTE_ipAddress[result.id],
            portNumber: result.portNumber,
            networkType: REMOTE_networkType[result.id],
            priority: result.priority,
            transport: REMOTE_transport[result.id],
            timestamp: result.timestamp,
            id: result.id,
            type: result.type
        };

        getStatsResult.connectionType.remote.candidateType = REMOTE_candidateType[result.id];
        getStatsResult.connectionType.remote.ipAddress = REMOTE_ipAddress[result.id];
        getStatsResult.connectionType.remote.networkType = REMOTE_networkType[result.id];
        getStatsResult.connectionType.remote.transport = REMOTE_transport[result.id];
    };

    getStatsParser.dataSentReceived = function(result) {
        if (/*!result.googCodecName || */(result.mediaType !== 'video' && result.mediaType !== 'audio')) return;

        if (!!result.bytesSent) {
            getStatsResult[result.mediaType].bytesSent = parseInt(result.bytesSent);
        }

        if (!!result.bytesReceived) {
            getStatsResult[result.mediaType].bytesReceived = parseInt(result.bytesReceived);
        }
    };

    var SSRC = {
        audio: {
            send: [],
            recv: []
        },
        video: {
            send: [],
            recv: []
        }
    };

    getStatsParser.ssrc = function(result) {
        if (!result.googCodecName || (result.mediaType !== 'video' && result.mediaType !== 'audio')) return;
        if (result.type !== 'ssrc') return;
        var sendrecvType = result.id.split('_').pop();

        if (SSRC[result.mediaType][sendrecvType].indexOf(result.ssrc) === -1) {
            SSRC[result.mediaType][sendrecvType].push(result.ssrc);
        }

        getStatsResult[result.mediaType][sendrecvType].streams = SSRC[result.mediaType][sendrecvType].length;
    };

    getStatsLooper();

};

/**
 * @fileOverview 封装 getStats.js，定时获取 WebRTC 的实时状态（上传下载速度、分辨率、带宽等）
 * @author benz@youme.im
 * @date 2018/9/6
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var GetStats = /** @class */ (function (_super) {
    __extends(GetStats, _super);
    function GetStats(pc) {
        var _this = _super.call(this) || this;
        _this._pc = null;
        _this._rawResult = null;
        _this._sendStats = {
            speed: 0,
            packetsLost: 0,
            packetsTransferred: 0,
            packetsLostRate: 0,
            bytesTransferred: 0
            /*resolutionW: 0,
            resolutionH: 0,
            videoCodecs: '',
            audioCodecs: '',
            ipAddress: '',*/
        };
        _this._recvStats = {
            speed: 0,
            packetsLost: 0,
            packetsTransferred: 0,
            packetsLostRate: 0,
            bytesTransferred: 0
            /*resolutionW: 0,
            resolutionH: 0,
            videoCodecs: '',
            audioCodecs: '',
            ipAddress: '',*/
        };
        _this._isDestroyed = false;
        if (pc) {
            _this.setPC(pc);
        }
        return _this;
    }
    GetStats.prototype.setPC = function (pc) {
        var _this = this;
        if (this._pc !== pc) {
            window.getStats(pc, function (res) { return _this._invokeRawResult(res); }, 1000);
            this._pc = pc;
        }
        this._isDestroyed = false;
    };
    GetStats.prototype.getStats = function () {
        return {
            send: this._sendStats,
            recv: this._recvStats
        };
    };
    GetStats.prototype.destroy = function () {
        this._isDestroyed = true;
        if (this._rawResult) {
            this._rawResult.nomore();
        }
    };
    GetStats.prototype._invokeRawResult = function (r) {
        if (this._rawResult && this._rawResult !== r) {
            this._rawResult.nomore();
        }
        if (this._isDestroyed) {
            r.nomore();
            return;
        }
        this._rawResult = r;
        // send
        var ss = this._sendStats;
        ss.speed = Math.round((parseFloat(String(r.video.send.availableBandwidth)) + parseFloat(String(r.audio.send.availableBandwidth))) * 10) / 10;
        ss.packetsLost = parseInt(String(r.video.send.packetsLost)) || 0;
        ss.packetsTransferred = parseInt(String(r.video.send.packetsTransferred)) || 0;
        ss.packetsLostRate = parseInt(String(r.video.send.packetsLostRate)) || 0;
        ss.bytesTransferred = parseInt(String(r.audio.bytesSent)) + parseInt(String(r.video.bytesSent));
        /*ss.resolutionW = parseInt(String(r.resolutions.send.width));
        ss.resolutionH = parseInt(String(r.resolutions.send.height));
        ss.videoCodecs = r.video.send.codecs[0] || '';
        ss.audioCodecs = r.audio.send.codecs[0] || '';
        ss.ipAddress = r.connectionType.local.ipAddress[0] || '';*/
        // receive
        var rs = this._recvStats;
        rs.speed = Math.round((parseFloat(String(r.video.recv.availableBandwidth)) + parseFloat(String(r.audio.recv.availableBandwidth))) * 10) / 10;
        rs.packetsLost = parseInt(String(r.video.recv.packetsLost)) || 0;
        rs.packetsTransferred = parseInt(String(r.video.recv.packetsTransferred)) || 0;
        rs.packetsLostRate = parseInt(String(r.video.recv.packetsLostRate)) || 0;
        rs.bytesTransferred = parseInt(String(r.audio.bytesReceived)) + parseInt(String(r.video.bytesReceived));
        /*rs.resolutionW = parseInt(String(r.resolutions.recv.width));
        rs.resolutionH = parseInt(String(r.resolutions.recv.height));
        rs.videoCodecs = r.video.recv.codecs[0] || '';
        rs.audioCodecs = r.audio.recv.codecs[0] || '';
        rs.ipAddress = r.connectionType.local.ipAddress[0] || '';*/
        // emit event
        this.emit('stats', { send: ss, recv: rs });
    };
    return GetStats;
}(wildemitter));

/**
 * @fileOverview
 * @author benz@youme.im
 * @date 2018/8/16
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var JanusHandle = /** @class */ (function (_super) {
    __extends(JanusHandle, _super);
    function JanusHandle() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._handle = null;
        _this._getStats = new GetStats();
        _this._sendOrRecv = 'unknown';
        _this._error = null;
        return _this;
    }
    JanusHandle.prototype.init = function (janus) {
        var _this = this;
        janus.attach({
            plugin: 'janus.plugin.videoroom',
            success: function (h) {
                _this._handle = h;
                _this.emit('init');
            },
            error: function (err) {
                _this._error = err;
                _this.emit('error', err);
            },
            consentDialog: function (on) {
                // e.g., Darken the screen if on=true (getUserMedia incoming), restore it otherwise
                _this.emit('consentDialog', on);
            },
            onmessage: function (msg, jsep) {
                // We got a message/event (msg) from the plugin
                // If jsep is not null, this involves a WebRTC negotiation
                _this.emit('message', msg, jsep);
            },
            onlocalstream: function (stream) {
                // We have a local stream (getUserMedia worked!) to display
                _this.emit('localStream', stream);
                _this._sendOrRecv = 'send';
                _this._getStats.setPC(_this._handle.webrtcStuff.pc);
            },
            onremotestream: function (stream) {
                // We have a remote stream (working PeerConnection!) to display
                _this.emit('remoteStream', stream);
                _this._sendOrRecv = 'recv';
                _this._getStats.setPC(_this._handle.webrtcStuff.pc);
            },
            ondataopen: function () {
                _this.emit('dataOpen');
            },
            ondata: function (data) {
                _this.emit('dataReceive', data);
            },
            webrtcState: function (isActive) {
                _this.emit('webrtcState', isActive);
            },
            iceState: function (state) {
                _this.emit('iceState', state);
            },
            mediaState: function (data) {
                _this.emit('mediaState', data);
            },
            slowLink: function (data) {
                _this.emit('slowLink', data);
            },
            oncleanup: function () {
                // PeerConnection with the plugin closed, clean the UI
                // The plugin handle is still valid so we can create a new one
                _this.emit('cleanup');
            },
            detached: function () {
                // Connection with the plugin closed, get rid of its features
                // The plugin handle is not valid anymore
                _this.emit('detached');
            }
        });
        this._getStats.on('stats', function (res) {
            _this.emit('stats-update', _this._sendOrRecv === 'send' ? res.send : res.recv);
        });
    };
    JanusHandle.prototype.doWhenInited = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this._handle) {
                resolve();
            }
            else if (_this._error) {
                reject(_this._error);
            }
            else {
                _this.once('init', function () { return resolve(); });
                _this.once('error', function (err) { return reject(err); });
            }
        });
    };
    JanusHandle.prototype.send = function (data) {
        var _this = this;
        this.doWhenInited().then(function () { return _this._handle.send(data); });
    };
    JanusHandle.prototype.createOffer = function (stream) {
        var _this = this;
        return this.doWhenInited().then(function () {
            return new Promise(function (resolve, reject) {
                _this._handle.createOffer({
                    media: {
                        audioRecv: false,
                        videoRecv: false,
                        audioSend: true,
                        videoSend: true
                    },
                    stream: stream,
                    success: function (jsep) {
                        resolve(jsep);
                    },
                    error: function (err) {
                        var e = new Error();
                        e.name = err;
                        reject(e);
                    }
                });
            });
        });
    };
    JanusHandle.prototype.createAnswer = function (media, jsep) {
        var _this = this;
        return this.doWhenInited().then(function () {
            return new Promise(function (resolve, reject) {
                _this._handle.createAnswer({
                    media: media,
                    success: function (jsep) {
                        resolve(jsep);
                    },
                    error: function (err) {
                        reject(err);
                    },
                    jsep: jsep
                });
            });
        });
    };
    JanusHandle.prototype.handleRemoteJsep = function (jsep) {
        var _this = this;
        this.doWhenInited().then(function () { return _this._handle.handleRemoteJsep({ jsep: jsep }); });
    };
    JanusHandle.prototype.hangup = function () {
        if (this._handle) {
            this._handle.hangup();
            this._getStats.destroy();
        }
    };
    JanusHandle.prototype.isAudioMuted = function () {
        return !!this._handle && this._handle.isAudioMuted();
    };
    JanusHandle.prototype.isVideoMuted = function () {
        return !!this._handle && this._handle.isVideoMuted();
    };
    JanusHandle.prototype.muteAudio = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._handle.muteAudio(); });
    };
    JanusHandle.prototype.unmuteAudio = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._handle.unmuteAudio(); });
    };
    JanusHandle.prototype.muteVideo = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._handle.muteVideo(); });
    };
    JanusHandle.prototype.unmuteVideo = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._handle.unmuteVideo(); });
    };
    JanusHandle.prototype.getStats = function () {
        var s = this._getStats.getStats();
        return this._sendOrRecv === 'send' ? s.send : s.recv;
    };
    JanusHandle.prototype.detach = function () {
        if (this._handle) {
            this._handle.detach();
        }
        this._getStats.destroy();
    };
    return JanusHandle;
}(wildemitter));

/**
 * @fileOverview 把 Janus 封一层，适应咱们的接口
 * @author benz@youme.im
 * @date 2018/8/16
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var DISCONNECTED = 'disconnected';
var CONNECTING = 'connecting';
var CONNECTED = 'connected';
var ERROR = 'error';
var ENDED = 'ended';
var JanusManager = /** @class */ (function (_super) {
    __extends(JanusManager, _super);
    function JanusManager(_commonData) {
        var _this = _super.call(this) || this;
        _this._commonData = _commonData;
        _this._janus = null;
        _this._status = DISCONNECTED;
        _this._localJsep = null;
        _this._remoteJsep = null;
        _this._resolveLocalJsep = [];
        _this._resolveRemoteJsep = [];
        // 默认的 handle 可用于管理房间、管理本地视频
        _this._defaultJanusHandle = null;
        return _this;
    }
    JanusManager.prototype.init = function () {
        var _this = this;
        this._changeStatus(CONNECTING);
        return new Promise(function (resolve) {
            Janus.init({
                debug: _this._commonData.get('debug'),
                callback: function () {
                    resolve();
                }
            });
        }).then(function () {
            return new Promise(function (resolve, reject) {
                _this._janus = new Janus({
                    server: _this._commonData.get('dev') ? GATEWAY_URL_DEV : GATEWAY_URL,
                    success: function () {
                        resolve();
                    },
                    error: function (err) {
                        _this._janus = null;
                        _this._defaultJanusHandle = null;
                        var e = new Error();
                        e.name = err;
                        _this._changeStatus(ERROR);
                        reject(e);
                    },
                    destroyed: function () {
                        _this._janus = null;
                        // if(this._defaultJanusHandle!.webrtcStuff.audioCtx)  this._defaultJanusHandle!.webrtcStuff.audioCtx.closed
                        _this._defaultJanusHandle = null;
                        _this._changeStatus(ENDED);
                    }
                });
            });
        }).then(function () {
            return new Promise(function (resolve, reject) {
                _this._janus.attach({
                    plugin: 'janus.plugin.videoroom',
                    success: function (handle) {
                        _this._defaultJanusHandle = handle;
                        _this.emit('init');
                        _this._changeStatus(CONNECTED);
                        resolve();
                    },
                    error: function (err) {
                        if (_this._janus) {
                            _this._janus.destroy();
                        }
                        _this._defaultJanusHandle = null;
                        var e = new Error();
                        e.name = err;
                        _this._changeStatus(ERROR);
                        reject(e);
                    },
                    consentDialog: function (on) {
                        // e.g., Darken the screen if on=true (getUserMedia incoming), restore it otherwise
                        _this.emit('consentDialog', on);
                    },
                    onmessage: function (msg, jsep) {
                        // We got a message/event (msg) from the plugin
                        // If jsep is not null, this involves a WebRTC negotiation
                        _this.emit('message', msg, jsep);
                    },
                    onlocalstream: function (stream) {
                        // We have a local stream (getUserMedia worked!) to display
                        _this.emit('localStream', stream);
                    },
                    onremotestream: function (stream) {
                        // We have a remote stream (working PeerConnection!) to display
                        _this.emit('remoteStream', stream);
                    },
                    ondataopen: function () {
                        _this.emit('dataOpen');
                    },
                    ondata: function (data) {
                        _this.emit('dataReceive', data);
                    },
                    webrtcState: function (isActive) {
                        _this.emit('webrtcState', isActive);
                    },
                    iceState: function (state) {
                        _this.emit('iceState', state);
                    },
                    mediaState: function (data) {
                        _this.emit('mediaState', data);
                    },
                    slowLink: function (data) {
                        _this.emit('slowLink', data);
                    },
                    oncleanup: function () {
                        // PeerConnection with the plugin closed, clean the UI
                        // The plugin handle is still valid so we can create a new one
                        _this.emit('cleanup');
                    },
                    detached: function () {
                        // Connection with the plugin closed, get rid of its features
                        // The plugin handle is not valid anymore
                        _this.emit('detached');
                    }
                });
            });
        });
    };
    JanusManager.prototype.destroy = function () {
        if (this._defaultJanusHandle) {
            this._defaultJanusHandle.detach();
        }
        if (this._janus) {
            this._janus.destroy();
        }
        this.emit('destroy');
    };
    JanusManager.prototype.doWhenInited = function () {
        var _this = this;
        return new Promise(function (resolve) {
            if (_this._janus && _this._defaultJanusHandle) {
                resolve();
            }
            else {
                _this.once('init', function () { return resolve(); });
            }
        });
    };
    JanusManager.prototype.createSubHandle = function () {
        var _this = this;
        var h = new JanusHandle();
        this.doWhenInited().then(function () {
            h.init(_this._janus);
        });
        return h;
    };
    JanusManager.prototype.getServer = function () {
        return this._janus ? this._janus.getServer() : '';
    };
    JanusManager.prototype.isConnected = function () {
        return !!this._janus && this._janus.isConnected();
    };
    JanusManager.prototype.getSessionId = function () {
        return this._janus ? this._janus.getSessionId() : '';
    };
    JanusManager.prototype.isAudioMuted = function () {
        return !!this._defaultJanusHandle && this._defaultJanusHandle.isAudioMuted();
    };
    JanusManager.prototype.isVideoMuted = function () {
        return !!this._defaultJanusHandle && this._defaultJanusHandle.isVideoMuted();
    };
    JanusManager.prototype.muteAudio = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._defaultJanusHandle.muteAudio(); });
    };
    JanusManager.prototype.unmuteAudio = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._defaultJanusHandle.unmuteAudio(); });
    };
    JanusManager.prototype.muteVideo = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._defaultJanusHandle.muteVideo(); });
    };
    JanusManager.prototype.unmuteVideo = function () {
        var _this = this;
        this.doWhenInited().then(function () { return _this._defaultJanusHandle.unmuteVideo(); });
    };
    JanusManager.prototype.send = function (data) {
        var _this = this;
        this.doWhenInited().then(function () { return _this._defaultJanusHandle.send(data); });
    };
    JanusManager.prototype.modifyRecordGain = function (gain) {
        if (this._defaultJanusHandle.webrtcStuff) {
            this._defaultJanusHandle.webrtcStuff.gainValue = gain;
            if (this._defaultJanusHandle.webrtcStuff.gainNode) {
                this._defaultJanusHandle.webrtcStuff.gainNode.gain.value = gain;
            }
            else {
                console.warn("webrtcStuff gainNode:" + this._defaultJanusHandle.webrtcStuff.gainNode);
            }
        }
        else {
            console.warn("webrtcStuff:" + this._defaultJanusHandle.webrtcStuff);
        }
    };
    JanusManager.prototype.createOffer = function (mediaConfig) {
        var _this = this;
        if (mediaConfig === void 0) { mediaConfig = {}; }
        var offerOptions = { media: {} };
        if (mediaConfig.stream) {
            offerOptions.stream = mediaConfig.stream;
        }
        else {
            offerOptions.media = Object.assign({}, mediaConfig, {
                audioRecv: false,
                videoRecv: false,
                audioSend: true,
                videoSend: this._commonData.get('video') || !!mediaConfig.video
            });
        }
        return this.doWhenInited().then(function () {
            return new Promise(function (resolve, reject) {
                _this._defaultJanusHandle.createOffer(Object.assign({}, {
                    success: function (jsep) {
                        _this._localJsep = jsep;
                        _this._resolveLocalJsep.forEach(function (f) {
                            f(jsep);
                        });
                        resolve(jsep);
                    },
                    error: function (err) {
                        if (typeof err === 'string') {
                            var e = new Error(err);
                            e.name = 'OfferError';
                            reject(e);
                        }
                        else {
                            reject(err);
                        }
                    }
                }, offerOptions));
            });
        });
    };
    JanusManager.prototype.handleRemoteJsep = function (data) {
        var _this = this;
        this.doWhenInited().then(function () { return _this._defaultJanusHandle.handleRemoteJsep(data); });
        this._remoteJsep = data.jsep;
        this._resolveRemoteJsep.forEach(function (f) {
            f(data.jsep);
        });
    };
    JanusManager.prototype.hangup = function () {
        if (this._defaultJanusHandle) {
            this._defaultJanusHandle.hangup();
        }
    };
    JanusManager.prototype.requestLocalJsep = function () {
        var _this = this;
        if (this._localJsep) {
            return Promise.resolve(this._localJsep);
        }
        return new Promise(function (resolve) {
            _this._resolveLocalJsep.push(resolve);
        });
    };
    JanusManager.prototype.requestRemoteJsep = function () {
        var _this = this;
        if (this._remoteJsep) {
            return Promise.resolve(this._remoteJsep);
        }
        return new Promise(function (resolve) {
            _this._resolveRemoteJsep.push(resolve);
        });
    };
    JanusManager.prototype._changeStatus = function (status) {
        if (this._status !== status) {
            this._status = status;
            this.emit('status:' + status, status);
        }
    };
    JanusManager.isWebRTCSupported = function () {
        return Janus.isWebrtcSupported();
    };
    JanusManager.listDevices = function (callback, config) {
        Janus.listDevices(callback, config);
    };
    return JanusManager;
}(wildemitter));

/**
 * @fileOverview 账号登录
 * @author benz@youme.im
 * @date 2018/8/15
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

var Account = /** @class */ (function (_super) {
    __extends(Account, _super);
    function Account(_commonData /*, private _janusManager: JanusManager*/) {
        var _this = _super.call(this) || this;
        _this._commonData = _commonData;
        _this._isLogin = false;
        /*private _logging = false;*/
        _this._appKey = '';
        _this._userId = '';
        _this._token = '';
        return _this;
    }
    Account.prototype.login = function (appKey, userId, token) {
        if (this._isLogin) {
            if (userId !== this._userId) {
                this.logout();
            }
            else {
                return Promise.resolve();
            }
        }
        this._commonData.set('appKey', appKey);
        this._commonData.set('userId', userId);
        this._commonData.set('token', token);
        this._appKey = appKey;
        this._userId = userId;
        this._token = token;
        /*this._logging = true;*/
        this.emit('logging');
        this._isLogin = true;
        this.emit('login');
        // todo: 游密特色 appKey 和登录
        return Promise.resolve();
    };
    Account.prototype.logout = function () {
        this._isLogin = false;
        this._userId = '';
        this.emit('logout');
    };
    Account.prototype.isLogin = function () {
        return this._isLogin;
    };
    Account.prototype.doIfLogged = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this._isLogin) {
                resolve();
            }
            else {
                _this.once('login', function () { return resolve(); });
            }
        });
    };
    Account.prototype.getMyUserId = function () {
        return this._userId;
    };
    Account.prototype.reconnect = function () {
        this._isLogin = false;
        /*this._logging = false;*/
        return this.login(this._appKey, this._userId, this._token);
    };
    return Account;
}(wildemitter));

/**
 * @fileOverview
 * @author benz@youme.im
 * @date 2018/8/16
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var MEDIA_STOP = 'stop';
var MEDIA_STARTING = 'starting';
var MEDIA_RECORDING = 'recording';

var LocalMedia = /** @class */ (function (_super) {
    __extends(LocalMedia, _super);
    function LocalMedia(_commonData, _janusManager, secondSrc) {
        var _this = _super.call(this) || this;
        _this._commonData = _commonData;
        _this._janusManager = _janusManager;
        _this.secondSrc = secondSrc;
        _this._status = MEDIA_STOP;
        _this._isPauseVideo = false;
        _this._isPauseAudio = false;
        _this._stream = null;
        _this._gainValume = 1.0;
        _this._resolveStreamQueue = [];
        _this._rejectStreamQueue = [];
        if (secondSrc)
            return _this;
        _this._janusManager.on('localStream', function (stream) {
            if (stream === _this._stream) {
                return;
            }
            _this._stream = stream;
            _this._resolveStreamQueue.forEach(function (f) {
                f(stream);
            });
            _this._resolveStreamQueue = [];
            _this._rejectStreamQueue = [];
            _this.emit('has-stream', _this._stream);
        });
        _this._janusManager.on('message', function (msg, jsep) {
            if (typeof jsep !== 'undefined' && jsep !== null) {
                _this._janusManager.handleRemoteJsep({ jsep: jsep });
            }
        });
        return _this;
    }
    /*public applyConstraints(constraints: MediaStreamConstraints): void {
        let currentConstraints = this._commonData.get('localMediaConstraints');
        let currentVideoConstraints = currentConstraints['video'];
        let currentAudioConstraints = currentConstraints['audio'];
        if (typeof constraints['video'] === 'boolean') {
            currentVideoConstraints = !!constraints['video'];
        } else if (typeof constraints['video'] === 'object') {
            currentVideoConstraints = Object.assign(currentVideoConstraints, constraints['video']);
        }
        if (typeof constraints['audio'] === 'boolean') {
            currentAudioConstraints = !!constraints['video'];
        } else if (typeof constraints['audio'] === 'object') {
            currentAudioConstraints = Object.assign(currentAudioConstraints, constraints['audio']);
        }
        currentConstraints = {
            video: currentVideoConstraints,
            audio: currentAudioConstraints
        };
        this._commonData.set('localMediaConstraints', currentConstraints);

        // todo: 改变音视频配置
    }*/
    LocalMedia.prototype.start = function (mediaConfig) {
        var _this = this;
        if (this._stream) {
            this._changeStatus(MEDIA_RECORDING);
            return Promise.resolve(this._stream);
        }
        this._changeStatus(MEDIA_STARTING);
        var bitrate = 800;
        if (mediaConfig && typeof mediaConfig.bitrate != 'undefined') {
            bitrate = mediaConfig.bitrate;
        }
        else {
            if (mediaConfig && mediaConfig.video) {
                if (mediaConfig.video === 'stdres') {
                    bitrate = 800;
                }
                else if (mediaConfig.video === 'lowres') {
                    bitrate = 400;
                }
                else if (mediaConfig.video === 'lowres-16:9') {
                    bitrate = 300;
                }
                else if (mediaConfig.video === 'hires' || mediaConfig.video === 'hires-16:9' || mediaConfig.video === 'hdres') {
                    bitrate = 1300;
                }
                else if (mediaConfig.video === 'fhdres') {
                    bitrate = 3200;
                }
                else if (mediaConfig.video === 'stdres-16:9') {
                    bitrate = 500;
                }
                else if (mediaConfig.video === 'screen') {
                    bitrate = 1800;
                }
                else if (mediaConfig.video === 'window') {
                    bitrate = 1300;
                }
            }
        }
        if (bitrate < 0)
            bitrate = 150;
        if (bitrate > 4000)
            bitrate = 4000;
        this._commonData.set('bitrate', bitrate * 1000);
        return this._doGetUserMedia(mediaConfig).then(function (stream) {
            _this._changeStatus(MEDIA_RECORDING);
            return stream;
        });
    };
    LocalMedia.prototype.stop = function () {
        if (this._stream) {
            if (!this.secondSrc) {
                this.emit('remove-stream', this._stream);
                this._janusManager.send({
                    'message': {
                        'request': 'unpublish',
                        'appkey': this._commonData.get('appKey')
                    }
                });
                this._stream.getTracks().forEach(function (track) {
                    track.stop();
                });
                this._janusManager.hangup();
                this._stream = null;
                this._changeStatus(MEDIA_STOP);
            }
            else {
                this._stream.getTracks().forEach(function (track) {
                    track.stop();
                });
                this._stream = null;
                this._changeStatus(MEDIA_STOP);
            }
        }
    };
    LocalMedia.prototype.pause = function () {
        this._enableStream(false);
        this._isPauseVideo = true;
        this._isPauseAudio = true;
        this._commonData.set('pauseVideo', true);
        this._commonData.set('pauseAudio', true);
        this.emit('pause-video');
        this.emit('pause-audio');
    };
    LocalMedia.prototype.pauseVideo = function () {
        this._enableVideoStream(false);
        this._isPauseVideo = true;
        this._commonData.set('pauseVideo', true);
        this.emit('pause-video');
    };
    LocalMedia.prototype.pauseAudio = function () {
        this._enableAudioStream(false);
        this._isPauseAudio = true;
        this._commonData.set('pauseAudio', true);
        this.emit('pause-audio');
    };
    LocalMedia.prototype.resume = function () {
        this._enableStream(true);
        this._isPauseVideo = false;
        this._isPauseAudio = false;
        this._commonData.set('pauseVideo', false);
        this._commonData.set('pauseAudio', false);
        this.emit('resume-video');
        this.emit('resume-audio');
    };
    LocalMedia.prototype.resumeVideo = function () {
        this._enableVideoStream(true);
        this._isPauseVideo = false;
        this._commonData.set('pauseVideo', false);
        this.emit('resume-video');
    };
    LocalMedia.prototype.resumeAudio = function () {
        this._enableAudioStream(true);
        this._isPauseAudio = false;
        this._commonData.set('pauseAudio', false);
        this.emit('resume-audio');
    };
    LocalMedia.prototype.isVideoPaused = function () {
        return this._isPauseVideo;
    };
    LocalMedia.prototype.isAudioPaused = function () {
        return this._isPauseAudio;
    };
    LocalMedia.prototype.getStatus = function () {
        return this._status;
    };
    LocalMedia.prototype.requestStream = function () {
        var _this = this;
        if (this._stream) {
            return Promise.resolve(this._stream);
        }
        return new Promise(function (resolve, reject) {
            _this._resolveStreamQueue.push(resolve);
            _this._rejectStreamQueue.push(reject);
        });
    };
    LocalMedia.prototype.getScreenSources = function (types) {
        if (LocalMedia._isElectron()) {
            return new Promise(function (resolve, reject) {
                var desktopCapturer = window.require('electron').desktopCapturer;
                desktopCapturer.getSources({
                    types: types ? types : ['screen', 'window']
                }, function (error, sources) {
                    if (error)
                        reject(error);
                    resolve(sources);
                });
            });
        }
        return Promise.resolve([]);
    };
    LocalMedia.prototype.modifyRecordGain = function (gain) {
        this._gainValume = gain;
        this._janusManager.modifyRecordGain(gain);
    };
    LocalMedia.prototype.listDevices = function (config) {
        return new Promise(function (resolve) {
            try {
                JanusManager.listDevices(function (devices) {
                    var audioInput = [];
                    var audioOutput = [];
                    var videoInput = [];
                    devices.forEach(function (device) {
                        var label = device.label;
                        if (label === null || label === undefined || label === "")
                            label = device.deviceId;
                        if (device.kind === 'audioinput') {
                            audioInput.push({ id: "" + device.deviceId, label: label });
                        }
                        else if (device.kind === 'videoinput') {
                            videoInput.push({ id: "" + device.deviceId, label: label });
                        }
                        else if (device.kind === 'audiooutput') {
                            audioOutput.push({ id: "" + device.deviceId, label: label });
                        }
                    });
                    return resolve({ audioInput: audioInput, audioOutput: audioOutput, videoInput: videoInput });
                }, config);
            }
            catch (e) {
                console.warn(e);
                return resolve({});
            }
        });
    };
    LocalMedia.prototype.listAllDevices = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var ret = {};
            _this.listDevices({ audio: true, video: false }).then(function (data) {
                ret.audioInput = data.audioInput || [];
                ret.audioOutput = data.audioOutput || [];
                _this.listDevices({ audio: false, video: true }).then(function (vdata) {
                    ret.videoInput = vdata.videoInput || [];
                    return resolve(ret);
                });
            });
        });
    };
    LocalMedia.prototype._doGetUserMedia = function (mediaConfig) {
        var _this = this;
        if (mediaConfig && mediaConfig.stream) {
            this._stream = mediaConfig.stream;
            for (var _i = 0, _a = this._resolveStreamQueue; _i < _a.length; _i++) {
                var f = _a[_i];
                f(this._stream);
            }
            this._resolveStreamQueue = [];
            this._rejectStreamQueue = [];
            this.emit('has-stream', this._stream);
            return Promise.resolve(this._stream);
        }
        if (mediaConfig && mediaConfig.video
            && LocalMedia._isIOS()
            && (mediaConfig.video === 'stdres-16:9'
                || mediaConfig.video === 'lowres-16:9'
                || mediaConfig.video === 'lowres')) {
            mediaConfig.video = 'stdres';
        }
        // Electron 屏幕录制
        if (mediaConfig && mediaConfig.video
            && (mediaConfig.video === 'screen' || mediaConfig.video === 'window')
            && LocalMedia._isElectron()) {
            return new Promise(function (resolve) {
                if (mediaConfig.electronScreenSourceId) {
                    resolve(mediaConfig.electronScreenSourceId);
                }
                else {
                    _this.getScreenSources([mediaConfig.video]).then(function (sources) {
                        resolve(sources ? sources[0].id : '');
                    });
                }
            }).then(function (sourceId) {
                return navigator.mediaDevices.getUserMedia({
                    audio: mediaConfig.audio === 'screen' ? {
                        mandatory: {
                            chromeMediaSource: 'desktop'
                        }
                    } : false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sourceId,
                            maxWidth: mediaConfig.electronScreenShareMaxWidth || 1280,
                            maxHeight: mediaConfig.electronScreenShareMaxHeight || 720,
                            maxFrameRate: mediaConfig.electronScreenShareMaxFrameRate || 6
                        }
                    }
                });
            }).then(function (stream) {
                if (!!mediaConfig.audio && mediaConfig.audio !== 'screen') {
                    return navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false
                    }).then(function (audioStream) {
                        stream.addTrack(audioStream.getAudioTracks()[0]);
                        return stream;
                    });
                }
                return stream;
            }).then(function (stream) {
                _this._stream = stream;
                _this._resolveStreamQueue.forEach(function (f) {
                    f(stream);
                });
                _this._resolveStreamQueue = [];
                _this._rejectStreamQueue = [];
                _this.emit('has-stream', _this._stream);
                mediaConfig.stream = stream;
                return _this._createOffer(mediaConfig);
            }).catch(function (err) {
                _this._rejectStreamQueue.forEach(function (f) {
                    f(err);
                });
                throw err;
            });
        }
        return this._createOffer(mediaConfig);
    };
    LocalMedia.prototype._createOffer = function (mediaConfig) {
        var _this = this;
        return this._janusManager.createOffer(mediaConfig).then(function () {
            if (_this._stream) {
                try {
                    var videotrack = _this._stream.getVideoTracks()[0];
                    // var audioTrack = this._stream.getAudioTracks();
                    videotrack.applyConstraints({ frameRate: { max: 15 } });
                    _this.modifyRecordGain(_this._gainValume);
                    //console.log(audioTrack);
                }
                catch (e) {
                    console.error(e);
                    throw {
                        name: "NotFoundError",
                        level: "Show Stopper",
                        message: "NotFoundError." + e,
                        htmlMessage: "",
                        toString: function () { return this.name + ": " + this.message; }
                    };
                }
                return _this._stream;
            }
            else {
                return _this.requestStream();
            }
        }).catch(function (err) {
            _this._rejectStreamQueue.forEach(function (f) {
                f(err);
            });
            throw err;
        });
    };
    LocalMedia.prototype._enableStream = function (isEnable) {
        if (isEnable) {
            this._janusManager.unmuteAudio();
            this._janusManager.unmuteVideo();
        }
        else {
            this._janusManager.muteAudio();
            this._janusManager.muteVideo();
        }
    };
    LocalMedia.prototype._enableVideoStream = function (isEnable) {
        if (isEnable) {
            this._janusManager.unmuteVideo();
        }
        else {
            this._janusManager.muteVideo();
        }
    };
    LocalMedia.prototype._enableAudioStream = function (isEnable) {
        if (isEnable) {
            this._janusManager.unmuteAudio();
        }
        else {
            this._janusManager.muteAudio();
        }
    };
    LocalMedia.prototype._changeStatus = function (status) {
        this._status = status;
        this.emit('status:' + status, status);
    };
    LocalMedia._isElectron = function () {
        return !!(window.process && window.process.versions && window.process.versions['electron']);
    };
    LocalMedia._isIOS = function () {
        return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    };
    return LocalMedia;
}(wildemitter));

/**
 * @fileOverview 一位用户，控制RTC连接
 * @author benz@youme.im
 * @date 2018/8/16
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var SIGNALING_NEW = 'new';

var SIGNALING_NEGOTIATING = 'negotiating';
var SIGNALING_NEGOTIATED = 'negotiated';

var User = /** @class */ (function (_super) {
    __extends(User, _super);
    function User(roomId, userId, userName, privateId, janus, _commonData) {
        var _this = _super.call(this) || this;
        _this._commonData = _commonData;
        _this._audioMuted = false;
        _this._iceState = 'new';
        _this._stream = null;
        _this._status = SIGNALING_NEW;
        _this._userId = userId;
        _this._userName = userName;
        _this._changeStatus(SIGNALING_NEGOTIATING);
        _this._janusHandle = janus.createSubHandle();
        _this._janusHandle.send({
            'message': {
                'request': 'join',
                'room': roomId,
                'ptype': 'subscriber',
                'feed': userId,
                'private_id': privateId,
                'appkey': _this._commonData.get('appKey')
            }
        });
        _this._janusHandle.on('message', function (msg, jsep) {
            if (typeof jsep !== 'undefined' && jsep !== null) {
                _this._janusHandle.createAnswer({
                    audioRecv: true,
                    videoRecv: true,
                    audioSend: false,
                    videoSend: false
                }, jsep).then(function (jsep2) {
                    _this._janusHandle.send({
                        'message': {
                            'request': 'start',
                            'room': roomId,
                            'appkey': _this._commonData.get('appKey')
                        },
                        'jsep': jsep2
                    });
                    _this._changeStatus(SIGNALING_NEGOTIATED);
                });
            }
        });
        _this._janusHandle.on('remoteStream', function (stream) {
            if (_this._audioMuted) {
                _this._janusHandle.muteAudio();
            }
            _this._stream = stream;
            _this.emit('update-stream', stream);
        });
        _this._janusHandle.on('iceState', function (state) {
            _this._iceState = state;
            _this.emit('ice-status:' + state, state);
        });
        _this._janusHandle.on('stats-update', function (r) {
            _this.emit('media-stats-update', r);
        });
        return _this;
    }
    User.prototype.getId = function () {
        return this._userId;
    };
    User.prototype.getName = function () {
        return this._userName;
    };
    User.prototype.getIceConnectionState = function () {
        return this._iceState;
    };
    User.prototype.requestStream = function () {
        var _this = this;
        if (this._stream) {
            return Promise.resolve(this._stream);
        }
        return new Promise(function (resolve, reject) {
            _this.once('update-stream', function (stream) { return resolve(stream); });
        });
    };
    User.prototype.getMute = function () {
        return this._audioMuted;
    };
    User.prototype.setMute = function (isMute) {
        this._audioMuted = isMute;
        if (this._stream) {
            var audioTracks = this._stream.getAudioTracks();
            audioTracks.forEach(function (element) {
                element.enabled = isMute ? false : true;
            });
        }
    };
    User.prototype.getMediaStats = function () {
        return this._janusHandle.getStats();
    };
    User.prototype.destroy = function () {
        this._janusHandle.detach();
        this.emit('destroy');
    };
    User.prototype._changeStatus = function (status) {
        if (this._status !== status) {
            this._status = status;
            this.emit('signaling-status:' + status, status);
        }
    };
    return User;
}(wildemitter));

/**
 * @fileOverview 一个房间
 * @author benz@youme.im
 * @date 2018/8/16
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var OUT = 'out';
var JOINING = 'joining';
var IN = 'in';
var Room = /** @class */ (function (_super) {
    __extends(Room, _super);
    function Room(_roomName, _commonData, _localMedia, _userControl, _janusManager) {
        var _this = _super.call(this) || this;
        _this._roomName = _roomName;
        _this._commonData = _commonData;
        _this._localMedia = _localMedia;
        _this._userControl = _userControl;
        _this._janusManager = _janusManager;
        _this._roomId = '';
        _this._myPrivateId = '';
        _this._status = OUT;
        _this._isPublishing = false;
        _this._members = {};
        _this._janusHandle = _this._janusManager.createSubHandle();
        _this.joinIn();
        _this._janusHandle.on('message', function (msg, jsep) {
            var isMemberChanged = false;
            var event = (msg['videoroom']);
            if (typeof jsep !== 'undefined' && jsep !== null) {
                _this._janusHandle.handleRemoteJsep(jsep);
            }
            if (event) {
                if (event === 'joined') {
                    _this._myPrivateId = (msg['private_id']);
                    _this._commonData.set('myId', (msg['id']));
                    _this._changeStatus(IN);
                    _this.emit('joined');
                    var pubList = msg['publishers'];
                    if (pubList) {
                        pubList.forEach(function (f) {
                            var userId = f['id'];
                            var userName = f['display'] || ('' + userId);
                            var user = new User(_this._roomId, userId, userName, _this._myPrivateId, _this._janusManager, _this._commonData);
                            _this._members[userId] = user;
                            _this._userControl.registerUser(user);
                            _this.emit("member-join", userId);
                        });
                    }
                    isMemberChanged = true;
                }
                /*if (event === 'destroyed') {
                    // destroyed
                }*/
                if (event === 'event') {
                    var pubList = msg['publishers'];
                    if (pubList) {
                        // const oldIdList = this.getMemberIdList();
                        pubList.forEach(function (f) {
                            var userId = f['id'];
                            if (_this._members[userId]) {
                                return;
                            }
                            var userName = f['display'] || ('' + userId);
                            var user = new User(_this._roomId, userId, userName, _this._myPrivateId, _this._janusManager, _this._commonData);
                            _this._members[userId] = user;
                            _this._userControl.registerUser(user);
                            _this.emit("member-join", userId);
                        });
                        // 房间成员列表更新
                        /*const pubIdList = pubList.map((pub) => <string> pub.id);
                        const compareMembers = Room._compareList(oldIdList, pubIdList);

                        for (let addMember of compareMembers['add']) {
                            this.emit(`member-join`, addMember);
                            isMemberChanged = true;
                        }
                        for (let minusMember of compareMembers['minus']) {
                            if (this._members[minusMember]) {
                                this.emit(`member-leave`, minusMember);
                                this._members[minusMember].destroy();
                                delete this._members[minusMember];
                                isMemberChanged = true;
                            }
                        }*/
                    }
                    /*const joining = <{id: string, display: string} | undefined> msg['joining'];
                    if (joining) {
                        if (this._members[joining.id]) {
                            this._members[joining.id].destroy();
                            this.emit('member-leave', joining.display);
                        }
                        const user = new User(this._roomId, joining.id, joining.display, this._myPrivateId, this._janusManager);
                        this._members[joining.id] = user;
                        this._userControl.registerUser(user);
                        this.emit('member-join', joining.display);
                        isMemberChanged = true;
                    }*/
                    var leaving = msg['leaving'];
                    if (leaving === 'ok') {
                        // 自己离开了房间
                        if (!_this.getMemberIdList().length) {
                            _this._janusHandle.send({
                                'message': {
                                    'request': 'destroy',
                                    'room': _this._roomId,
                                    'appkey': _this._commonData.get('appKey')
                                },
                                'success': function () {
                                    _this._janusHandle.detach();
                                    _this._janusHandle.off('message');
                                }
                            });
                        }
                        else {
                            _this._janusHandle.detach();
                            _this._janusHandle.off('message');
                        }
                        _this.clear();
                        isMemberChanged = true;
                        _this._changeStatus(OUT);
                    }
                    if (leaving && _this._members[leaving]) {
                        _this.emit('member-leave', leaving);
                        _this._members[leaving].destroy();
                        delete _this._members[leaving];
                        isMemberChanged = true;
                    }
                    var unPub = msg['unpublished'];
                    if (unPub && _this._members[unPub]) {
                        _this.emit('member-leave', unPub);
                        _this._members[unPub].destroy();
                        delete _this._members[unPub];
                        isMemberChanged = true;
                    }
                }
                if (isMemberChanged) {
                    _this.emit('update', _this.getMemberNameList());
                }
            }
        });
        _this._janusHandle.on('stats-update', function (r) {
            _this.emit('media-stats-update', r);
        });
        return _this;
    }
    Room.prototype.getName = function () {
        return this._roomName;
    };
    Room.prototype.joinIn = function () {
        var _this = this;
        // Janus 的房间号是正整数，而对客户使用房间号是字符串标识，因此
        // 只能使用 'description' 标识记录字符串房间号，并且
        // 只能通过遍历已有房间，找找看是否存在 'description'
        this._janusHandle.send({
            'message': {
                'request': 'list',
                'appkey': this._commonData.get('appKey')
            },
            'success': function (data) {
                var exists = false;
                /*
                let isUInt64Name = /[1-9][0-9]{0,19}/.test(this._roomName)
                    && parseInt(this._roomName) < 0xFFFFFFFFFFFFFFFF; // 2^64
                    */
                for (var _i = 0, _a = data['list']; _i < _a.length; _i++) {
                    var room = _a[_i];
                    if (_this._roomName === room['description']) {
                        exists = true;
                        _this._roomId = room['room'];
                    }
                }
                if (exists) {
                    _this._janusHandle.send({
                        'message': {
                            'request': 'join',
                            'room': _this._roomId,
                            'ptype': 'publisher',
                            'display': _this._commonData.get('userId'),
                            'appkey': _this._commonData.get('appKey'),
                            'apptoken': _this._commonData.get('token'),
                        },
                        'error': function (err) {
                            var e = new Error();
                            e.name = err;
                            _this.emit('join-error', err);
                        }
                    });
                }
                else {
                    var room_1 = _this._roomName; //isUInt64Name ? parseInt(this._roomName) : undefined;
                    _this._janusHandle.send({
                        'message': {
                            'request': 'create',
                            'room': room_1,
                            'description': _this._roomName,
                            'publishers': 20,
                            'is_private': false,
                            'videocodec': 'h264',
                            'fir_freq': 2,
                            'appkey': _this._commonData.get('appKey'),
                            'apptoken': _this._commonData.get('token'),
                            'display': _this._commonData.get('userId'),
                            'admin_key': 'supersecret'
                        },
                        'success': function (data) {
                            if (data['error_code']) {
                                var e = new Error();
                                e.name = data['error_code'] + '';
                                _this.emit('join-error', data['error_code']);
                            }
                            else {
                                var createdRoom = data['room'] ? data['room'] : room_1;
                                _this._roomId = createdRoom;
                                _this._janusHandle.send({
                                    'message': {
                                        'request': 'join',
                                        'room': createdRoom,
                                        'ptype': 'publisher',
                                        'display': _this._commonData.get('userId'),
                                        'appkey': _this._commonData.get('appKey'),
                                        'apptoken': _this._commonData.get('token')
                                    }
                                });
                            }
                        },
                        'error': function (err) {
                            var e = new Error();
                            e.name = err;
                            _this.emit('join-error', err);
                        }
                    });
                }
            },
            'error': function (err) {
                var e = new Error();
                e.name = err;
                _this.emit('join-error', err);
            }
        });
        this._changeStatus(JOINING);
    };
    Room.prototype.publish = function () {
        var _this = this;
        if (this._isPublishing) {
            return;
        }
        this._isPublishing = true;
        new Promise(function (resolve) {
            if (_this._status === IN) {
                resolve();
            }
            else {
                _this.once('status:' + IN, function () { return resolve(); });
            }
        }).then(function () {
            if (!_this._isPublishing) {
                return Promise.resolve(null);
            }
            return _this._localMedia.requestStream();
        }).then(function (stream) {
            if (!stream) {
                return null;
            }
            return _this._janusHandle.createOffer(stream);
        }).then(function (jsep) {
            if (!jsep) {
                return;
            }
            _this._janusHandle.send({
                'message': {
                    'request': 'configure',
                    'video': true,
                    'audio': true,
                    'bitrate': _this._commonData.get('bitrate'),
                    'appkey': _this._commonData.get('appKey')
                },
                'jsep': jsep
            });
        });
    };
    Room.prototype.unpublish = function () {
        this._isPublishing = false;
        this._janusHandle.send({
            'message': {
                'request': 'unpublish',
                'appkey': this._commonData.get('appKey')
            }
        });
        this._janusHandle.hangup();
    };
    Room.prototype.leave = function () {
        this._janusHandle.send({
            'message': {
                'request': 'leave',
                'appkey': this._commonData.get('appKey')
            }
        });
    };
    Room.prototype.clear = function () {
        var _this = this;
        this.getMemberIdList().forEach(function (id) {
            _this._members[id].destroy();
            delete _this._members[id];
        });
    };
    Room.prototype.getMembers = function () {
        return this._members;
    };
    Room.prototype.getMemberIdList = function () {
        return Object.keys(this._members);
    };
    Room.prototype.getMemberNameList = function () {
        var _this = this;
        return this.getMemberIdList().map(function (id) {
            return _this._members[id].getName();
        });
    };
    Room.prototype.getStatus = function () {
        return this._status;
    };
    Room.prototype.getMediaStats = function () {
        return this._janusHandle.getStats();
    };
    Room.prototype._changeStatus = function (status) {
        if (this._status !== status) {
            this._status = status;
            this.emit('status:' + status, status);
        }
    };
    return Room;
}(wildemitter));

/**
 * @fileOverview 房间控制
 * @author benz@youme.im
 * @date 2018/8/16
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var RoomControl = /** @class */ (function (_super) {
    __extends(RoomControl, _super);
    function RoomControl(_commonData, _localMedia, _userControl, _janusManager) {
        var _this = _super.call(this) || this;
        _this._commonData = _commonData;
        _this._localMedia = _localMedia;
        _this._userControl = _userControl;
        _this._janusManager = _janusManager;
        _this._rooms = {};
        _this._localMedia.on('has-stream', function () {
            _this.getRoomNameList().forEach(function (roomName) {
                _this._rooms[roomName].publish();
            });
        });
        _this._localMedia.on('remove-stream', function () {
            _this.getRoomNameList().forEach(function (roomName) {
                _this._rooms[roomName].unpublish();
            });
        });
        return _this;
    }
    RoomControl.prototype.joinRoom = function (roomName) {
        if (this._rooms[roomName]) {
            this.leaveRoom();
        }
        var newRoom = new Room(roomName, this._commonData, this._localMedia, this._userControl, this._janusManager);
        this._attachRoomEvents(newRoom);
        if (this._localMedia.getStatus() === MEDIA_RECORDING) {
            newRoom.publish();
        }
        this._rooms[roomName] = newRoom;
        return new Promise(function (resolve, reject) {
            if (newRoom.getStatus() === IN) {
                resolve();
            }
            else {
                newRoom.once('status:in', function () { return resolve(); });
                newRoom.once('join-error', function (err) { return reject(err); });
            }
        });
    };
    RoomControl.prototype.leaveRoom = function (roomName) {
        if (roomName) {
            if (this._rooms[roomName]) {
                this._rooms[roomName].leave();
                delete this._rooms[roomName];
            }
        }
        else {
            this.leaveAllRoom();
        }
    };
    RoomControl.prototype.leaveAllRoom = function () {
        var _this = this;
        this.getRoomNameList().forEach(function (roomName) {
            _this._rooms[roomName].leave();
        });
        this._rooms = {};
    };
    RoomControl.prototype.inRoom = function (roomName) {
        return !!this._rooms[roomName];
    };
    RoomControl.prototype.getRoomNameList = function () {
        return Object.keys(this._rooms);
    };
    RoomControl.prototype.getRoomMemberIdList = function (roomName) {
        if (this._rooms[roomName]) {
            return this._rooms[roomName].getMemberIdList();
        }
        return [];
    };
    RoomControl.prototype.getRoomMemberNameList = function (roomName) {
        if (this._rooms[roomName]) {
            return this._rooms[roomName].getMemberNameList();
        }
        return [];
    };
    RoomControl.prototype.getRoomMediaStats = function (roomName) {
        if (this._rooms[roomName]) {
            return this._rooms[roomName].getMediaStats();
        }
        return null;
    };
    RoomControl.prototype._attachRoomEvents = function (room) {
        var _this = this;
        if (!room) {
            return;
        }
        var roomName = room.getName();
        room.on('member-join', roomName, function (userId) {
            var user = _this._userControl.getUser(userId);
            if (user) {
                var name_1 = user.getName();
                _this.emit('member-join:' + roomName + ':' + name_1, roomName, name_1);
            }
        });
        room.on('member-leave', roomName, function (userId) {
            var user = _this._userControl.getUser(userId);
            if (user) {
                var name_2 = user.getName();
                _this.emit('member-leave:' + roomName + ':' + name_2, roomName, name_2);
            }
        });
        room.on('update', roomName, function (userIdList) {
            _this.emit('update:' + roomName, roomName, userIdList);
        });
        room.on('status:in', roomName, function () {
            _this.emit('join:' + roomName, roomName);
        });
        room.on('status:out', roomName, function () {
            _this.emit('leave:' + roomName, roomName);
            room.releaseGroup(roomName);
        });
        room.on('media-stats-update', roomName, function (r) {
            _this.emit('media-stats-update:' + roomName, roomName, r);
        });
    };
    return RoomControl;
}(wildemitter));

/**
 * @fileOverview
 * @author benz@youme.im
 * @date 2018/8/17
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var UserControl = /** @class */ (function (_super) {
    __extends(UserControl, _super);
    function UserControl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._users = {};
        _this._usersInName = {};
        _this._isSetAllMuted = false;
        return _this;
    }
    UserControl.prototype.registerUser = function (user) {
        var id = user.getId();
        var name = user.getName();
        this._users[id] = user;
        this._usersInName[name] = user;
        this._attachUserEvents(user);
        if (this._isSetAllMuted) {
            this.setMute(id, true);
        }
    };
    UserControl.prototype.getUser = function (userId) {
        return this._users[userId];
    };
    UserControl.prototype.getUserByName = function (userName) {
        return this._usersInName[userName];
    };
    UserControl.prototype.requestUserStream = function (userName) {
        if (this._usersInName[userName]) {
            return this._usersInName[userName].requestStream();
        }
        return Promise.reject('The user dose not exists.');
    };
    UserControl.prototype.getMute = function (userName) {
        return this._usersInName[userName] ? this._usersInName[userName].getMute() : false;
    };
    UserControl.prototype.setMute = function (userName, isMuted) {
        if (this._usersInName[userName]) {
            this._usersInName[userName].setMute(isMuted);
        }
        if (!isMuted) {
            this._isSetAllMuted = false;
        }
    };
    UserControl.prototype.setAllMute = function (isMuted) {
        var userIds = Object.keys(this._users);
        for (var _i = 0, userIds_1 = userIds; _i < userIds_1.length; _i++) {
            var id = userIds_1[_i];
            this.setMute(id, isMuted);
        }
        this._isSetAllMuted = true;
    };
    UserControl.prototype.getUserMediaStats = function (userName) {
        if (this._usersInName[userName]) {
            return this._usersInName[userName].getMediaStats();
        }
        return null;
    };
    UserControl.prototype._attachUserEvents = function (user) {
        var _this = this;
        var name = user.getName();
        user.on('update-stream', name, function (stream) {
            _this.emit('update-stream:' + name, name, 0, stream);
        });
        user.on('remove-stream', name, function () {
            _this.emit('remove-stream:' + name, name, 0);
        });
        user.on('signaling-status:*', name, function (eventName, state) {
            _this.emit('signaling-status:' + name + ':' + state, name, 0, state);
        });
        user.on('ice-status:*', name, function (eventName, state) {
            _this.emit('ice-status:' + name + ':' + state, name, 0, state);
        });
        user.on('destroy', function () {
            user.releaseGroup(name);
            delete _this._usersInName[name];
            delete _this._users[user.getId()];
        });
        user.on('media-stats-update', name, function (r) {
            _this.emit('media-stats-update:' + name, name, 0, r);
        });
    };
    return UserControl;
}(wildemitter));

/**
 * @fileOverview 主入口，封装各种方法和事件
 * @author benz@youme.im
 * @date 2018/8/15
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var YMRTC_VERSION = '1.0.2';
/**
 * @typedef {Object} InitConfig
 * @desc 初始化 YIM 对象的配置
 * @param {string} appKey - 游密分配的 appKey
 * @param {string} [userId] - 可选。用户登录 ID，若在此处直接输入用户ID和密码，则初始化后自动登录
 * @param {string} [token] - 可选。用户登录密码，若在此处直接输入用户ID和密码，则初始化后自动登录
 * @param {string} [roomId] - 可选。要加入的房间ID，若输入此值，则初始化并登录（自动或手动登录均可）之后自动加入房间
 * @param {boolean} [video=true] - 是否为视频聊天，若为 `false` 则为仅语音聊天
 * @param {boolean | string | string[]} [debug] - 可选。是否输出调试信息
 */
/**
 * @typedef {Object} MediaConfig
 * @desc 初始化 YIM 对象的配置
 * @param {string | boolean} [video] - 视频配置，可选值：false |
 *                                                  'screen' |
 *                                                  'window' |
 *                                                  'lowres' |          // 320x240
 *                                                  'lowres-16:9' |     // 320x180
 *                                                  'stdres' |          // 640x480，默认值
 *                                                  'stdres-16:9' |     // 640x360
 *                                                  'hires'  | 'hires-16:9' | 'hdres' |  // 都是 1280x720，不能支持4:3
 *                                                  'fhdres' |          // 1920x1080
 *                                                  '4kres';            // 3840x2160
 * @param {string | boolean} [audio] - 音频配置，可选值：false | 'screen' | 'mic' | true
 * @param {string} [screenSourceId] - 若为 Electron 屏幕录像，可以传入特定的 sourceId
 * @param {MediaStream} [stream] - 若自行建立 MediaStream 则可以直接用于此
 */
/**
 * @typedef {Object} MediaStats
 * @desc 初始化 YIM 对象的配置
 * @param {number} speed
 * @param {number} packetsLostRate
 * @param {number} bytesTransferred
 */
/**
 * RTC 类
 * @typicalname ymrtc
 */
var YMRTC = /** @class */ (function (_super) {
    __extends(YMRTC, _super);
    /**
     * 新建一个游密 RTC 对象。
     * @param {InitConfig} config - 配置
     */
    function YMRTC(config) {
        var _this = _super.call(this) || this;
        _this._appKey = '';
        _this._commonData = new CommonData();
        _this._janusManager = new JanusManager(_this._commonData);
        _this._localMedia = new LocalMedia(_this._commonData, _this._janusManager, false);
        // private _secondMedia: LocalMedia = new LocalMedia(this._commonData, this._janusManager,true);
        _this._account = new Account(_this._commonData /*, this._janusManager*/);
        _this._userControl = new UserControl();
        _this._roomControl = new RoomControl(_this._commonData, _this._localMedia, _this._userControl, _this._janusManager);
        _this._handleAccountEvent();
        _this._handleRoomEvent();
        _this._handleUserEvent();
        _this._handleLocalMediaEvent();
        _this._handleSignalingEvent();
        if (config) {
            _this.init(config);
        }
        return _this;
    }
    YMRTC.prototype.init = function (config) {
        console.log('ymrtc version:' + YMRTC_VERSION);
        if (config.appKey) {
            this._appKey = config.appKey;
            if (config.userId && config.token) {
                this.login(config.userId, config.token).then();
            }
            if (config.roomId) {
                this.joinRoom(config.roomId).then();
            }
        }
        if (typeof config.video !== 'undefined') {
            this._commonData.set('video', !!config.video);
        }
        /*if (config.localMediaConstraints) {
            this._localMedia.applyConstraints(config.localMediaConstraints);
        }*/
        if (config.debug) {
            this._commonData.set('debug', config.debug);
        }
        if (config.dev) {
            this._commonData.set('dev', config.dev);
        }
    };
    /***** account *****/
    /**
     * 用户登录。
     * @param {string} userId - 用户ID
     * @param {string} token - 用户密码
     * @return {Promise}
     * @fulfil {void} - 登录成功
     * @reject {string} - 登录失败，回调失败信息
     * @category 用户帐户控制
     */
    YMRTC.prototype.login = function (userId, token) {
        var _this = this;
        return this._janusManager.init().then(function () {
            return _this._account.login(_this._appKey, userId, token);
        });
    };
    /**
     * 用户退出登录，断开所有连接。
     * @category 用户帐户控制
     */
    YMRTC.prototype.logout = function () {
        this._janusManager.destroy();
        return this._account.logout();
    };
    /**
     * 获得当前用户ID。
     * @return {string} - 用户ID。若未登录，则返回空字符串 ''。
     * @category 用户帐户控制
     */
    YMRTC.prototype.getMyUserId = function () {
        return this._account.getMyUserId();
    };
    /***** room *****/
    /**
     * 加入房间，会自动等待登录成功再加入房间。
     * @param {string | number} roomId - 房间ID
     * @return {Promise}
     * @fulfil {void} - 加入房间成功
     * @reject {void} - 由于自动等待登录和本地媒体，因此暂时没有定义失败的情况
     * @category 房间控制
     */
    YMRTC.prototype.joinRoom = function (roomId) {
        var _this = this;
        return this._account.doIfLogged()
            .then(function () { return _this._roomControl.joinRoom('' + roomId); });
    };
    /**
     * 退出房间，并断开房间内成员之间的连接。强制退出，无返回值。
     * @param {string | number} [roomId] - 可选。指定要退出的房间ID，若不指定则退出所有房间
     * @category 房间控制
     */
    YMRTC.prototype.leaveRoom = function (roomId) {
        if (roomId) {
            return this._roomControl.leaveRoom('' + roomId);
        }
        else {
            return this._roomControl.leaveAllRoom();
        }
    };
    /**
     * 返回目前是否正在某个房间之内。
     * @param {string | number} roomId - 房间ID
     * @return {boolean} - 是否在房间内
     * @category 房间控制
     */
    YMRTC.prototype.inRoom = function (roomId) {
        return this._roomControl.inRoom('' + roomId);
    };
    /**
     * 返回当前已经加入的房间ID列表。
     * @return {string[]} - 房间ID数组
     * @category 房间控制
     */
    YMRTC.prototype.getRoomIdList = function () {
        return this._roomControl.getRoomNameList();
    };
    /**
     * 返回房间内所有成员的ID列表。
     * @param {string | number} roomId - 房间ID
     * @return {string[]} - 成员ID数组
     * @category 房间控制
     */
    YMRTC.prototype.getRoomMemberIdList = function (roomId) {
        return this._roomControl.getRoomMemberIdList('' + roomId);
    };
    /**
     * 返回房间上一秒的媒体上传状态
     * @param {string | number} roomId - 房间ID
     * @return {MediaStats | null} - 媒体参数（上传），若房间不存在或媒体未启动或其他原因无法获取，则返回 null
     * @category 房间控制
     */
    YMRTC.prototype.getRoomMediaStats = function (roomId) {
        return this._roomControl.getRoomMediaStats('' + roomId);
    };
    /***** user *****/
    /**
     * 异步请求一个成员的媒体流（stream）。若未与此成员建立连接，
     * 则等待连接完成，否则直接回调已存在的媒体流。
     * **注意**：中途媒体流对象可能会发生改变，请监听
     * “`user.update-stream`”事件以对界面做出相应的改变。
     * @param {string} userId - 成员ID
     * @return {Promise}
     * @fulfil {MediaStream} - 得到的媒体流对象，
     * 赋值给 `<video>` 或 `<audio>` 的 `srcObject` 属性即可播放。
     * 关于此对象的更多资料，可参阅 [mdn 文档](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
     * @reject {void} - 由于会一直等待媒体流，因此暂时未设定请求失败的情况
     * @category 成员控制
     */
    YMRTC.prototype.requestUserStream = function (userId) {
        return this._userControl.requestUserStream('' + userId);
    };
    /**
     * 获取一个成员的静音状态。
     * @param {string} userId - 成员ID
     * @return {boolean} 是否静音
     * @category 成员控制
     */
    YMRTC.prototype.getMute = function (userId) {
        return this._userControl.getMute('' + userId);
    };
    /**
     * 为一个成员的音频流设置静音。
     * @param {string} userId - 成员ID
     * @param {boolean} isMuted - 是否静音
     * @category 成员控制
     */
    YMRTC.prototype.setMute = function (userId, isMuted) {
        return this._userControl.setMute('' + userId, isMuted);
    };
    /**
     * 为所有成员的音频流设置静音。
     * @param {boolean} isMuted - 是否静音
     * @category 成员控制
     */
    YMRTC.prototype.setAllMute = function (isMuted) {
        return this._userControl.setAllMute(isMuted);
    };
    /**
     * 录音音量增益控制
     * @param gain 声音增益，范围 0 - 2.0 表示从0% 到 200% 的录音增益
     */
    YMRTC.prototype.setLocalAudioVolumeGain = function (gain) {
        return this._localMedia.modifyRecordGain(gain);
    };
    /**
     * 返回某成员上一秒的媒体接收状态
     * @param {string | number} userId - 成员ID
     * @return {MediaStats | null} - 媒体参数（接收），若成员不存在或媒体未传过来或其他原因无法获取，则返回 null
     * @category 房间控制
     */
    YMRTC.prototype.getUserMediaStats = function (userId) {
        return this._userControl.getUserMediaStats('' + userId);
    };
    /***** local media *****/
    YMRTC.prototype.startRTC = function (mediaConfig) {
        return this.startLocalMedia(mediaConfig);
    };
    /**
     * 获取所有设备列表, 必须在login之后调用
     * @param config  { audio: true, video: true } ,指定获取哪些类型的设备列表
     */
    YMRTC.prototype.getDeviceList = function (config) {
        return this._localMedia.listDevices(config);
    };
    /**
     * 获取所有设备列表, 必须在login之后调用
     * @returns 'audioInput'获取音频输入设备，'videoInput'获取视频输入设备,'audioOutput'音频输出设备
     */
    YMRTC.prototype.getAllDevices = function () {
        return this._localMedia.listAllDevices();
    };
    /**
     * 设置声音输出设备
     * @param mediaObject video或者audio的html对象
     * @param deviceID 选择的设备id
     */
    YMRTC.prototype.setOutputDevice = function (mediaObject, deviceID) {
        // @ts-ignore
        if (!mediaObject.setSinkId) {
            console.warn("SetSinkId not supported");
            return false;
        }
        // @ts-ignore
        mediaObject.setSinkId(deviceID)
            .then(function () {
            console.log('Audio output device attached:', deviceID);
        }).catch(function (error) {
            console.error(error);
        });
        return true;
    };
    // /**
    //  * 可以启动第二路视频，为了兼容老版本，接口名明暂时不做改动
    //  * @param mediaConfig 
    //  */
    // public startLocalScreenMedia(mediaConfig?: MediaConfig): Promise<MediaStream> {
    //     if(!mediaConfig || !mediaConfig.video){
    //         mediaConfig = mediaConfig || {};
    //         mediaConfig.video = 'screen';
    //     }
    //     return this._secondMedia.start(mediaConfig);
    // }
    // /**
    //  * 停止本地媒体（关掉摄像头和麦克风的电源）。
    //  * @category 本地媒体控制
    //  */
    // public stopLocalScreenMedia():void {
    //     return this._secondMedia.stop();
    // }
    //  /**
    //  * 返回录屏是否为启动状态。
    //  * @return {boolean} - true: 启动状态，false: 停止状态
    //  * @category 录屏状态
    //  */
    // public isLocalScreenStarted():boolean{
    //     return this._secondMedia.getStatus() === MEDIA_STARTING || this._secondMedia.getStatus() === MEDIA_RECORDING; 
    // }
    /**
     * 启动本地媒体。
     * @param {MediaConfig=} mediaConfig 媒体配置
     * @return {Promise}
     * @fulfil {MediaStream} - 启动成功，获得本地媒体流对象，
     * 赋值给 `<video>` 或 `<audio>` 的 `srcObject` 属性即可播放。
     * 关于此对象的更多资料，可参阅 [mdn 文档](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
     * @reject {DOMException} - 启动失败，获得原生的错误对象。
     *                          具体错误可参见 [mdn 文档](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Return_value)。
     * @category 本地媒体控制
     */
    YMRTC.prototype.startLocalMedia = function (mediaConfig) {
        return this._localMedia.start(mediaConfig);
    };
    /**
     * 暂停本地媒体（屏蔽摄像头、关闭麦克风）。
     * @category 本地媒体控制
     */
    YMRTC.prototype.pauseLocalMedia = function () {
        return this._localMedia.pause();
    };
    /**
     * 暂停本地视频（只屏蔽摄像头，麦克风不变）。
     * @category 本地媒体控制
     */
    YMRTC.prototype.pauseLocalVideo = function () {
        return this._localMedia.pauseVideo();
    };
    /**
     * 暂停本地视频（只屏蔽麦克风，摄像头不变）。
     * @category 本地媒体控制
     */
    YMRTC.prototype.pauseLocalAudio = function () {
        return this._localMedia.pauseAudio();
    };
    YMRTC.prototype.pause = function () {
        return this.pauseLocalMedia();
    };
    /**
     * 恢复本地媒体（取消屏蔽摄像头、取消关闭麦克风）。
     * @category 本地媒体控制
     */
    YMRTC.prototype.resumeLocalMedia = function () {
        return this._localMedia.resume();
    };
    /**
     * 恢复本地视频（只取消屏蔽摄像头、麦克风不变）。
     * @category 本地媒体控制
     */
    YMRTC.prototype.resumeLocalVideo = function () {
        return this._localMedia.resumeVideo();
    };
    /**
     * 恢复本地音频（只取消屏蔽麦克风、摄像头不变）。
     * @category 本地媒体控制
     */
    YMRTC.prototype.resumeLocalAudio = function () {
        return this._localMedia.resumeAudio();
    };
    YMRTC.prototype.resume = function () {
        return this.resumeLocalMedia();
    };
    /**
     * 返回摄像头是否为屏蔽状态。
     * @return {boolean} - true: 屏蔽了，false: 没屏蔽
     * @category 本地媒体控制
     */
    YMRTC.prototype.isLocalVideoPaused = function () {
        return this._localMedia.isVideoPaused();
    };
    /**
     * 返回麦克风是否为屏蔽状态。
     * @return {boolean} - true: 屏蔽了，false: 没屏蔽
     * @category 本地媒体控制
     */
    YMRTC.prototype.isLocalAudioPaused = function () {
        return this._localMedia.isAudioPaused();
    };
    /**
     * 停止本地媒体（关掉摄像头和麦克风的电源）。
     * @category 本地媒体控制
     */
    YMRTC.prototype.stopLocalMedia = function () {
        return this._localMedia.stop();
    };
    /**
     * 获取本地媒体的当前状态。
     * @return {string} - `stop`: 未启动，<br>`starting`: 正在尝试启动，
     * `recording`: 已经启动，正在录音和/或录像，`failed`: 启动失败
     * @category 本地媒体控制
     */
    YMRTC.prototype.getLocalMediaStatus = function () {
        return this._localMedia.getStatus();
    };
    /**
     * 获取屏幕共享源（仅Electron）
     * @param {string[]} type 屏幕共享源类型数组，数组元素可选值 'screen'（整屏）、'window'（窗口）
     */
    YMRTC.prototype.screenRequestSourceList = function (type) {
        return this._localMedia.getScreenSources(type);
    };
    /**
     * 异步请求本地媒体流 (stream)。若本地媒体尚未启动，
     * 则等待启动成功，否则直接回调已存在的媒体流。
     * @return {Promise}
     * @fulfil {MediaStream} - 获得本地媒体流
     * 赋值给 `<video>` 或 `<audio>` 的 `srcObject` 属性即可播放。
     * 关于此对象的更多资料，可参阅 [mdn 文档](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
     * @reject {DOMException} - 启动失败，获得原生的错误对象。
     * @category 本地媒体控制
     */
    YMRTC.prototype.requestLocalMediaStream = function () {
        return this._localMedia.requestStream();
    };
    /***** events *****/
    /**
     * 用户登录成功。
     * @event YMRTC#event:"account.logged"
     * @category 用户帐户控制
     */
    /**
     * 正在登录。
     * @event YMRTC#event:"account.logging"
     * @category 用户帐户控制
     */
    /**
     * 已登出。
     * @event YMRTC#event:"account.logout"
     * @category 用户帐户控制
     */
    YMRTC.prototype._handleAccountEvent = function () {
        var _this = this;
        this._account.on('login', function () { return _this.emit('account.logged'); });
        this._account.on('logging', function () { return _this.emit('account.logging'); });
        this._account.on('logout', function () { return _this.emit('account.logout'); });
    };
    /**
     * 房间[roomId]中的成员有更新（有人加入或者离开）。
     * @event YMRTC#event:"room.update:[roomId]"
     * @property {string} roomId - 房间ID
     * @property {string[]} members - 房间内所有成员的ID列表
     * @category 房间控制
     */
    /**
     * 一位成员加入了房间[roomId]。
     * @event YMRTC#event:"room.member-join:[roomId]"
     * @property {string} roomId - 房间ID
     * @property {string} member - 加入房间的成员ID
     * @category 房间控制
     */
    /**
     * 一位成员离开了房间[roomId]。
     * @event YMRTC#event:"room.member-leave:[roomId]"
     * @property {string} roomId - 房间ID
     * @property {string} member - 离开房间的成员ID
     * @category 房间控制
     */
    /**
     * 本帐户进入了房间[roomId]。
     * @event YMRTC#event:"room.join:[roomId]"
     * @property {string} roomId - 房间ID
     * @category 房间控制
     */
    /**
     * 本帐户离开了房间[roomId]。
     * @event YMRTC#event:"room.leave:[roomId]"
     * @property {string} roomId - 房间ID
     * @category 房间控制
     */
    /**
     * 刷新了发送（上传）给房间[roomId]的媒体的状态参数。
     * @event YMRTC#event:"room.media-stats-update:[roomId]"
     * @property {string} roomId - 房间ID
     * @property {MediaStats} stats - 媒体状态参数
     * @category 房间控制
     */
    YMRTC.prototype._handleRoomEvent = function () {
        var _this = this;
        this._roomControl.on('update:*', function (eventName, roomId, members) { return _this.emit("room.update:" + roomId, roomId, members); });
        this._roomControl.on('member-join:*', function (eventName, roomId, member) { return _this.emit("room.member-join:" + roomId, roomId, member); });
        this._roomControl.on('member-leave:*', function (eventName, roomId, member) { return _this.emit("room.member-leave:" + roomId, roomId, member); });
        this._roomControl.on('join:*', function (eventName, roomId) { return _this.emit("room.join:" + roomId, roomId); });
        this._roomControl.on('leave:*', function (eventName, roomId) { return _this.emit("room.leave:" + roomId, roomId); });
        this._roomControl.on('media-stats-update:*', function (eventName, roomId, stats) { return _this.emit("room.media-stats-update:" + roomId, roomId, stats); });
    };
    /**
     * 原生 ICE (RTC.iceConnectionState) 状态有改变，
     * 可参阅 [mdn 文档](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState)
     * @event YMRTC#event:"user.ice-status:[memberId]:[status]"
     * @property {string} memberId - 状态有改变的成员ID
     * @property {string} status - 新状态，状态的取值请参阅 [mdn 文档](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState)
     * @category 成员控制
     */
    /**
     * 与成员之间的连接协商状态有改变。
     * @event YMRTC#event:"user.signaling-status:[memberId]:[status]"
     * @property {string} memberId - 状态有改变的成员ID
     * @property {string} status - 新状态，状态的取值: <br>
     *  - `new`: 未连接；<br>
     *  - `waiting`: 等待对方连接过来；<br>
     *  - `negotiating`: 正在协商（交换视频格式信息等等）；<br>
     *  - `negotiated`: 协商完成（成功）；<br>
     *  - `failed`: 连接失败。<br>
     * @category 成员控制
     */
    /**
     * 成员的媒体流有改变，这时需要更新对应成员的 `<video>` 或 `<audio>` 的 srcObject 属性。
     * @event YMRTC#event:"user.update-stream:[memberId]"
     * @property {string} memberId - 有改变的成员ID
     * @property {MediaStream} stream - 新的媒体流，把此值赋值给 `<video>` 或 `<audio>` 的 srcObject 属性即可更新媒体流。
     * @category 成员控制
     */
    /**
     * 成员的媒体流被对方移除，这时对应成员的 `<video>` 或 `<audio>` 的视频或音频播放可能会突然定格或停止，忽略它而不做处理并无大碍，此事件用于防备不时之需。
     * @event YMRTC#event:"user.remove-stream:[memberId]"
     * @property {string} memberId - 有改变的成员ID
     * @category 成员控制
     */
    /**
     * 刷新了从成员接收（下载）的媒体的状态参数。
     * @event YMRTC#event:"user.media-stats-update:[memberId]"
     * @property {string} memberId - 成员ID
     * @property {MediaStats} stats - 媒体状态参数
     * @category 成员控制
     */
    YMRTC.prototype._handleUserEvent = function () {
        // 暂时假定 peerId=0 为普通流，peerId>0 为屏幕共享
        // todo: 整理代码，取消这个假定
        var _this = this;
        // RTC 事件
        /*
                this._userControl.on('offer:*',
                    (eventName: string, userId: string, peerId: number, desc: RTCSessionDescription) =>
                        this.emit(`user.offer${(peerId > 0) ? '-screen' : ''}:${userId}`, userId, desc));
                this._userControl.on('answer:*',
                    (eventName: string, userId: string, peerId: number, desc: RTCSessionDescription) =>
                        this.emit(`user.answer${(peerId > 0) ? '-screen' : ''}:${userId}:${peerId}`, userId, desc));
                this._userControl.on('candidate:*',
                    (eventName: string, userId: string, peerId: number, c: RTCIceCandidate) =>
                        this.emit(`user.candidate${(peerId > 0) ? '-screen' : ''}:${userId}:${peerId}`, userId, c));
                this._userControl.on('got-answer:*',
                    (eventName: string, userId: string, peerId: number) =>
                        this.emit(`user.got-answer${(peerId > 0) ? '-screen' : ''}:${userId}:${peerId}`, userId));
                this._userControl.on('got-candidate:*',
                    (eventName: string, userId: string, peerId: number) =>
                        this.emit(`user.got-candidate${(peerId > 0) ? '-screen' : ''}:${userId}:${peerId}`, userId));
                this._userControl.on('candidate-finished:*',
                    (eventName: string, userId: string, peerId: number) =>
                        this.emit(`user.candidate-finished${(peerId > 0) ? '-screen' : ''}:${userId}:${peerId}`, userId));
        */
        // 状态事件
        this._userControl.on('ice-status:*', function (eventName, userId, peerId, status) {
            return _this.emit("user.ice-status" + ((peerId > 0) ? '-screen' : '') + ":" + userId + ":" + status, userId, status);
        });
        this._userControl.on('signaling-status:*', function (eventName, userId, peerId, status) {
            return _this.emit("user.signaling-status" + ((peerId > 0) ? '-screen' : '') + ":" + userId + ":" + status, userId, status);
        });
        // 媒体流事件
        this._userControl.on('update-stream:*', function (eventName, userId, peerId, stream) {
            return _this.emit("user.update" + ((peerId > 0) ? '-screen' : '') + "-stream:" + userId, userId, stream);
        });
        this._userControl.on('remove-stream:*', function (eventName, userId, peerId) {
            return _this.emit("user.remove" + ((peerId > 0) ? '-screen' : '') + "-stream:" + userId, userId);
        });
        /*this._userControl.on('local-stream-added:*',
            (eventName: string, userId: string, peerId: number, stream: MediaStream) =>
                this.emit(`user.local${(peerId > 0) ? '-screen' : ''}-stream-added:${userId}`, userId, stream));*/
        this._userControl.on('media-stats-update:*', function (eventName, userId, peerId, stats) {
            return _this.emit("user.media-stats-update" + ((peerId > 0) ? '-screen' : '') + ":" + userId, userId, stats);
        });
        // 错误事件
        this._userControl.on('error:*', function (eventName, userId, peerId, err) {
            return _this.emit("user." + eventName, userId, err);
        });
    };
    /**
     * 本地媒体状态改变。
     * @event YMRTC#event:"local-media.status:[status]"
     * @property {string} status - 新的状态值，状态的取值：<br>
     *  - `stop`: 本地媒体已经停止（摄像头和麦克风都已经关掉了）；<br>
     *  - `starting`: 正在尝试启动本地媒体（包括请求权限和初始化设备）；<br>
     *  - `recording`: 本地媒体已经成功启动，正在录像和/或录音；<br>
     *  - `failed`: 失败（可能设备出错，或者用户禁止了摄像头和麦克风权限）。<br>
     * @category 本地媒体控制
     */
    /**
     * 本地媒体流已经准备就绪。
     * @event YMRTC#event:"local-media.has-stream"
     * @property {MediaStream} stream - 本地媒体流对象。
     * @category 本地媒体控制
     */
    /**
     * 本地媒体流被移除。
     * @event YMRTC#event:"local-media.remove-stream"
     * @category 本地媒体控制
     */
    /**
     * 本地媒体视频暂停（屏蔽了摄像头，对方只能看到黑屏）。
     * @event YMRTC#event:"local-media.pause-video"
     * @category 本地媒体控制
     */
    /**
     * 本地媒体音频暂停（关闭了麦克风，使对方听不到声音）。
     * @event YMRTC#event:"local-media.pause-audio"
     * @category 本地媒体控制
     */
    /**
     * 本地媒体视频恢复（取消暂停状态，摄像头重新亮起来）。
     * @event YMRTC#event:"local-media.resume-video"
     * @category 本地媒体控制
     */
    /**
     * 本地媒体音频暂停（取消暂停状态，麦克风重新开始采集声音）。
     * @event YMRTC#event:"local-media.resume-audio"
     * @category 本地媒体控制
     */
    YMRTC.prototype._handleLocalMediaEvent = function () {
        var _this = this;
        this._localMedia.on('status:*', function (eventName, status) { return _this.emit("local-media.status:" + status, status); });
        this._localMedia.on('has-stream', function (stream) { return _this.emit('local-media.has-stream', stream); });
        this._localMedia.on('remove-stream', function () { return _this.emit('local-media.remove-stream'); });
        this._localMedia.on('pause-video', function () { return _this.emit('local-media.pause-video'); });
        this._localMedia.on('pause-audio', function () { return _this.emit('local-media.pause-audio'); });
        this._localMedia.on('resume-video', function () { return _this.emit('local-media.resume-video'); });
        this._localMedia.on('resume-audio', function () { return _this.emit('local-media.resume-audio'); });
        this._localMedia.on('error', function (err) { return _this.emit('local-media.error', err); });
        this._localMedia.on('applied-constraints-video', function (constraints, settings) { return _this.emit('local-media.applied-constraints-video', constraints, settings); });
        this._localMedia.on('applied-constraints-audio', function (constraints, settings) { return _this.emit('local-media.applied-constraints-audio', constraints, settings); });
        /* 第二路流暂时不通知
        this._secondMedia.on('status:*', (eventName: string, status: string) => this.emit(`local-media.status:${status}`, status));
        this._secondMedia.on('has-stream', (stream: MediaStream) => this.emit('local-media.has-stream', stream));
        this._secondMedia.on('remove-stream', () => this.emit('local-media.remove-stream'));
        this._secondMedia.on('pause-video', () => this.emit('local-media.pause-video'));
        this._secondMedia.on('pause-audio', () => this.emit('local-media.pause-audio'));
        this._secondMedia.on('resume-video', () => this.emit('local-media.resume-video'));
        this._secondMedia.on('resume-audio', () => this.emit('local-media.resume-audio'));
        this._secondMedia.on('error', (err: Error) => this.emit('local-media.error', err));
        this._secondMedia.on(
            'applied-constraints-video',
            (constraints: MediaStreamConstraints, settings: MediaTrackSettings) => this.emit('local-media.applied-constraints-video', constraints, settings)
        );
        this._secondMedia.on(
            'applied-constraints-audio',
            (constraints: MediaStreamConstraints, settings: MediaTrackSettings) => this.emit('local-media.applied-constraints-audio', constraints, settings)
        );
        */
    };
    /**
     * 信令连接状态改变。
     * @event YMRTC#event:"signaling.status:[status]"
     * @property {string} status - 新的状态值，状态的取值：<br>
     *  - `disconnected`: 未连接；<br>
     *  - `connecting`: 正在尝试连接；<br>
     *  - `connected`: 已连接；<br>
     *  - `reconnecting`: （掉线后）重新连接；<br>
     *  - `ended`: 用户主动结束了连接。<br>
     * @category 信令服务器连接
     */
    /**
     * 信令服务器已经成功连接，等同于事件 `signaling.status:connected`
     * @event YMRTC#event:"signaling.ready"
     * @category 信令服务器连接
     */
    YMRTC.prototype._handleSignalingEvent = function () {
        var _this = this;
        this._janusManager.on('status:*', function (eventName, status) { return _this.emit("signaling.status:" + status, status); });
        this._janusManager.on('status:connected', function () { return _this.emit('signaling.ready'); });
    };
    YMRTC.support = JanusManager.isWebRTCSupported();
    return YMRTC;
}(wildemitter));

return YMRTC;

})));
//# sourceMappingURL=ymrtc.js.map
