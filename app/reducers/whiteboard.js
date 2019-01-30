/*
 * @Author: fan.li
 * @Date: 2019-01-29 15:06:46
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 15:09:10
 *
 * @flow
 *
 * 白板相关reducers
 */

import {
  SET_WHITE_BOARD_ROOM,
  SET_PAGE_COUNT,
  SET_CURRENT_PAGE,
  RESET_WHITEBOARD_STATE,
} from '../actions/whiteboard';

export type WhiteBoardRoom = {
  uuid: string,
  roomToken: string,
};

export type WhiteBoardStateType = {
  whiteBoardRoom: WhiteBoardRoom, // whiteboard params return by server
  count: number,                  // whiteboard page count
  currentPage: number,            // whiteboard current page index
};

export type ActionType = {
  type: string,
  [key]: any,
};

const initialState: WhiteBoardStateType = {
  whiteBoardRoom: { uuid: '', roomToken: '' },
  count: 1,
  currentPage: 0,
};

export default (state = initialState, action: ActionType) => {
  switch(action.type) {
    case SET_WHITE_BOARD_ROOM: {
      const { whiteBoardRoom } = action;
      return {
        ...state,
        whiteBoardRoom,
      };
    }

    case SET_PAGE_COUNT: {
      const { count } = action;
      return {
        ...state,
        count,
      };
    }

    case SET_CURRENT_PAGE: {
      const { currentPage } = action;
      return {
        ...state,
        currentPage ,
      };
    }

    case RESET_WHITEBOARD_STATE: {
      return {
        ...initialState,
      };
    }

    default: {
      return state;
    }
  }
}
