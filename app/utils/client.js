/*
 * @Author: fan.li
 * @Date: 2018-11-11 15:36:30
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 16:12:51
 *
 * @flow
 *
 * 游密SDK 工具
 */

import path from 'path';
import {
  message
} from 'antd';
import crypto from 'crypto';

import {
  APP_KEY,
  APP_SECRET,
  API_SECRET,
  PUSH_STREAM_BASE_URL,
  PULL_STREAM_BASE_URL,
} from '../config';

import {
  configureStore
} from '../store/configureStore';
import * as actions from '../actions/app';
import YMRTC from '../YouMeSDK/Webrtc/ymrtc';

import type {
  User
} from '../reducers/app'

const CREATE_ROOM_EVENT = 'CREATE_ROOM_EVENT';
const JOIN_ROOM_EVENT = 'JOIN_ROOM_EVENT';


export const CLASS_IS_EXIST = -100000;
export const CLASS_IS_NOT_EXIST = -100001;
export const MAX_NUMBER_MEMBER_ERROR = -100002;

export const MAX_NUMBER_MEMBER_IN_ROOM = 5; // 房间最多允许多少人加入
export const TASK_INTERVAL_IN_SECOND = 1000 * 1; // 定时器时间间隔（以秒为单位）


export default class Client {
  static _instance = null;

  constructor() {
    if (Client._instance !== null) {
      return Client._instance;
    }

    this.resolveHash = new Map();
    this.rejectHash = new Map();
    this.task = null;

    this.$im = window.YoumeIMSDK.getInstance();
    this.$screen = window.YoumeScreenSDK;
    this.$ymrtc = new YMRTC({
      appKey: APP_KEY,
      video: true,
      debug: false,
      dev: false
    });

    this.initIM();
    this.initScreenRecord();
    this.bindRTCEvents();
    return Client._instance = this;
  }

  static get instance() {
    return Client._instance || (Client._instance = new Client());
  }

  static injectStore(store) {
    Client.store = store;
  }

  static getPushStreamUrl(room: string) {
    return PUSH_STREAM_BASE_URL + room;
  }

  static getPullStreamUrl(room: string) {
    return PULL_STREAM_BASE_URL + room + '.m3u8';
  }

  initIM() {
    this.$im.init(APP_KEY, APP_SECRET);
    this.bindIMEvents();
  }

  initScreenRecord() {
    this.$screen.setParam(1, false, 15, true);
  }

  login(uname, upasswd = '123456', utoken = ''): Promise < any > {
    const encodeSrc = APP_KEY + API_SECRET + uname;
    const sha1 = crypto.createHash('sha1');
    sha1.update(encodeSrc);
    const token = sha1.digest('hex');
    const rtcLoginPromise = this.$ymrtc.login(uname, token);

    const imLoginPromise = new Promise((resolve, reject) => {
      this.$im.login(uname, upasswd, utoken, (code, evt) => {
        return code === 0 ? resolve({ code, evt }) : reject({ code });
      });
    });

    return Promise.all([imLoginPromise, rtcLoginPromise]);
  }

  logout() {
    this.$im.logout();
    this.$ymrtc.logout();

    const rtcStatus = this.$ymrtc.getLocalMediaStatus();
    if (rtcStatus !== 'stop' && rtcStatus !== 'failed') {
      this.$ymrtc.stopLocalMedia();
    }

    const screenStatus = this.$screen.is_runing();
    if (screenStatus) {
      this.$screen.stop();
    }

    Client.store.dispatch(actions.resetAppState());
  }

  createChatRoom(uroom) {
    return new Promise((resolve, reject) => {
      this.$im.joinChatRoom(uroom, (code, evt) => {
        if (code !== 0) {
          return reject({ code });
        }

        this.task = setTimeout(() => {
          this.rejectHash.delete(CREATE_ROOM_EVENT);
          this.resolveHash.delete(CREATE_ROOM_EVENT);
          // 指定时间内没收到该房间内其他老师的占用声明，则视为该课堂没人占用,可以开课
          return resolve({ code, evt });
        }, TASK_INTERVAL_IN_SECOND);

        this.rejectHash.set(CREATE_ROOM_EVENT, reject);
        this.resolveHash.set(CREATE_ROOM_EVENT, resolve);
      });
    });
  }

  joinChatRoom(uroom) {
    return new Promise((resolve, reject) => {
      this.$im.joinChatRoom(uroom, (code, evt) => {
        if (code !== 0) {
          return reject({ code });
        }

        this.task = setTimeout(() => {
          this.rejectHash.delete(JOIN_ROOM_EVENT);
          this.resolveHash.delete(JOIN_ROOM_EVENT);
          // 指定时间内没有得到老师响应，则表明该课堂没有开课, 学生不能加入课堂
          return reject({ code: CLASS_IS_NOT_EXIST });
        }, TASK_INTERVAL_IN_SECOND);

        this.rejectHash.set(JOIN_ROOM_EVENT, reject);
        this.resolveHash.set(JOIN_ROOM_EVENT, resolve);
      });
    });
  }

  setMicrophoneMute(memberId: string, isOpen: boolean): void {
    const state = Client.store.getState();
    const { users, user, room } = state.app;
    if (memberId === user.id) { // change myself microphone
      if (isOpen && this.$ymrtc.isLocalAudioPaused()) {
        this.$ymrtc.resumeLocalAudio();
      }
      if (!isOpen && !this.$ymrtc.isLocalAudioPaused()) {
        this.$ymrtc.pauseLocalAudio();
      }
    } else {
      const oldUser = users.find((item: User) => item.id === memberId);
      const newUser = Object.assign({}, oldUser, { isMicOn: isOpen });
      Client.store.dispatch(actions.updateOneOtherUser(newUser));
    }

    // notify other in room
    const cmd = { cmd: 2, data: { userId: memberId, isMicOn: isOpen } };
    this.signing(room, 2, cmd);
  };

  setCameraOpen(memberId: string, isOpen: boolean): void {
    const state = Client.store.getState();
    const { users, user, room } = state.app;
    if (memberId === user.id) {
      if (isOpen && this.$ymrtc.isLocalVideoPaused()) {
        this.$ymrtc.resumeLocalVideo();
      }
      if (!isOpen && !this.$ymrtc.isLocalVideoPaused()) {
        this.$ymrtc.pauseLocalVideo();
      }
    } else {
      const oldUser = users.find((item: User) => item.id === memberId);
      const newUser = Object.assign({}, oldUser, { isCameraOn: isOpen });
      Client.store.dispatch(actions.updateOneOtherUser(newUser));
    }

    // notify other in room
    const cmd = { cmd: 3, data: { userId: memberId, isCameraOn: isOpen } };
    this.signing(room, 2, cmd);
  }

  sendTextMessage(recvId: string, chatType: number, text: string): Promise < any > {
    return new Promise((resolve, reject) => {
      this.$im.sendTextMessage(recvId, chatType, text, (code, evt) => {
        return code === 0 ? resolve({ code, evt }) : reject({ code });
      });
    });
  }

  sendCustomMessage(recvId: string, chatType: number, content: string): Promise < any > {
    return new Promise((resolve, reject) => {
      this.$im.sendCustomMessage(recvId, chatType, content, (code, evt) => {
        return code === 0 ? resolve({ code, evt }) : reject({ code });
      });
    });
  }

  signing(recvId: string, chatType: number, content: object): Promise < any > {
    const base64 = btoa(JSON.stringify(content));
    return this.sendCustomMessage(recvId, chatType, base64);
  }

  bindIMEvents() {
    this.$im.on('OnRecvMessage', (msg) => {
      if (msg.messageType === 1) { // 文本消息
        const formatedMsg = {
          messageId: msg.serial,
          nickname: msg.senderID.split('_')[0],
          content: msg.content,
          isFromMe: false,
          avatar: require('../assets/images/avatar.png')
        };
        Client.store.dispatch(actions.addOneMessage(formatedMsg));
      } else if (msg.messageType === 2) { // customer message singing
        this.handleSigining(msg);
      }
    });

    this.$im.on('OnKickOff', (msg) => {
      console.log('OnKickOf:', msg);
    });

    this.$im.on('OnUserLeaveChatRoom', (msg) => {
      const { channelID, userID } = msg;
      console.log('OnUserLeaveChatRoom:', msg);
    });

    this.$im.on('OnUserJoinChatRoom', (msg) => {
      const { channelID, userID } = msg;
      const state = Client.store.getState();
      const { app } = state;
      const { user, room, users, whiteBoardRoom } = app;
      const { id, name, role } = user;
      const { uuid, roomToken } = whiteBoardRoom;
      if (role === 0) { // teacher should send a sigining to student
        if (users.length <= MAX_NUMBER_MEMBER_IN_ROOM) {
          const cmd = {
            cmd: 0,
            data: { whiteBoardRoom: { uuid, roomToken } }
          };
          this.signing(userID, 1, cmd);
        } else {
          const cmd = {
            cmd: 1,
            data: { max: MAX_NUMBER_MEMBER_IN_ROOM, count: users.length - 1 }
          };
          this.signing(userID, 1, cmd);
        }
      }
    });

    this.$im.on('OnLogout', (msg) => {
      Client.store.dispatch(actions.resetAppState());
      const state = Client.store.getState();
      window.location.hash = '';
    });
  }

  bindRTCEvents() {
    this.$ymrtc.on('room.member-join:*', (eventFullName, roomId, memberId) => {
      console.warn(`eventFullName: ${eventFullName}, roomId: ${roomId}, memberId: ${memberId}`);
      const name = memberId.split('_')[0];
      const role = parseInt(memberId.split('_')[2], 10);
      const user = {
        id: memberId,
        name: name,
        role: role,
        isMicOn: true,
        isCameraOn: true,
      };

      Client.store.dispatch(actions.addOneOtherUser(user));
      this.$ymrtc.requestUserStream(memberId).then((stream: MediaStream) => {
        // hack: 获取存在些问题，不一定更改Redux后就能立马渲染出Dom
        const videoDom = document.getElementById(`canvas-${memberId}`);
        if (videoDom) {
          videoDom.srcObject = stream;
        }
      });
    });

    this.$ymrtc.on('room.member-leave:*', (eventFullName, roomId, memberId) => {
      console.warn(`eventFullName: ${eventFullName}, roomId: ${roomId}, memberId: ${memberId}`);
      const name = memberId.split('_')[0];
      const role = parseInt(memberId.split('_')[2], 10);
      if (role === 0) { // teacher logout, student should leave room
        message.info('you teacher close class room!');
        this.logout();
        window.location.hash = '';
        return;
      }

      Client.store.dispatch(actions.removeOneOtherUser(memberId));
    });

    this.$ymrtc.on('local-media.has-stream', (stream: MediaStream) => {
      const state = Client.store.getState();
      const { user } = state.app;
      this.$ymrtc.setLocalAudioVolumeGain(0.1);
      const videoDom: HTMLVideoElement = document.getElementById(`canvas-${user.id}`);
      if (videoDom) {
        videoDom.srcObject = stream;
      }
    });

    this.$ymrtc.on('user.update-stream:', (memberId: string, stream: MediaStream) => {
      const videoDom: HTMLVideoElement = document.getElementById(`canvas-${memberId}`);
      if (videoDom) {
        videoDom.srcObject = stream;
      }
    });

    this.$ymrtc.on('local-media.pause-audio', () => {
      const state = Client.store.getState();
      const { user } = state.app;
      const tempUser = Object.assign({}, user, { isMicOn: false });
      Client.store.dispatch(actions.setUser(tempUser));
    });

    this.$ymrtc.on('local-media.pause-video', () => {
      const state = Client.store.getState();
      const { user } = state.app;
      const tempUser = Object.assign({}, user, { isCameraOn: false });
      Client.store.dispatch(actions.setUser(tempUser));
    });

    this.$ymrtc.on('local-media.resume-audio', () => {
      const state = Client.store.getState();
      const { user } = state.app;
      const tempUser = Object.assign({}, user, { isMicOn: true });
      Client.store.dispatch(actions.setUser(tempUser));
    });

    this.$ymrtc.on('local-media.resume-video', () => {
      const state = Client.store.getState();
      const { user } = state.app;
      const tempUser = Object.assign({}, user, { isCameraOn: true });
      Client.store.dispatch(actions.setUser(tempUser));
    });
  }

  handleSigining(msg) {
    const content = atob(msg.content);
    const { cmd, data } = JSON.parse(content);

    switch (cmd) {
      // 收到老师房间正常的回应
      case 0: {
        this.resolveHash.delete(CREATE_ROOM_EVENT);
        if (this.rejectHash.has(CREATE_ROOM_EVENT)) {
          const reject = this.rejectHash.get(CREATE_ROOM_EVENT);
          this.rejectHash.delete(CREATE_ROOM_EVENT);
          // 该课堂有其他老师声明课程被占用了, 不能再这个房间再次开课
          reject({ code: CLASS_IS_EXIST });
        }

        this.rejectHash.delete(JOIN_ROOM_EVENT);
        if (this.resolveHash.has(JOIN_ROOM_EVENT)) {
          const resolve = this.resolveHash.get(JOIN_ROOM_EVENT);
          // 收到了该课堂老师的回应，学生可以加入到房间
          resolve({ code: 0, evt: data });
        }
        break;
      }

      // 收到老师端房间超员的回应
      case 1: {
        this.resolveHash.delete(CREATE_ROOM_EVENT);
        if (this.rejectHash.has(CREATE_ROOM_EVENT)) {
          const reject = this.rejectHash.get(CREATE_ROOM_EVENT);
          this.rejectHash.delete(CREATE_ROOM_EVENT);
          // 该课堂有其他老师声明课程被占用了, 不能再这个房间再次开课
          reject({ code: CLASS_IS_EXIST });
        }

        this.resolveHash.delete(JOIN_ROOM_EVENT);
        if (this.rejectHash.has(JOIN_ROOM_EVENT)) {
          const reject = this.rejectHash.get(JOIN_ROOM_EVENT);
          // 收到了该课堂老师的回应，但是房间超员了，学生也不能进入房间
          reject({ code: MAX_NUMBER_MEMBER_ERROR, });
        }
        break;
      }

      // 远端用户麦克风状态改变 （开/关）
      case 2: {
        const state = Client.store.getState();
        const { user, users } = state.app;
        const { userId, isMicOn } = data;
        if (userId === user.id) { // teacher change my microphone status
          if (isMicOn && this.$ymrtc.isLocalAudioPaused()) {
            this.$ymrtc.resumeLocalAudio();
          }
          if (!isMicOn && !this.$ymrtc.isLocalAudioPaused()) {
            this.$ymrtc.pauseLocalAudio();
          }
        } else { // teacher change other student's microphone status
          const oldOther = users.find((item: User) => item.id === userId);
          const newOther = Object.assign({}, oldOther, { isMicOn: isMicOn });
          Client.store.dispatch(actions.updateOneOtherUser(newOther));
        }
        break;
      }

      // 远端用户视频状态改变（开/关）
      case 3: {
        const state = Client.store.getState();
        const { user, users } = state.app;
        const { userId, isCameraOn } = data;
        if (userId === user.id) { // teacher change my camera status
          if (isCameraOn && this.$ymrtc.isLocalVideoPaused()) {
            this.$ymrtc.resumeLocalVideo();
          }
          if (!isCameraOn && !this.$ymrtc.isLocalVideoPaused()) {
            this.$ymrtc.resumeLocalVideo();
          }
        } else { // teacher change other student's camera status
          const oldOther = users.find((item: User) => item.id === userId);
          const newOther = Object.assign({}, oldOther, { isCameraOn: isCameraOn });
          Client.store.dispatch(actions.updateOneOtherUser(newOther));
        }
        break;
      }

      // 教师关闭录屏
      case 4: {
        message.info('your teacher stop screen share!');
        Client.store.dispatch(actions.setPanelRole(0)); // 去白板页面
        break;
      }

      // 教师开启录屏
      case 5: {
        message.info('your teacher start share screen!');
        const state = Client.store.getState();
        Client.store.dispatch(actions.setPanelRole(1)); // 去录屏页面
      }
    }
  }
}
