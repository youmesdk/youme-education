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

  SET_OTHER_USER_LIST,
  REMOVE_ONE_OTHER_USER,
  ADD_ONE_OTHER_USER,
  UPDATE_ONE_OTHER_USER,

  SET_USER,
  SET_WHITE_BOARD_ROOM,
  RESET_APP_STATE,

  SET_REGION_CODE,
  SET_REGION_NAME,
} from '../actions/app';

import { REGION_MAP } from '../config';

export type AppStateType = {
  messages: Array<Object>,
  room: string,
  user: User,
  users: Array<User>,
  whiteBoardRoom: WhiteBoardRoom,
  regionCode: number,
  regionName: string,
};

export type Role = 0 | 1;  // 0: teacher; 1 student;

export type User = {
  id: string,       // user id
  name: string,     // user name
  role: Role,
  isMicOn: boolean,
  isCameraOn: boolean,
};

export type WhiteBoardRoom = {
  uuid: string,
  roomToken: string,
};

const initialState: AppStateType = {
  messages: [],
  room: '',
  users: [],
  user: { id: '', name: '', role: 0, isMicOn: true, isCameraOn: true },
  whiteBoardRoom: { uuid: '', roomToken: '' },
  regionCode: REGION_MAP[0].code,
  regionName: REGION_MAP[0].name,
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

    case SET_OTHER_USER_LIST: {
      const { users } = action;
      return {
        ...state,
        users: users,
      };
    }

    case REMOVE_ONE_OTHER_USER: {
      const { id } = action;
      const { users } = state;
      const result = users.filter((item) => item.id !== id);
      return {
        ...state,
        users: result,
      };
    }

    case ADD_ONE_OTHER_USER: {
      const { user } = action;
      const { users } = state;
      return {
        ...state,
        users: [...users, user],
      };
    }

    case UPDATE_ONE_OTHER_USER: {
      const { user } = action;
      const { users } = state;
      const index = users.findIndex((u) => u.id === user.id);
      users.splice(index, 1, user);
      return {
        ...state,
        users: [...users],
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

    case SET_REGION_CODE: {
      const { code } = action;
      return {
        ...state,
        regionCode: code,
      };
    }

    case SET_REGION_NAME: {
      const { name } = action;
      return {
        ...state,
        regionName: name,
      };
    }

    default: {
      return state;
    }
  }
}
