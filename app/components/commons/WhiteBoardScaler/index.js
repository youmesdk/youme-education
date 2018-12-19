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
  defaultScale?: number,
  onIncreasePress?: (scale: number) => void,
  onDecreasePress?: (scale: number) => void,
};

type State = {
};

export default class WhiteBoardScaler extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { defaultScale } = props;

    this.state = {
      scale: defaultScale,
    };
  }

  render() {
    const { className } = this.props;
    const { scale } = this.state;

    return (
      <div className={[styles.container, className].join(' ')}>
        <span>{`${scale * 100}%`}</span>

        <span className={styles.icon}>
          <Icon.Plus size={12} />
        </span>

        <span className={styles.icon}>
          <Icon.Minus size={12} />
        </span>
      </div>
    );
  }
}

WhiteBoardScaler.defaultProps = {
  className: '',
  defaultScale: 1,
  onIncreasePress: f => f,
  onDecreasePress: f => f,
};
