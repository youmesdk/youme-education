/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-18 11:38:57
 *
 * @flow
 *
 */
import * as React from 'react'
import { Button, Spin, message } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import TitleBar from '../commons/TitleBar';
import styles from './style.scss';
import MessageList from './MessageList';
import MessageText from './MessageText';
import ChatBottom from './ChatBottom';
import * as actions from '../../actions/app';
import YIMClient from '../../utils/client';
import { isEmpty } from '../../utils/utils';
import avatarIcon from '../../assets/images/avatar.png';
import videojs from 'video.js';

type Props = {
  history: { push: Function }
};


class Room extends React.Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isRecording: false, // 是否正在录屏
    }
    this.interval = 50 * 1;
    this.pollingTask = null;

    this.$client = YIMClient.getInstance();
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
    this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
      console.log('onPlayerReady', this);
    });
  }

  componentWillUnmount() {
    if (this.pollingTask) {
      clearInterval(this.pollingTask);
    }
    this.player.dispose();
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
      memchange.foreach((item) => {
        const { isJoin } = item;
        if (isJoin) {
          message.info('memberchange: ', memchange);
        }
      });
    });
  }

  handleStopBtn = () => {
    YIMClient.instance.logout(); // logout
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
    const { isRecording } = this.state;
    if (isRecording) {
      return (
        <div
          className={styles.record_dock}
          onClick={this.stopScreenRecord}
          role='btn'
        >
          结束录屏
        </div>
      );
    }

    return (
      <div className={styles.record_dock} onClick={this.startScreenRecord}>
        开始录屏
      </div>
    );
  }

  handleChatBottomSendBtnClick = (text) => {
    const { addOneMessage, updateOneMessage, room, nickname } = this.props;

    if (isEmpty(text)) {
      return;
    }
    const msg = {
      messageId: Date.now(),
      nickname: nickname,
      avatar: avatarIcon,
      content: text,
      isFromMe: true,
      status: 0 // 0 sending， 1 success， 2 fail
    };

    // add msg into redux
    addOneMessage(msg);
    YIMClient.instance.sendTextMessage(room, 2, text).then(() => {
      // update message status to success;
      msg.status = 1;
      updateOneMessage(msg);
    }).catch((err) => {
      // update message status to fail;
      msg.status = 2;
      updateOneMessage(msg);
    });
  }

  render() {
    const { messages } = this.props;

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
              <div data-vjs-player>
                <video ref={(node) => this.videoNode = node} className="video-js"></video>
              </div>
              {this.renderRecordBtn()}
            </div>
            <div className={styles.content_main_right}>
              <div className={styles.video}>
                <Spin className={styles.spin} size="large" />
              </div>
              <div className={styles.im}>
                <MessageList
                  className={styles.im_list}
                  data={messages}
                  renderItem={this.renderListItem}
                />
                <ChatBottom
                  onSendText={this.handleChatBottomSendBtnClick}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { messages, room, nickname } = state.app;
  return { messages, room, nickname };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addOneMessage: bindActionCreators(actions.addOneMessage, dispatch),
    updateOneMessage: bindActionCreators(actions.updateOneMessage, dispatch),
    delOneMessage: bindActionCreators(actions.delOneMessage, dispatch)
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);
