/*
 * @Author: fan.li
 * @Date: 2018-12-17 14:35:54
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-17 14:36:28
 *
 * @flow
 *
 * demo for redux action
 */

import type { counterStateType } from '../reducers/counter';

type actionType = {
  +type: string
};

export const INCREMENT_COUNTER = 'INCREMENT_COUNTER';
export const DECREMENT_COUNTER = 'DECREMENT_COUNTER';

export function increment() {
  return {
    type: INCREMENT_COUNTER
  };
}

export function decrement() {
  return {
    type: DECREMENT_COUNTER
  };
}

export function incrementIfOdd() {
  return (
    dispatch: (action: actionType) => void,
    getState: () => counterStateType
  ) => {
    const { counter } = getState();

    if (counter % 2 === 0) {
      return;
    }

    dispatch(increment());
  };
}

export function incrementAsync(delay: number = 1000) {
  return (dispatch: (action: actionType) => void) => {
    setTimeout(() => {
      dispatch(increment());
    }, delay);
  };
}
