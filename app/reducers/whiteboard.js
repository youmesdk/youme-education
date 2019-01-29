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
  SET_TOTAL_PAGES,
  SET_CURRENT_PAGE,
} from '../actions/whiteboard';

export type WhiteBoardRoom = {
  uuid: string,
  roomToken: string,
};

export type WhiteBoardStateType = {

};

// const initialState:
