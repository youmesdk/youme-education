/*
 * @Author: fan.li
 * @Date: 2018-11-11 15:04:27
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-17 14:41:15
 *
 * @flow
 *
 */

import {
  PUSH_MESSAGE,
  UPDATE_MESSAGE,
  SET_ROOM,
  SET_NICKNAME,
  SET_ROLE,
  SET_USER_LIST,
  REMOVE_ONE_USER,
  ADD_ONE_USER,
} from '../actions/app';

export type AppStateType = {
  messages: Array<Object>,
  room: string,
  nickname: string,
  role: 0 | 1,
  users: Array<string>
};

const initialState: AppStateType = {
  messages: [],
  room: '',
  nickname: '',
  role: 0, // 0: teacher 1: student
  users: [],
};


export default (state = initialState, action: { type: string }) => {
  switch(action.type) {
    // append new message
    case PUSH_MESSAGE: {
      return {
        ...state,
        messages: [...state.messages, action.message]
      };
    }

    // update one exist message by message's id
    case UPDATE_MESSAGE: {
      const index = state.messages.findIndex((item) =>
        item.messageId === action.message.messageId
      );
      const newMessages = state.messages;
      newMessages.splice(index, 1, action.message);
      return {
        ...state,
        messages: newMessages
      };
    }

    // set current room's name
    case SET_ROOM: {
      return {
        ...state,
        room: action.room,
      };
    }

    // set current user's name
    case SET_NICKNAME: {
      const { nickname } = action;
      return {
        ...state,
        nickname: nickname
      };
    }

    case SET_ROLE: {
      const { role } = action;
      return {
        ...state,
        role: role,
      };
    }

    case SET_USER_LIST: {
      const { users } = action;
      return {
        ...state,
        users: users,
      };
    }

    case REMOVE_ONE_USER: {
      const { user } = action;
      const { users } = state;
      const result = users.filter((item) => item !== user);
      return {
        ...state,
        users: result,
      };
    }

    case ADD_ONE_USER: {
      const { user } = action;
      const { users } = state;
      return {
        ...state,
        users: [...users, user],
      };
    }

    default: {
      return state;
    }
  }
}
