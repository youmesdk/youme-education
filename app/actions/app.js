// @flow

export const PUSH_MESSAGE = 'PUSH_MESSAGE';
export const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
export const SET_ROOM = 'SET_ROOM';
export const SET_NICKNAME = 'SET_NICKNAME';
export const SET_ROLE = 'SET_ROLE';
export const SET_USER_LIST = 'SET_USER_LIST';
export const REMOVE_ONE_USER = 'REMOVE_ONE_USER';
export const ADD_ONE_USER = 'ADD_ONE_USER';


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

export function setRoom(room: string) {
  return {
    type: SET_ROOM,
    room,
  };
}

export function setNickname(nickname: string) {
  return {
    type: SET_NICKNAME,
    nickname,
  };
}

export function setRole(role: 0 | 1) {
  return {
    type: SET_ROLE,
    role,
  };
}

export function setUserList(users: Array<string>) {
  return {
    type: SET_USER_LIST,
    users,
  };
}

export function removeOneUser(user: string) {
  return {
    type: REMOVE_ONE_USER,
    user,
  };
}

export function addOneUser(user: string) {
  return {
    type: ADD_ONE_USER,
    user,
  };
}
