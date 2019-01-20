/*
 * @Author: fan.li
 * @Date: 2019-01-20 14:12:23
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-20 14:39:26
 *
 * @flow
 *
 * Avatar 成员列表中的头像
 */

import * as React from 'react';
import styles from './style.scss';

type Props = {
  src?: string,
  title: string,
};

export default function Avatar(props: Props) {
  const { title, src }  = props;

  if (src) {
    return (
      <img
        title={title}
        className={styles.avatar}
        src={src}
      />
    );
  }

  return (
    <div className={styles.textAvatar} role="avatar">
     <span className={styles.label}>
       {title.charAt(0).toUpperCase()}
     </span>
    </div>
  );
}

Avatar.defaultProps = {
  src: '',
};

