/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-22 11:25:54
 *
 */
import * as React from 'react'
import { Button, Spin, Input, message } from 'antd';
import TitleBar from '../commons/TitleBar';
import styles from './style.scss';
import Client from '../../utils/client';
import MessageList from './Message';


class Room extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isRecording: false // 是否正在录屏
    }
    this.interval = 50 * 1;
    this.pollingTask = null;

    this.$client = Client.getInstance();
    this.$client.$video.setVideoLocalResolution(320, 240);
    this.$client.$video.setVideoNetResolution(320, 240);
    this.$client.$video.setVideoCallback("");
    this.$client.$video.setAutoSendStatus(true);
    this.$client.$video.setVolume(100);
    this.$client.$video.startCapture();
    if (this.pollingTask) {
      clearInterval(this.pollingTask);
    }
    this.pollingTask = setInterval(this.doupdate, this.interval);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    if (this.pollingTask) {
      clearInterval(this.pollingTask);
    }
  }

  // 更新视频画面
  doupdate = () => {
  }

  bindEvents = () => {
    this.$client.$video.on('YOUME_ENVENT_JOIN_OK', () => {
    });

    this.$client.$video.on('YOUME_EVENT_OTHERS_VIDEO_ON', () => {
    });

    this.$client.$video.on('YOUME_EVENT_OTHERS_VIDEO_SHUT_DOWN', () => {
    });

    this.$client.$video.on('onMemberChange', (memchange) => {
      memchange.foreach(item => {
        const userid = item.userid;
        const isJoin = item.isJoin;
        if (isJoin) {
          message.info('memberchange: ', memchange);
        }
      });
    });
  }

  handleStopBtn = () => {
    this.props.history.push('/');
  }

  startScreenRecord = () => {
  }

  stopScreenRecord = () => {
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
              {this.renderRecordBtn()}
            </div>
            <div className={styles.content_main_right}>
              <div className={styles.video}>
                <Spin className={styles.spin} size="large" />
              </div>
              <div className={styles.im}>
                <MessageList className={styles.im_list} />
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
