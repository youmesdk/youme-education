/*
 * @Author: fan.li
 * @Date: 2019-01-29 11:56:29
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 14:28:32
 *
 * @flow
 *
 * 文件管理（文档管理）
 */

import {
  SET_FILES,
  CLEAN_ALL_FILES,
  ADD_ONE_FILE,
  REMOVE_ONE_FILE,
} from '../actions/files';

const initialState = {
  files: [],
};


export default (state = initialState, action: { type: string, [key]: any }) => {

  switch(action.type) {

    case SET_FILES: {
      const { files } = action;
      return {
        ...state,
        files,
      };
    }

    case CLEAN_ALL_FILES: {
      return {
        ...state,
        files: [],
      };
    }

    case
  }
}
