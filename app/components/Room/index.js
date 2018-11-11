/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-11 14:16:32
 *
 */
import * as React from 'react'
import { Button, Spin, Input, message } from 'antd';
import TitleBar from '../commons/TitleBar';
import styles from './style.scss';
import Client from '../../utils/client';
import MessageList from './MessageList';
import MessageText from './MessageText';
import ChatBottom from './ChatBottom';

import avatar from '../../assets/images/avatar.png';


class Room extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isRecording: false, // 是否正在录屏
      fakeList: [
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 1 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 2 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 3 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 4 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 5 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 6 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: false, messageId: 7 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: false, messageId: 8 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: false, messageId: 9 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 10 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 11 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: false, messageId: 12 },
        { nickname: 'Random', avatar: avatar, content: '我是休息休息', isFromMe: true, messageId: 13 },
      ]
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

  renderListItem = ({ item }) => {
    return (
      <MessageText
        key={item.messageId}
        avatar={item.avatar}
        nickname={item.nickname}
        content={item.content}
        isFromMe={item.isFromMe}
      />
    );
  }

  _keyExtractor = ({ item }) => {
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
                <MessageList
                  className={styles.im_list}
                  data={this.state.fakeList}
                  renderItem={this.renderListItem}
                />
                <ChatBottom />
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }
}

export default Room;
