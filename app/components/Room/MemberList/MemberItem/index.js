/*
 * @Author: fan.li
 * @Date: 2019-01-20 14:10:55
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-20 16:40:15
 *
 * @flow
 *
 * MemberListItem 用户列表中的项目
 */

import * as React from 'react';
import * as Icon from 'react-feather';

import styles from './style.scss';
import type { User, Role } from '../../../../reducers/app';
import Avatar from '../Avatar';
import AvatarImg from '../../../../assets/images/avatar.png';


type Props = {
  name: string,
  role: Role,
  isMicOn: boolean,
  isCameraOn: boolean,
  isMyself: booleam,
};

export default function MemberItem(props: Props) {
  const { name, role, isMicOn, isCameraOn, isMyself } = props;

  console.log(isMyself, name);
  const isPresenter = role === 0;
  const presenterText = isPresenter ? '主持人' : '' ;
  const myselfText = isMyself ? '我' : '';
  const label = `(${myselfText} ${presenterText})`;

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Avatar title={name} src={AvatarImg} />
        <span className={styles.label}>{name}</span>
        {isMyself || isPresenter && (
          <span>{label}</span>
        )}
      </div>

      <div className={styles.right}>
        {isMicOn ? (
          <Icon.Mic size={20} className={styles.icon} />
        ) : (
          <Icon.MicOff size={20} className={styles.icon} />
        )
        }

        {isCameraOn ? (
          <Icon.Video size={20} className={styles.icon} />
        ) : (
          <Icon.VideoOff size={20} className={styles.icon} />
        )
        }
      </div>

    </div>
  );
}
