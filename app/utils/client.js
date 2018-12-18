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
    this.initIM();

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

  initIM() {
    // 初始化IM
    this.$im.init(APP_KEY, APP_SECRET);
    this._bindIMEvents();
  }

  initVideo(videoServerRegin?: number, videoReginName?: string) {
    const serverRegin = videoServerRegin ? videoServerRegin : VIDEO_SERVERE_REGION;
    const reginName = videoReginName ? videoReginName : VIDEO_REGION_NAME;

    // 初始化Video
    this.$video.init(APP_KEY, APP_SECRET, serverRegin, reginName);
    this.$video.setExternalInputMode(false);
    this.$video.setAVStatisticInterval(5000);
    this.$video.videoEngineModelEnabled(false);
    this.$video.setVideoLocalResolution(320, 240);
    this.$video.setVideoNetResolution(320, 240);
    this.$video.setMixVideoSize(320, 240);
    this.$video.setVideoCallback("");
    this.$video.setAutoSendStatus(true);
    this.$video.setVolume(100);
  }

  login(uname, upasswd = '123456', utoken = '') {
    return new Promise((resolve, reject) => {
      this.$im.login(uname, upasswd, utoken, (code, evt) => {
        return code === 0 ? resolve() : reject(evt);
      });
    });
  }

  logout() {
    this.$im.logout();
    this.$video.leaveChannelAll();
  }

  joinChatRoom(uroom) {
    return new Promise((resolve, reject) => {
      this.$im.joinChatRoom(uroom, (code, evt) => {
        return code === 0 ? resolve(code) : reject(evt);
      });
    });
  }

  joinVideoRoom(uname: string, uroom: string, roleType: number = 1) {
    return new Promise((resolve, reject) => {
      const code = this.$video.joinChannelSingleMode(uname, uroom, roleType);
      return code === 0 ? resolve(code) : reject(code);
    });
  }

  sendTextMessage(recvId: string, chatType: number, text: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.$im.sendTextMessage(recvId, chatType, text, (code, eve) => {
        return code === 0 ? resolve(eve) : reject(code);
      });
    });
  }

  sendCustomerMessage(recvId: string, chatType: number, content: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.$im.sendCustomerMessage(recvId, chatType, content, (code, msg) => {
        return code === 0 ? resolve(msg) : reject(code);
      });
    });
  }

  signing(recvId: string, chatType: number, content: object): Promise<any> {
    const base64 = btoa(JSON.stringify(content));
    return this.sendCustomerMessage(recvId, chatType, base64);
  }

  _bindIMEvents() {
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
      } else if (msg.messageType === 2) {  // customer message singing
        console.log('customer message: ', msg);
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
      const { channelID, userID } = msg;
      console.log('OnUserLeaveChatRoom:', msg);
    });

    this.$im.on('OnUserJoinChatRoom', (msg) => {
      const { channelID, userID } = msg;
      const state = Client.store.getState();
      const { app } = state;
      const { user, room, region } = state;
      const cmd = { cmd: 1, data: { teacher: user, region: region } };
      this.signing(userID, 0, cmd);
    });

    this.$im.on('OnLogout', (msg) => {
      console.log('OnLogout');
    });
  }

  _bindVideoEvents() {
    this.$video.on('onMemberChange', ({ memchange }) => {
      const { isJoin, userid } = memchange;
      const state = Client.store.getState();
      const { app } = state;
      const { users, role } = app;
      if (isJoin) {
        const index = users.findIndex((u) => u.id === userid);
        if (index === -1) {
          const name = userid.split('_')[1];
          const user = {
            id: userid,
            name: name,
            role: role === 1, // student,
          };
          Client.store.dispatch(actions.addOneUser(user));
        }
      }
    });
  }
}
