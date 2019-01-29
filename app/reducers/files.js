/*
 * @Author: fan.li
 * @Date: 2019-01-29 11:56:29
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 15:29:31
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
  fileList: [],
};


export default (state = initialState, action: { type: string, [key]: any }) => {

  switch(action.type) {

    case SET_FILES: {
      const { files } = action;
      return {
        ...state,
        fileList: files,
      };
    }

    case CLEAN_ALL_FILES: {
      return {
        ...state,
        fileList: [],
      };
    }

    case ADD_ONE_FILE: {
      const { file } = action;
      return {
        ...state,
        fileList: [...fileList, file]
      };
    }

    case REMOVE_ONE_FILE: {
      return {
        ...state,
      };
    };

    default: {
      return state;
    }

  }
}
