/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-07 17:23:56
 *
 * @flow
 *
 */

import * as React from 'react'
import { Button, Spin, message, Tooltip } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as Icon from 'react-feather';
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

import VideoCanvas from '../commons/VideoCanvas';
import WhiteBoardPanel from './WhiteBoardPanel';

import type { User, WhiteBoardRoom } from '../../reducers/app';

type PanelRole = 0 | 1;  // 0 - whiteboard, 1 - screen share

type Props = {
  history: { push: Function },
};

type State = {
  isWhiteBoardLoading: boolean,
  zoomScale: number,
  borderRoom: object | null,
  currentPanelRole: PanelRole,
};


class Room extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      isWhiteBoardLoading: false,  // is whiteboard is init ?
      boardRoom: null,             // whiteboard room instance
      zoomScale: 1,                // whiteboard zoom scale
      currentPanelRole: 0,         // current main panel's role
    };

    this.whiteBoardSDK = new WhiteWebSdk();   // whiteboard sdk instance
    this.messageList = null;       // MessageList ref
  }

  componentDidMount() {
    const { user } = this.props;
    const { role } = user;
    if (role === 0) { // teacher create a whiteboard room
      this.createWhiteBoardRoom();
    } else { // student join a whiteboard room
      this.joinWhiteBoardRoom();
    }
    YIMClient.instance.$video.startCapture();
    this.pollingTask = setInterval(this.doupdate, 50);  // update video
  }

  componentDidUpdate() {
    if (this.messageList) {
      this.messageList.scrollToBottom();
    }
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

  /**
   * teacher use this function to create a whiteboard room
   *
   * @memberof Room
   */
  createWhiteBoardRoom = async () => {
    try {
      const { room, setWhiteBoardRoom } = this.props;
      this.setState({ isWhiteBoardLoading: true });
      const res = await this._createWhiteBoardRoom(WHITEBOARD_TOKEN, room, MAX_NUMBER_MEMBER_IN_ROOM);
      const { data } = res;
      const { code, msg } = data;
      if (code !== 200) {
        return message.error('create whiteboard room error!, please close app and try agian!');
      }

      const boardRoom = await this.whiteBoardSDK.joinRoom({
        uuid: msg.room.uuid,
        roomToken: msg.roomToken,
      }, {
        onRoomStateChanged: this.onWhiteBoardStateChange,
      });
      boardRoom.setViewMode('broadcaster');
      const whiteBoardRoom: WhiteBoardRoom = {
        uuid: msg.room.uuid,
        roomToken: msg.roomToken,
      };

      // set uuid and roomToken into redux store
      // uuid and roomToken will send to student when connected
      setWhiteBoardRoom(whiteBoardRoom);
      this.setState({ boardRoom: boardRoom });
    } catch(err) {
      message.error('create whiteboard room error!, please close app and try agian!');
    } finally {
      this.setState({ isWhiteBoardLoading: false });
    }
  }

  /**
   * student use this function to join a whiteboard room,
   *
   * @memberof Room
   */
  joinWhiteBoardRoom = async () => {
    try {
      this.setState({ isWhiteBoardLoading: true });
      // whiteBoardRoom contain `uuid` and `roomToken` which is receive from teacher's client
      const { whiteBoardRoom } = this.props;
      const { uuid, roomToken } = whiteBoardRoom;
      const boardRoom = await this.whiteBoardSDK.joinRoom({
         uuid, roomToken,
      }, {
        onRoomStateChanged: this.onWhiteBoardStateChange,
      });
      boardRoom.setViewMode('follower');
      this.setState({ boardRoom });
    } catch(err) {
      message.error('join whiteboard room error!, please close app and try agian!');
    } finally {
      this.setState({ isWhiteBoardLoading: false });
    }
  }

  // update all video frames
  doupdate = () => {
    const { users, user } = this.props;
    users.forEach((user) => {  // update other video
      YIMClient.instance.$video.updateCanvas(user.id, `canvas-${user.id}`);
    });
    // update myself video
    YIMClient.instance.$video.updateCanvas(user.id, `canvas-${user.id}`);
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

  _keyExtractor = (item) => item.messageId;

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

  onWhiteBoardStateChange = (state) => {
    const { memberState, zoomScale } = state;
    if (zoomScale) {
      this.setState({ zoomScale: zoomScale });
    }
  }

  handleZoomScaleDecreasePress = () => {
    const { zoomScale, boardRoom } = this.state;
    if (boardRoom && zoomScale >= 0.01) {
      boardRoom.zoomChange(zoomScale - 0.01);
    }
  }

  handleZoomScaleIncreasePress = () => {
    const { zoomScale, boardRoom } = this.state;
    if (boardRoom) {
      boardRoom.zoomChange(zoomScale + 0.01);
    }
  }

  handleMicBtnPress = (u: User) => {
    const { user: me, setUser } = this.props;
    const { id, isMicOn} = me;
    if (u.id !== id) {
      return message.info('you can not operate other microphone!');
    }
    YIMClient.instance.setMicrophoneMute(isMicOn).then(() => {
      message.info('change microphone status success!');
      const tempUser = Object.assign({}, me, { isMicOn: !isMicOn });
      setUser(tempUser);
    }).catch((code) => {
      message.error(`change microphone status fail!, code=${code}`);
    });
  }

  handleCameraBtnPress = (u: User) => {
    const { user: me, setUser } = this.props;
    const { id, isCameraOn } = me;
    if (u.id !== id) {
      return message.info('you can not operate other camera!');
    }
    YIMClient.instance.setCameraOpen(!isCameraOn).then(() => {
      message.info('change camera status success!');
      const tempUser = Object.assign({}, me, { isCameraOn: !isCameraOn });
      setUser(tempUser);
    }).catch((code) => {
      message.error(`change camera status fail!, code=${code}`);
    });
  }


  render() {
    const { messages, nickname, users, room, user } = this.props;
    const {
      isWhiteBoardLoading,
      boardRoom,
      zoomScale,
      currentPanelRole,
    } = this.state;

    const teacher = users.find(u => u.role == 0) || user;
    const otherStudents = users.filter((u) => u.role === 1);

    return (
      <div className={styles.container}>
        <TitleBar>
          <div className={styles.info_bar}>
            <span className={styles.info_bar_item}>
              房间名称: {room}
            </span>
            <span className={styles.info_bar_item}>
              成员人数: {users.length + 1}
            </span>
          </div>
          <Button
            ghost
            icon="logout"
            onClick={this.handleStopBtn}
            className={styles.menu_btn}
          />
        </TitleBar>

        <main className={styles.content}>
          <section className={styles.content_header}>
            {/* myself video */}

            {user.role !== 0 && (
              <VideoCanvas
                id={`canvas-${user.id}`}
                user={user}
                className={styles.content_header_item}
                onCameraPress={this.handleCameraBtnPress}
                onMicPress={this.handleMicBtnPress}
              />
            )}

            {/* other student */}

            {otherStudents.map((s) => {
              return (
                <VideoCanvas
                  id={`canvas-${s.id}`}
                  user={s}
                  className={styles.content_header_item}
                  onCameraPress={this.handleCameraBtnPress}
                  onMicPress={this.handleMicBtnPress}
                />
              );
            })}
          </section>

          <section className={styles.content_main}>
            <div className={styles.content_main_left}>
              {currentPanelRole === 0 && !!boardRoom && (
                <WhiteBoardPanel
                  boardRoom={boardRoom}
                  zoomScale={zoomScale}
                  onZoomScaleDecrease={this.handleZoomScaleDecreasePress}
                  onZoomScaleIncrease={this.handleZoomScaleIncreasePress}
                />
              )}

              {currentPanelRole === 1 && (
                <div>
                  这里是录屏显示...
                </div>
              )}
            </div>

            <div className={styles.content_main_right}>
              <VideoCanvas
                id={`canvas-${teacher.id}`}
                className={styles.video}
                user={teacher}
                onCameraPress={this.handleCameraBtnPress}
                onMicPress={this.handleMicBtnPress}
              />

              <div className={styles.im}>
                <MessageList
                  ref={o => this.messageList = o}
                  className={styles.im_list}
                  data={messages}
                  renderItem={this.renderListItem}
                  keyExtractor={this._keyExtractor}
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
  const { messages, room, users, user, whiteBoardRoom } = app;

  return {
    messages,
    room,
    users,
    user,
    whiteBoardRoom,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addOneMessage: bindActionCreators(actions.addOneMessage, dispatch),
    updateOneMessage: bindActionCreators(actions.updateOneMessage, dispatch),
    setWhiteBoardRoom: bindActionCreators(actions.setWhiteBoardRoom, dispatch),
    setUser: bindActionCreators(actions.setUser, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);
