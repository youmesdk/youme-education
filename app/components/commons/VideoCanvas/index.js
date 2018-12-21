/*
 * @Author: fan.li
 * @Date: 2018-12-21 21:09:23
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-21 22:00:03
 *
 * @flow
 *
 * 视频画布
 * video component for render video stream
 */

import * as React from 'react';
import styles from './style.scss';

type Props = {
  id: string,
  className?: string,
};

export default function VideoCanvas(props: Props) {
  const { className, id, key } = props;

  return (
    <div className={[styles.container, className].join(' ')}>
      <canvas id={id} className={styles.canvas} />

      <div className={styles.status_bar}>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

VideoCanvas.defaultProps = {
  className: '',
};
