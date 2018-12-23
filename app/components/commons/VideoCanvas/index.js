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

type Props = {
  id: string,
  className?: string,
  name: string,
  isMicOn?: boolean,
  isCameraOn?: boolean,
  onMicPress?: () => void,
  onCameraPress?: () => void
};

export default function VideoCanvas(props: Props) {
  const {
    className,
    id,
    isMicOn,
    isCameraOn,
    name,
    onMicPress,
    onCameraPress
  } = props;

  return (
    <div className={[styles.container, className].join(" ")}>
      <canvas id={id} className={styles.canvas} />

      <div className={styles.status_bar}>
        <span className={styles.name}>{name}</span>
        <span onClick={onMicPress} className={styles.op_icon}>
          {isMicOn ? <Icon.Mic size={20} /> : <Icon.MicOff size={20} />}
        </span>

        <span onClick={onCameraPress} className={styles.op_icon}>
          {isCameraOn ? <Icon.Camera size={20} /> : <Icon.CameraOff size={20} /> }
        </span>
      </div>
    </div>
  );
}

VideoCanvas.defaultProps = {
  className: "",
  isMicOn: true,
  isCameraOn: true,
  onMicPress: f => f,
  onCameraPress: f => f
};
