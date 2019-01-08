/*
 * @Author: fan.li
 * @Date: 2019-01-07 16:01:26
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-08 11:40:21
 *
 * @flow
 *
 * 录屏展示面板
 */

import * as React from 'react';
import { Switch, Icon } from 'antd';
import videojs from 'video.js';


import styles from './style.scss';

type Props = {
};

type State = {
};

export default class ScreenRecordPanel extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    this.fakeUrl = 'http://pili-live-rtmp.youme.im/youmetest/953853.m3u8';
    this.player = null;
  }

  componentDidMount() {
    this.initVideoPlayer();
  }

  componentWillUnmount() {
    this.player.dispose();
  }

  initVideoPlayer = () => {
    const options = {
      bigPlayButton: false,
      textTrackDisplay: false,
      controBar: true,
      errorDisplay: false,
      posterImage: false,
    };

    const self = this;
    this.player = videojs('video-player', options, function() {
      // 'this' is videojs

      this.on('loadedmetadata', () => {
        // 加载元数据后开始播放视频
        self.startVideo();
      });

      this.on('ended', () => {
        console.log('ended');
      });

      this.on('firstplay', () => {
        console.log('firstplay');
      });

      this.on('loadstart', () => {
        // 开始加载
        console.log('loadstart');
      });
    });
  }

  startVideo = () => {
    if (!this.player) {
      return;
    }
    this.player.play();
  }

  render() {
    const { isRecordStatusLoading } = this.props;

    return (
      <div className={styles.container}>
        <video
          id="video-player"
          className={["video-js", styles.video].join(' ')}
          controls
          preload="auto"
          data-setup="{}"
          autoPlay
        >
          <source src={this.fakeUrl} type="application/x-mpegURL" />
        </video>
      </div>
    );
  }
}
