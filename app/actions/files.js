/*
 * @Author: fan.li
 * @Date: 2019-01-29 11:54:40
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 12:01:30
 *
 * @flow
 *
 * 文件管理
 */

export const SET_FILES = 'SET_FILES';
export const CLEAN_ALL_FILES = 'CLEAN_ALL_FILES';
export const ADD_ONE_FILE = 'ADD_ONE_FILE';
export const REMOVE_ONE_FILE = 'REMOVE_ONE_FILE';


export function setFiles(files: Array) {
  return {
    type: SET_FILES,
    files
  };
}

export function addOneFile(file) {
  return {
    type: ADD_ONE_FILE,
    file,
  };
}

export function removeOneFile(file) {
  return {
    type: REMOVE_ONE_FILE,
    file,
  };
}

export function cleanAllFiles() {
  return {
    type: CLEAN_ALL_FILES,
  };
}


