/*
 * @Author: fan.li
 * @Date: 2018-12-19 19:53:29
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-19 20:33:57
 *
 * @flow
 *
 * 白板调整/显示尺寸的工具
 */

import * as React from 'react';
import * as Icon from 'react-feather';

import styles from './style.scss';

type Props = {
  className?: string,
  scale?: number,
  onIncreasePress?: () => void,
  onDecreasePress?: () => void,
};

export default function WhiteBoardScaler(props: Props) {
  const { className, scale, onIncreasePress, onDecreasePress } = props;

  return (
    <div className={[styles.container, className].join(' ')}>
      <span className={styles.text}>{`${parseInt(scale * 100, 10)}%`}</span>

      <span className={styles.icon} onClick={onIncreasePress}>
        <Icon.Plus size={12} />
      </span>

      <span className={styles.icon} onClick={onDecreasePress}>
        <Icon.Minus size={12} />
      </span>
    </div>
  );
}

WhiteBoardScaler.defaultProps = {
  className: '',
  scale: 1,
  onIncreasePress: f => f,
  onDecreasePress: f => f,
};
