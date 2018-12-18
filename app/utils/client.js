/*
 * @Author: fan.li
 * @Date: 2018-11-11 15:36:30
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-18 10:15:28
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

import { configureStore } from '../store/configureStore';
import * as actions from '../actions/app';

export default class Client {
  static _instance = null;

  constructor() {
    if (Client._instance !== null) {
      return Client._instance;
    }
    this.$video = window.YoumeVideoSDK.getInstance();
    this.$im = window.YoumeIMSDK.getInstance();
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

  static injectStore(store) {
    Client.store = store;
  }

  init() {
    // 初始化IM
    this.$im.init(APP_KEY, APP_SECRET);

    // 初始化Video
    this.$video.init(APP_KEY, APP_SECRET, VIDEO_SERVERE_REGION, VIDEO_REGION_NAME);
    this.$video.setExternalInputMode(false);
    this.$video.setAVStatisticInterval(5000);
    this.$video.videoEngineModelEnabled(false);
    this.$video.setVideoLocalResolution(320, 240);
    this.$video.setVideoNetResolution(320, 240);
    this.$video.setMixVideoSize(320, 240);
    this.$video.setVideoCallback("");
    this.$video.setAutoSendStatus(true);
    this.$video.setVolume(100);

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
      console.log('video join room', vcode);
      if (vcode !== 0) {
        return reject(vcode);
      }
      return resolve();
    });
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
    this.$im.on('OnRecvMessage', (msg) => {
      if (msg.messageType === 1) { // 文本消息
        const formatedMsg = {
          messageId: msg.serial,
          nickname: msg.senderID,
          content: msg.content,
          isFromMe: false,
          avatar: require('../assets/images/avatar.png')
        };
        Client.store.dispatch(actions.addOneMessage(formatedMsg));
      }
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

    this.$video.on('onMemberChange', ({ memchange }) => {
      const { isJoin, userid } = memchange;
      const state = Client.store.getState();
      const { app } = state;
      const { users } = app;
      if (isJoin) {
        const index = users.findIndex((u) => u.name === userid);
        if (index !== -1) {
          const user = {
            name: userid,
            role: 1, // student,
          };
          Client.store.dispatch(actions.addOneUser(user));
        }
      }
    });
  }
}
