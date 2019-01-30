/*
 * @Author: fan.li
 * @Date: 2019-01-29 15:03:50
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 15:09:15
 *
 * @flow
 *
 * 白板相关
 *
 */

import type {
  WhiteBoardRoom,
} from '../reducers/whiteboard';


export const SET_WHITE_BOARD_ROOM = 'SET_WHITE_BOARD_ROOM';
export const SET_PAGE_COUNT = 'SET_PAGE_COUNT';
export const SET_CURRENT_PAGE = 'SET_CURRENT_PAGE';
export const RESET_WHITEBOARD_STATE = 'RESET_WHITEBOARD_STATE';



export function setWhiteBoardRoom(room: WhiteBoardRoom) {
  return {
    type: SET_WHITE_BOARD_ROOM,
    whiteBoardRoom: room
  };
}

export function setPageCount(count: number) {
  return {
    type: SET_PAGE_COUNT,
    count: count,
  };
}

export function setCurrentPage(index: number) {
  return {
    type: SET_CURRENT_PAGE,
    currentPage: index,
  };
}

export function resetWhiteBoardState() {
  return {
    type: RESET_WHITEBOARD_STATE,
  };
}
