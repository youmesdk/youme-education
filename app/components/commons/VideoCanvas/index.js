/*
 * @Author: fan.li
 * @Date: 2018-12-21 21:09:23
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 20:46:35
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
  id: string,          // HTMLElement id
  className?: string,  // css class
  user: User,          // User
  isMySelf?: boolean,  // is me?
  onMicPress?: (user: User) => void,
  onCameraPress?: (user: User) => void,
};

export default function VideoCanvas(props: Props) {
  const { className, id, user, onMicPress, onCameraPress, isMySelf} = props;
  const { name, isMicOn, isCameraOn, role } = user;

  const handleMicPress = (user: User) => () => {
    const { onMicPress } = props;
    onMicPress(user);
  }

  const handleCameraPress = (user: User) => () => {
    const { onCameraPress } = props;
    onCameraPress(user);
  }

  const handleVideoElementClick = async (e) => {
    try {
      const videoDom = document.getElementById(id);
      if (!videoDom) {
        return;
      }

      if (videoDom !== document.pictureInPictureElement) {
        console.log(videoDom);
        await videoDom.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch(err) {
      console.log(err, '=======================picture in picture error');
    }
  }

  return (
    <div className={[styles.container, className].join(" ")}>
      <video
        id={id}
        autoPlay
        onClick={handleVideoElementClick}
        playsInline
        className={styles.canvas}
        muted={isMySelf}   // local video media stream should muted
      />

      <div className={styles.status_bar}>
        <span className={styles.name}>{role === 1 ? name.substring(0, 4) + '...' : name}</span>
        <span
          onClick={handleMicPress(user)}
          className={styles.op_icon}
        >
          {isMicOn ? <Icon.Mic size={20} /> : <Icon.MicOff size={20} />}
        </span>

        <span
          className={styles.op_icon}
          onClick={handleCameraPress(user)}
        >
          {isCameraOn ? (<Icon.Camera size={20} />) : (<Icon.CameraOff size={20} />)}
        </span>
      </div>
    </div>
  );
}

VideoCanvas.defaultProps = {
  className: "",
  isMySelf: false,
  onMicPress: f => f,
  onCameraPress: f => f
};
