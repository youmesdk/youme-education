/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-28 22:05:05
 *
 * @flow
 *
 */

import * as React from 'react'
import { Button, Spin, message, Tooltip, Switch } from 'antd';
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
import ScreenBoardPanel from './ScreenRecordPanel';
import DocPanel from './DocPanel';

import type { User, WhiteBoardRoom } from '../../reducers/app';


type Props = {
  history: { push: Function },
};

type State = {
  isWhiteBoardLoading: boolean,     // is whiteboard loading?
  isScreenRecording: boolean,       // is screen recording?
  zoomScale: number,                // whiteboard canvas zoom scale
  boardRoom: object | null,         // whiteboard room params
};


class Room extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      isWhiteBoardLoading: false,
      isScreenRecording: false,
      boardRoom: null,
      zoomScale: 1.0,
    };

    this.whiteBoardSDK = new WhiteWebSdk();   // whiteboard sdk instance
    this.messageList = null;                  // MessageList ref
  }

  componentDidMount() {
    const { user } = this.props;
    const { role } = user;

    if (role === 0) { // teacher create a whiteboard room
      this.createWhiteBoardRoom();
    } else { // student join a whiteboard room
      this.joinWhiteBoardRoom();
    }

    this.joinRTCRoom();
  }

  componentDidUpdate() {
    if (this.messageList) {
      this.messageList.scrollToBottom();
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

  // teacher use this function to create a whiteboard room
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

  // student use this function to join a whiteboard room,
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

  joinRTCRoom = async () => {
    const { room } = this.props;
    await YIMClient.instance.$ymrtc.joinRoom(room).catch((err) => {
      message.error('Join video chat room fail!, please close app and try again!' + JSON.stringify(err));
    });

    const status = YIMClient.instance.$ymrtc.getLocalMediaStatus();
    if (status === 'stop' || status === 'failed') {
      await YIMClient.instance.$ymrtc.startLocalMedia({ video: 'stdres' }).catch((err) => {
        if (err.name === 'NotAllowedError') {
          message.error('Access Error, Your should allow app use camera!');
        } else if (err.name === 'NotFoundError') {
          message.error('Not find camera or microphone de, make sure your devices is working');
        } else {
          message.error(err.name);
        }
      });
    }
  }

  handleStopBtn = () => {
    const { history } = this.props;
    YIMClient.instance.logout(); // logout
    history.push('/');
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
    const { user: me } = this.props;
    if (me.role !== 0) {
      return message.info('only teacher can operate!');
    }
    YIMClient.instance.setMicrophoneMute(u.id, !u.isMicOn);
  }

  handleCameraBtnPress = (u: User) => {
    const { user: me } = this.props;
    if (me.role !== 0) {
      return message.info('only teacher can operate!');
    }
    YIMClient.instance.setCameraOpen(u.id, !u.isCameraOn)
  }

  handlePanelRoleChange = (role: number) => {
    const { setPanelRole } = this.props;
    setPanelRole(role);
  }

  handleScreenRecordSwitchChange = (checked: boolean) => {
    if (checked) {  // need start
      const { room } = this.props;
      setTimeout(() => {
        const cmd = { cmd: 5 };
        YIMClient.instance.signing(room, 2, cmd);
      }, 2500); // delay some time to send sigin to students

      this.setState({ isScreenRecording: true });
      const pushStreamUrl = YIMClient.getPushStreamUrl(room);
      YIMClient.instance.$screen.start(pushStreamUrl, (code) => {
        if (code === 0) {
          message.success('Stop share screen success');
        } else {
          message.error('Screen share exit with error!');
        }
        this.setState({ isScreenRecording: false });
        const cmd = { cmd: 4 };
        YIMClient.instance.signing(room, 2, cmd);
      });
    } else {  // need stop
      YIMClient.instance.$screen.stop();
      this.setState({ isScreenRecording: false });
    }
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

  render() {
    const {
      messages,
      nickname,
      users,
      room,
      user,
      panelRole,
    } = this.props;

    const {
      isWhiteBoardLoading,
      isScreenRecording,
      boardRoom,
      zoomScale,
    } = this.state;

    const teacher = users.find(u => u.role == 0) || user;
    const isTeacherIsMySelf = teacher.id === user.id;
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
                isMySelf={true}
                className={styles.content_header_item}
                onCameraPress={this.handleCameraBtnPress}
                onMicPress={this.handleMicBtnPress}
              />
            )}

            {/* other student */}
            {otherStudents.map((s) => {
              return (
                <VideoCanvas
                  key={s.id}
                  id={`canvas-${s.id}`}
                  user={s}
                  isMySelf={false}
                  className={styles.content_header_item}
                  onCameraPress={this.handleCameraBtnPress}
                  onMicPress={this.handleMicBtnPress}
                />
              );
            })}
          </section>

          {/* 切换面板角色 */}
          <section className={styles.content_menus}>
            <div
              onClick={() => this.handlePanelRoleChange(0)}
              className={[
                  styles.content_menus_item,
                  panelRole === 0 ? styles.content_menus_active : '',
                ].join(' ')}
            >
              WhiteBoard
            </div>
            <span className={styles.content_menus_divider}>/</span>

            {/* only student can go to share screen */}
            {user && user.role == 1 && (
              <div
                onClick={() => this.handlePanelRoleChange(1)}
                className={[
                    styles.content_menus_item,
                    panelRole === 1 ? styles.content_menus_active : '',
                  ].join(' ')}
                >
                  Screen share
              </div>
            )}

            <span className={styles.content_menus_divider}>/</span>

            <div
              onClick={() => this.handlePanelRoleChange(2)}
              className={[
                styles.content_menus_item,
                panelRole === 2 ? styles.content_menus_active : '',
              ].join(' ')}
            >
              File Share
            </div>

            {/* only teacher can share screen */}
            {user && user.role === 0 && (
              <Switch
                className={styles.content_menus_switch}
                loading={false}
                checkedChildren="Stop share screen"
                unCheckedChildren="Start share screen"
                checked={isScreenRecording}
                defaultChecked={false}
                onChange={this.handleScreenRecordSwitchChange}
              />
            )}
          </section>

          <section className={styles.content_main}>
            <div className={styles.content_main_left}>
              {panelRole === 0 && !!boardRoom && (
                <WhiteBoardPanel
                  boardRoom={boardRoom}
                  zoomScale={zoomScale}
                  onZoomScaleDecrease={this.handleZoomScaleDecreasePress}
                  onZoomScaleIncrease={this.handleZoomScaleIncreasePress}
                />
              )}

              {panelRole === 1 && (
                <ScreenBoardPanel roomId={room} />
              )}

              {panelRole === 2 && (
                <DocPanel />
              )}
            </div>

            <div className={styles.content_main_right}>
              <VideoCanvas
                id={`canvas-${teacher.id}`}
                className={styles.video}
                user={teacher}
                isMySelf={isTeacherIsMySelf}
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
  const { messages, room, users, user, whiteBoardRoom, panelRole } = app;

  return {
    messages,
    room,
    users,
    user,
    whiteBoardRoom,
    panelRole,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addOneMessage: bindActionCreators(actions.addOneMessage, dispatch),
    updateOneMessage: bindActionCreators(actions.updateOneMessage, dispatch),
    setWhiteBoardRoom: bindActionCreators(actions.setWhiteBoardRoom, dispatch),
    setUser: bindActionCreators(actions.setUser, dispatch),
    setPanelRole: bindActionCreators(actions.setPanelRole, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);
