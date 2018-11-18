/*
 * @Author: fan.li
 * @Date: 2018-11-11 15:04:27
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-18 17:21:28
 *
 * @flow
 *
 */

import {
  PUSH_MESSAGE,
  DELETE_MESSAGE,
  UPDATE_MESSAGE,
  REMOVE_ALL_MESSAGE,
  SET_ROOM,
  SET_NICKNAME
} from '../actions/app';

const initialState = {
  messages: [],
  room: '',
  nickname: '',
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

    // delete one exist message by message's id
    case DELETE_MESSAGE: {
      break;
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

    // remove all message
    case REMOVE_ALL_MESSAGE: {
      break;
    }

    // set current room's name
    case SET_ROOM: {
      return {
        ...state,
        room: action.room
      };
    }

    // set current user's name
    case SET_NICKNAME: {
      return {
        ...state,
        nickname: action.nickname
      };
    }
    default: {
      return state;
    }
  }
}
