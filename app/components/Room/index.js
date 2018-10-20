/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-19 20:03:06
 *
 */
import * as React from 'react'
import { Button, Spin, Input, message } from 'antd'
import videojs from 'video.js'
// import 'video.js/dist/video-js.css'
import TitleBar from '../commons/TitleBar'
import styles from './style.scss'

class Room extends React.Component {
  constructor(props) {
    super(props)
    // 推流地址，后期从服务端获取
    this.publishUrl = 'rtmp://pili-publish.youme.im/youmetest/953853?token=ypDnZRsbZWX_OADwfpAPc-syJNme9j_U_rg2VVAN:f9NJlmKFhSctm7AwjI52AYKnAH8=';
    // 流媒体地址
    this.playUrl = 'http://pili-live-rtmp.youme.im/youmetest/953853.m3u8';
    this.recorder = window.YoumeScreenSDK;
    this.play = null;
    this.state = {
      isRecording: false // 是否正在录屏
    }
  }

  componentDidMount() {
    const options = {
      controls: false
    };

    const videoEle = document.getElementById('screen-video');
    this.player = videojs(videoEle, options, function() {
      const { isRecording } = this.state;
      this.on('ended', () => {
        videojs.log('Awww.....over soon?!')
      });

      if (isRecording) {
        videojs.log('Videojs player is ready!');
        this.play();
      }
    })
  }

  handleStopBtn = () => {
    this.props.history.push('/');
  }

  startScreenRecord = () => {
    message.info('开始录屏', 3)
    this.setState({ isRecording: true })
    this.recorder.start(this.publishUrl, code => {
      this.setState({ isRecording: false })
      if (code === 0) {
        message.info('已成功停止录屏', 3)
      } else {
        message.error('录屏错误，请确保麦克风设备正常', 3)
      }
    })
    setTimeout(() => {
      this.player.play()
    }, 3500)
  }

  stopScreenRecord = () => {
    this.recorder.stop();
  }

  renderRecordBtn = () => {
    const isRecording = this.state.isRecording;
    if (isRecording) {
      return (
        <div className={styles.record_dock} onClick={this.stopScreenRecord}>
          结束录屏
        </div>
      );
    } else {
      return (
        <div className={styles.record_dock} onClick={this.startScreenRecord}>
          开始录屏
        </div>
      );
    }
  }

  render() {
    return (
      <div className={styles.container}>
        <TitleBar>
          <Button
            ghost
            icon="logout"
            onClick={this.handleStopBtn}
            className={styles.menu_btn}
          />
        </TitleBar>

        <main className={styles.content}>
          <section className={styles.content_header}>
            <div className={styles.content_header_item}>
              <Spin className={styles.spin} size="small" />
            </div>

            <div className={styles.content_header_item}>
              <Spin className={styles.spin} size="small" />
            </div>
          </section>

          <section className={styles.content_main}>
            <div className={styles.content_main_left}>
              <video
                id="screen-video"
                style={{flex: 1, alignSelf: 'center', background: 'transparent'}}
                className="video-js"
                preload="auto"
                autoPlay={true}
                source={this.playUrl}
                data-setup="{}"
              >
                <source source={this.playUrl} type="application/x-mpegURL" />
              </video>
              {this.renderRecordBtn()}
            </div>
            <div className={styles.content_main_right}>
              <div className={styles.video}>
                <Spin className={styles.spin} size="large" />
              </div>
              <div className={styles.im}>
                <div className={styles.im_list} />
                <div className={styles.im_send}>
                  <Input className={styles.im_send_input} />
                  <Button type="primary">发送</Button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }
}

export default Room;
