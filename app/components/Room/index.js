/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-18 22:08:09
 *
 * @flow
 *
 */
import * as React from 'react'
import { Button, Spin, message } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import axios from 'axios';
import { WhiteWebSdk, RoomWhiteboard } from 'white-react-sdk';

import TitleBar from '../commons/TitleBar';
import styles from './style.scss';
import MessageList from './MessageList';
import MessageText from './MessageText';
import ChatBottom from './ChatBottom';
import * as actions from '../../actions/app';
import YIMClient, { MAX_NUMBER_MEMBER_IN_ROOM } from '../../utils/client';
import { isEmpty } from '../../utils/utils';
import avatarIcon from '../../assets/images/avatar.png';
import { WHITEBOARD_TOKEN } from '../../config';

import type { User } from '../../reducers/app';

type Props = {
  history: { push: Function },
};

type State = {
  isWhiteBoardLoading: boolean,
};

class Room extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      isWhiteBoardLoading: false,
      whiteBoardRoom: null,
    };
    this.whiteBoardSDK = new WhiteWebSdk();
  }

  componentDidMount() {
    this.joinWhiteBoardRoom();
    YIMClient.instance.$video.startCapture();
    this.pollingTask = setInterval(this.doupdate, 50);
  }

  componentWillUnmount() {
    if (this.pollingTask) {
      clearInterval(this.pollingTask);
    }
  }

  _createWhiteBoardRoom = (token, room, limit = 5) => {
    const url = `https://cloudcapiv3.herewhite.com/room?token=${token}`;
    return axios({
      url: url,
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      data: { name: room, limit },
    });
  }

  joinWhiteBoardRoom = async () => {
    try {
      const { room } = this.props;
      this.setState({ isWhiteBoardLoading: true });
      const res = await this._createWhiteBoardRoom(WHITEBOARD_TOKEN, room, MAX_NUMBER_MEMBER_IN_ROOM);
      const { data } = res;
      const { code, msg } = data;
      if (code !== 200) {
        return message.error('jon whiteboard room error!');
      }
      const whiteBoardRoom = await this.whiteBoardSDK.joinRoom({
        uuid: msg.room.uuid,
        roomToken: msg.roomToken,
      });
      this.setState({ whiteBoardRoom });
    } catch(err) {
      message.error('join whiteboard room error!');
    } finally {
      this.setState({ isWhiteBoardLoading: false });
    }
  }

  // 更新视频画面
  doupdate = () => {
    const { users } = this.props;
    users.forEach((user) => {
      YIMClient.instance.$video.updateCanvas(user.id, `canvas-${user.id}`);
    });
  }

  handleStopBtn = () => {
    const { history } = this.props;
    YIMClient.instance.logout(); // logout
    history.push('/');
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

  handleChatBottomSendBtnClick = (text) => {
    const { addOneMessage, updateOneMessage, room, user } = this.props;
    if (isEmpty(text)) {
      return;
    }

    const { name } = user;
    const msg = {
      messageId: Date.now(),
      nickname: name,
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
    const { messages, nickname, users } = this.props;
    const { isWhiteBoardLoading, whiteBoardRoom } = this.state;

    const index = users.findIndex((u) => u.role === 0);
    const teacherId = index !== -1 ? users[index].id : '';
    const students = users.filter((u) => u.role === 1);

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
            {
              students.map((s) => {
                return (
                  <canvas className={styles.content_header_item} id={`canvas-${s.id}`} key={s.id}>
                    <Spin className={styles.spin} size="small" />
                  </canvas>
                );
              })
            }
          </section>

          <section className={styles.content_main}>
            <div className={styles.content_main_left}>
              { whiteBoardRoom &&
                <RoomWhiteboard
                  style={{ flex: 1, border: '1px solid blue' }}
                  room={whiteBoardRoom}
                />
              }
              { isWhiteBoardLoading && <Spin className={styles.spin} size="large" /> }
            </div>

            <div className={styles.content_main_right}>
              <canvas id={`canvas-${teacherId}`} className={styles.video}>
                <Spin className={styles.spin} size="large" />
              </canvas>

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
  const { app } = state;
  const { messages, room, users, user } = app;
  return { messages, room, users, user };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addOneMessage: bindActionCreators(actions.addOneMessage, dispatch),
    updateOneMessage: bindActionCreators(actions.updateOneMessage, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);
