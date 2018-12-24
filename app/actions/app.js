// @flow

export const SET_MESSAGES = 'SET_MESSAGES';
export const PUSH_MESSAGE = 'PUSH_MESSAGE';
export const UPDATE_MESSAGE = 'UPDATE_MESSAGE';

export const SET_ROOM = 'SET_ROOM';
export const SET_OTHER_USER_LIST = 'SET_OTHER_USER_LIST';
export const REMOVE_ONE_OTHER_USER = 'REMOVE_ONE_OTHER_USER';
export const ADD_ONE_OTHER_USER = 'ADD_ONE_OTHER_USER';
export const UPDATE_ONE_OTHER_USER = 'UPDATE_ONE_OTHER_USER';

export const SET_USER = 'SET_USER';
export const SET_WHITE_BOARD_ROOM = 'SET_WHITE_BOARD_ROOM';
export const RESET_APP_STATE = 'RESET_APP_STATE';

export const SET_REGION_CODE = 'SET_REGION_CODE';
export const SET_REGION_NAME = 'SET_REGION_NAME';

import type {
   User,
   Role,
   WhiteBoardRoom,
} from '../reducers/app';

export function setWhiteBoardRoom(room: WhiteBoardRoom) {
  return {
    type: SET_WHITE_BOARD_ROOM,
    whiteBoardRoom: room,
  };
}

export function setRoom(room: string) {
  return {
    type: SET_ROOM,
    room,
  };
}

export function setMessages(messages: Array) {
  return {
    type: SET_MESSAGES,
    messages,
  };
}

export function addOneMessage(message: any) {
  return {
    type: PUSH_MESSAGE,
    message,
  };
}

export function updateOneMessage(message: any) {
  return {
    type: UPDATE_MESSAGE,
    message,
  }
}

export function setUser(user: User) {
  return {
    type: SET_USER,
    user,
  };
}

export function setOtherUserList(users: Array<User>) {
  return {
    type: SET_OTHER_USER_LIST,
    users,
  };
}

export function removeOneOtherUser(id: string) {
  return {
    type: REMOVE_ONE_OTHER_USER,
    id,
  };
}

export function addOneOtherUser(user: User) {
  return {
    type: ADD_ONE_OTHER_USER,
    user,
  };
}

export function updateOneOtherUser(user: User) {
  return {
    type: UPDATE_ONE_OTHER_USER,
    user,
  };
}

export function resetAppState() {
  return {
    type: RESET_APP_STATE,
  };
}

export function setRegionCode(code: number) {
  return {
    type: SET_REGION_CODE,
    code,
  };
}

export function setRegionName(name: string) {
  return {
    type: SET_REGION_NAME,
    name,
  };
}
