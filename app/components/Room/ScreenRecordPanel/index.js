/*
 * @Author: fan.li
 * @Date: 2019-01-07 16:01:26
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-07 21:10:51
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
  isRecordStatusLoading?: boolean,    // 当前是否正在开启/关闭 录屏
  onStartRecordClick?: () => void,    // 开始录屏被点击
  onStopRecordClick?: () => void,     // 停止录屏被点击
};

type State = {
};

export default class ScreenRecordPanel extends React.Component<Props, State> {

  static defaultProps = {
    isRecordStatusLoading: false,
    onStartRecordClick: f => f,   // noop function
    onStopRecordClick: f => f,
  };

  constructor(props) {
    super(props);
    this.fakeUrl = 'http://pili-live-rtmp.youme.im/youmetest/953853.m3u8';
    this.player = null;
  }

  componentDidMount() {
    this.initVideoPlayer();
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

  handleRecordSwitchChange = (checked: boolean) => {
    const { onStartRecordClick, onStopRecordClick } = this.props;
    if (checked) {
      onStartRecordClick();
    } else {
      onStopRecordClick();
    }
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

        {/* 开启/关闭录屏 */}

        <Switch
          className={styles.switch_wrap}
          loading={isRecordStatusLoading}
          checkedChildren="停止录屏"
          unCheckedChildren="开始录屏"
          defaultChecked={false}
          onChange={this.handleRecordSwitchChange}
        />
      </div>
    );
  }
}
