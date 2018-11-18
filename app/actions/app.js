// @flow

export const PUSH_MESSAGE = 'PUSH_MESSAGE';
export const DELETE_MESSAGE = 'DELETE_MESSAGE';
export const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
export const REMOVE_ALL_MESSAGE = 'REMOVE_ALL_MESSAGE';
export const SET_ROOM = 'SET_ROOM';
export const SET_NICKNAME = 'SET_NICKNAME';

export function addOneMessage(message: any) {
  return {
    type: PUSH_MESSAGE,
    message
  };
}

export function delOneMessage(messageId: string | number) {
  return {
    type: DELETE_MESSAGE,
    id: messageId
  }
}

export function updateOneMessage(message: any) {
  return {
    type: UPDATE_MESSAGE,
    message
  }
}

export function removeAllMessage() {
  return {
    type: REMOVE_ALL_MESSAGE
  };
}

export function setRoom(room: string) {
  return {
    type: SET_ROOM,
    room
  };
}

export function setNickname(nickname: string) {
  return {
    type: SET_NICKNAME,
    nickname
  };
}
