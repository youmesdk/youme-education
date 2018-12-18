// @flow

export const PUSH_MESSAGE = 'PUSH_MESSAGE';
export const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
export const SET_ROOM = 'SET_ROOM';
export const SET_USER_LIST = 'SET_USER_LIST';
export const REMOVE_ONE_USER = 'REMOVE_ONE_USER';
export const ADD_ONE_USER = 'ADD_ONE_USER';
export const SET_USER = 'SET_USER';

import type { User, Role } from '../reducers/app';

export function setRoom(room: string) {
  return {
    type: SET_ROOM,
    room,
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

export function setUserList(users: Array<User>) {
  return {
    type: SET_USER_LIST,
    users,
  };
}

export function removeOneUser(user: User) {
  return {
    type: REMOVE_ONE_USER,
    user,
  };
}

export function addOneUser(user: User) {
  return {
    type: ADD_ONE_USER,
    user,
  };
}
