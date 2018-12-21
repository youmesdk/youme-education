/*
 * @Author: fan.li
 * @Date: 2018-11-11 15:04:27
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-17 17:38:05
 *
 * @flow
 *
 */

import {
  SET_MESSAGES,
  PUSH_MESSAGE,
  UPDATE_MESSAGE,
  SET_ROOM,
  SET_USER_LIST,
  REMOVE_ONE_USER,
  ADD_ONE_USER,
  SET_USER,
  SET_WHITE_BOARD_ROOM,
  RESET_APP_STATE,
} from '../actions/app';

export type AppStateType = {
  messages: Array<Object>,
  room: string,
  nickname: string,
  role: Role,
  users: Array<User>,
  whiteBoardRoom: WhiteBoardRoom,
};

export type Role = 0 | 1;  // 0: teacher; 1 student;

export type User = {
  id: string,       // user id
  name: string,     // user name
  role: Role,
};

export type WhiteBoardRoom = {
  uuid: string,
  roomToken: string,
};

const initialState: AppStateType = {
  messages: [],
  room: '',
  nickname: '',
  role: 0, // 0: teacher 1: student
  users: [],
  user: { id: '', name: '', role: 0 },
  whiteBoardRoom: { uuid: '', roomToken: '' },
};


export default (state = initialState, action: { type: string }) => {
  switch(action.type) {
    case SET_MESSAGES: {
      const { messages } = action;

      return {
        ...state,
        messages,
      };
    }

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
      const result = users.filter((item) => item.name !== user.name);
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

    case SET_USER: {
      const { user } = action;
      return {
        ...state,
        user,
      };
    }

    case SET_WHITE_BOARD_ROOM: {
      const { whiteBoardRoom } = action;
      return {
        ...state,
        whiteBoardRoom,
      };
    }

    // reset all state
    case RESET_APP_STATE: {
      return initialState;
    }

    default: {
      return state;
    }
  }
}
