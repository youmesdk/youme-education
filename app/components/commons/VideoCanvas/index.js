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

import * as React from "react";
import * as Icon from "react-feather";

import styles from "./style.scss";
import type { User } from '../../../reducers/app';

type Props = {
  id: string,
  className?: string,
  user: User,
  onMicPress?: (user: User) => void,
  onCameraPress?: (user: User) => void,
};

export default function VideoCanvas(props: Props) {
  const { className, id, user, onMicPress, onCameraPress, } = props;
  const { name, isMicOn, isCameraOn } = user;

  const handleMicPress = (user: User) => () => {
    const { onMicPress } = props;
    onMicPress(user);
  }

  const handleCameraPress = (user: User) => () => {
    const { onCameraPress } = props;
    onCameraPress(user);
  }

  return (
    <div className={[styles.container, className].join(" ")}>
      <canvas id={id} className={styles.canvas} />

      <div className={styles.status_bar}>
        <span className={styles.name}>{name}</span>
        <span
          onClick={handleMicPress(user)}
          className={styles.op_icon}
        >
          {isMicOn ? <Icon.Mic size={20} /> : <Icon.MicOff size={20} />}
        </span>

        <span
          onClick={handleCameraPress(user)}
          className={styles.op_icon}
        >
          {isCameraOn ? <Icon.Camera size={20} /> : <Icon.CameraOff size={20} /> }
        </span>
      </div>
    </div>
  );
}

VideoCanvas.defaultProps = {
  className: "",
  onMicPress: f => f,
  onCameraPress: f => f
};
