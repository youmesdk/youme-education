/*
 * @Author: fan.li
 * @Date: 2018-11-11 15:36:30
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-18 21:19:15
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
import { message } from 'antd';

const CREATE_ROOM_EVENT = 'CREATE_ROOM_EVENT';
const JOIN_ROOM_EVENT = 'JOIN_ROOM_EVENT';


export const CLASS_IS_EXIST = -100000;
export const CLASS_IS_NOT_EXIST = -100001;
export const MAX_NUMBER_MEMBER_ERROR = -100002;

export const MAX_NUMBER_MEMBER_IN_ROOM = 5;        // 房间最多允许多少人加入
export const TASK_INTERVAL_IN_SECOND = 1000 * 0.5;  // 定时器时间间隔（以秒为单位）


export default class Client {
  static _instance = null;

  constructor() {
    if (Client._instance !== null) {
      return Client._instance;
    }
    this.resolveHash = new Map();
    this.rejectHash = new Map();
    this.task = null;

    this.$video = window.YoumeVideoSDK.getInstance();
    this.$im = window.YoumeIMSDK.getInstance();
    this.initIM();

    return Client._instance = this;
  }

  static get instance() {
    return Client._instance || (Client._instance = new Client());
  }

  static injectStore(store) {
    Client.store = store;
  }

  initIM() {
    // 初始化IM
    this.$im.init(APP_KEY, APP_SECRET);
    this._bindIMEvents();
  }

  initVideo(videoServerRegin: number, videoReginName: string): Promise<any> {
    // 初始化Video
    return new Promise((resolve, reject) => {
      const code = this.$video.init(APP_KEY, APP_SECRET, videoServerRegin, videoReginName, () => {
        this._bindVideoEvents();
        return resolve();
      });

      if (code !== 0) {
        return reject(code);
      }
    });
  }

  login(uname, upasswd = '123456', utoken = '') {
    return new Promise((resolve, reject) => {
      this.$im.login(uname, upasswd, utoken, (code, evt) => {
        return code === 0 ? resolve({ code, evt }) : reject({ code });
      });
    });
  }

  logout() {
    this.$im.logout();
    this.$video.leaveChannelAll();
    if (this.task) {
      clearTimeout(this.task);
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

  joinVideoRoom(uname: string, uroom: string, roleType: number = 1) {
    return new Promise((resolve, reject) => {
      const code = this.$video.joinChannelSingleMode(uname, uroom, roleType);
      return code === 0 ? resolve({ code }) : reject({ code });
    });
  }

  setMicrophoneMute(isOpen: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      this.$video.setMicrophoneMute(isOpen, (code, evt) => {
        return code === 0 ? resolve({ code, evt }) : reject({ code, evt });
      });
    })
  };

  setOtherMicMute(strUserID: string, isOpen: boolean): void {
    this.$video.setOtherMicMute(strUserID, isOpen)
  }

  setCameraOpen(isOpen: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      if (isOpen) {
        this.$video.startCapture((code, evt) => {
          return code === 0 ? resolve({ code, evt }) : reject({ code, evt });
        });
      } else {
        this.$video.stopCapture((code, evt) => {
          return code === 0 ? resolve({ code, evt }) : reject({ code, evt });
        })
      }
    });
  }

  sendTextMessage(recvId: string, chatType: number, text: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.$im.sendTextMessage(recvId, chatType, text, (code, evt) => {
        return code === 0 ? resolve({ code, evt }) : reject({ code });
      });
    });
  }

  sendCustomMessage(recvId: string, chatType: number, content: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.$im.sendCustomMessage(recvId, chatType, content, (code, evt) => {
        return code === 0 ? resolve({ code, evt }) : reject({ code });
      });
    });
  }

  signing(recvId: string, chatType: number, content: object): Promise<any> {
    const base64 = btoa(JSON.stringify(content));
    return this.sendCustomMessage(recvId, chatType, base64);
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
        this._handleSigining(msg);
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
      const { user, room, regionCode, regionName, users, whiteBoardRoom } = app;
      const { id, name, role } = user;
      const { uuid, roomToken } = whiteBoardRoom;

      if (role === 0) {  // teacher should send a sigining to student
        if (users.length <= MAX_NUMBER_MEMBER_IN_ROOM) {
          const cmd = {
            cmd: 0,
            data: {
              regionCode: regionCode,
              regionName: regionName,
              whiteBoardRoom: {
                 uuid,
                 roomToken
                }
              },
          };

          this.signing(userID, 1, cmd);
        } else {
          const cmd = {
            cmd: 1,
            data: { max: MAX_NUMBER_MEMBER_IN_ROOM, count: users.length - 1 },
          };
          this.signing(userID, 1, cmd);
        }
      }
    });

    this.$im.on('OnLogout', (msg) => {
      this.$video.leaveChannelAll();
      Client.store.dispatch(actions.resetAppState());
      const state = Client.store.getState();
      window.location.hash = '';
    });
  }

  _bindVideoEvents() {
    this.$video.on('onMemberChange', ({ memchange }) => {
      const state = Client.store.getState();
      const { app, } = state;
      const { users, user } = app;

      memchange.forEach((item) => {
        const { isJoin, userid } = item;
        if (isJoin) {
          const index = users.findIndex((u) => u.id === userid);
          if (index === -1 && user.id !== userid) {
            // userid: name_timestamp_role
            const name = userid.split('_')[0];
            const role = parseInt(userid.split('_')[2], 10);
            const user = {
              id: userid,
              name: name,
              role: role,
              isMicOn: true,
              isCameraOn: true,
            };
            Client.store.dispatch(actions.addOneOtherUser(user));
          }
        } else {
          if (user.id !== userid) {
            const role = parseInt(userid.split('_')[2], 10);
            if (role === 0) {  // teacher logout, student need logout too
              message.info('meeting host close meeting!');
              this.logout();
              window.location.hash = '';
            } else {
              this.$video.removeCanvasBind(`canvas-${userid}`);
              Client.store.dispatch(actions.removeOneOtherUser(userid));
            }
          }
        }
      });
    });

    // other open mic
    this.$video.on('YOUME_EVENT_OTHERS_MIC_ON', (evt) => {
      const { param: userId } = evt;
      const state = Client.store.getState();
      const { users } = state.app;

      const prevUser = users.find((item) => item.id === userId);
      console.log('Other mic on: ', evt);
      if (prevUser) {
        const nextUser = Object.assign({}, prevUser, { isMicOn: true });
        Client.store.dispatch(actions.updateOneOtherUser(nextUser));
      }
    });

    // other close mic by self
    this.$video.on('YOUME_EVENT_OTHERS_MIC_OFF', (evt) => {
      const { param: userId } = evt;
      const state = Client.store.getState();
      const { users } = state.app;

      const prevUser = users.find((item) => item.id === userId);
      console.log('Other mic off: ', evt);
      if (prevUser) {
        const nextUser = Object.assign({}, prevUser, { isMicOn: false });
        Client.store.dispatch(actions.updateOneOtherUser(nextUser));
      }
    });

    // my mic open by other
    this.$video.on('YOUME_EVENT_MIC_CTR_ON', (evt) => {
      const state = Client.store.getState();
      const { user } = state.app;
      const nextUser = Object.assign({}, user, { isMicOn: true });
      Client.store.dispatch(actions.setUser(nextUser));
    });

    // my mic close by other
    this.$video.on('YOUME_EVENT_MIC_CTR_OFF', (evt) => {
      const state = Client.store.getState();
      const { user } = state.app;
      const nextUser = Object.assign({}, user, { isMicOn: false });
      Client.store.dispatch(actions.setUser(nextUser));
    });

    // other open camera by self
    this.$video.on('YOUME_EVENT_OTHERS_VIDEO_INPUT_START', (evt) => {
      const { param: userId } = evt;
      const state = Client.store.getState();
      const { users } = state.app;

      const prevUser = users.find((item) => item.id === userId);
      console.log('Other video on: ', evt);
      if (prevUser) {
        const nextUser = Object.assign({}, prevUser, { isCameraOn: true });
        Client.store.dispatch(actions.updateOneOtherUser(nextUser));
      }
    });

    // other close camare
    this.$video.on('YOUME_EVENT_OTHERS_VIDEO_INPUT_STOP', (evt) => {
      const { param: userId } = evt;
      const state = Client.store.getState();
      const { users } = state.app;

      const prevUser = users.find((item) => item.id === userId);
      console.log('Other video off: ', evt);
      if (prevUser) {
        const nextUser = Object.assign({}, prevUser, { isCameraOn: false });
        Client.store.dispatch(actions.updateOneOtherUser(nextUser));
      }
    });
  }

  _handleSigining(msg) {
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
    }
  }
}
