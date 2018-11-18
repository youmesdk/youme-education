/*
 * @Author: fan.li
 * @Date: 2018-11-11 15:36:30
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-11 16:40:42
 *
 * @flow
 *
 * 游密SDK 工具
 */

import {
  APP_KEY,
  APP_SECRET,
  VIDEO_SERVERE_REGION,
  VIDEO_REGION_NAME
} from '../config';
import * as appActions from '../actions/app';
import { bindActionCreators } from 'redux';

export default class Client {
  static _instance = null;

  constructor() {
    if (Client._instance !== null) {
      return Client._instance;
    }
    this.$video = window.YoumeVideoSDK.getInstance();
    this.$im = window.YoumeIMSDK.getInstance();
    this.$screeen = window.YoumeScreenSDK;
    this.uname = '';
    this.role = '';
    this.uroom = '';
    this.init();
    return Client._instance = this;
  }

  static getInstance() {
    return Client._instance || (Client._instance = new Client());
  }

  static get instance() {
    return Client.getInstance();
  }

  init() {
    // 初始化IM
    this.$im.init(APP_KEY, APP_SECRET);

    // 初始化Video
    this.$video.init(APP_KEY, APP_SECRET, VIDEO_SERVERE_REGION, VIDEO_REGION_NAME);
    this.$video.setExternalInputMode(false);
    this.$video.setAVStatisticInterval(5000);
    this.$video.videoEngineModelEnabled(false);

    this._bindEvents();
  }

  login(uname, upasswd = '123456', utoken = '') {
    this.uname = uname;
    return new Promise((resolve, reject) => {
      this.$im.login(this.uname, upasswd, utoken, (code, evt) => {
        return code === 0 ? resolve() : reject(evt);
      });
    });
  }

  logout() {
    this.$im.logout();
    this.$video.leaveChannelAll();
  }

  joinRoom(uroom) {
    this.uroom = uroom;
    return new Promise((resolve, reject) => {
      this.$im.joinChatRoom(this.uroom, (code, evt) => {
        if (code !== 0) {
          return reject(code);
        }
      });
      const vcode = this.$video.joinChannelSingleMode(this.uname, this.uroom, 1);
      if (vcode !== 0) {
        return reject(vcode);
      }
      return resolve();
    });
  }

  setData(userid, channel, role) {
    if (role === 'teacher') {
      this.userid = 'teacher_' + userid;
      this.teacher = userid;
    } else if (role === 'student') {
      this.userid = 'student_' + userid;
    }
    this.channel = channel;
    this.role = role;
  }

  sendTextMessage(recvId: string, chatType: number, text: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.$im.sendTextMessage(recvId, chatType, text, (code, eve) => {
        if (code !== 0) {
          return reject(code);
        }
        return resolve({ code, eve });
      });

    });
  }

  _bindEvents() {
    console.log('bding event==============')
    this.$im.on('OnRecvMessage', (msg) => {
      console.log('OnRecvMessage:', msg);
    });

    this.$im.on('OnKickOff', (msg) => {
      console.log('OnKickOf:', msg);
    });

    this.$im.on('OnRecvReconnectResult', (msg) => {
      console.log('OnRecvReconnectResult:', msg);
    });

    this.$im.on('OnStartReconnect', (msg) => {
      console.log('OnStartReconnect:', msg);
    });

    this.$im.on('OnUserLeaveChatRoom', (msg) => {
      console.log('OnUserLeaveChatRoom:', msg);
    });

    this.$im.on('OnUserJoinChatRoom', (msg) => {
      console.log('OnUserJoinChatRoom:', msg);
    });

    this.$im.on('OnLogout', (msg) => {
      console.log('OnLogout:', msg);
    });
  }
}
