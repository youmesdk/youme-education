/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-19 21:17:36
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
import { isEmpty, throttle } from '../../utils/utils';
import avatarIcon from '../../assets/images/avatar.png';
import { WHITEBOARD_TOKEN } from '../../config';
import type { Tool } from '../commons/WhiteBoardTool';
import WhiteBoardTool from '../commons/WhiteBoardTool';
import WhiteBoardScaler from '../commons/WhiteBoardScaler';
import WhiteBoardSidePanel from '../commons/WhiteBoardSidePanel';


import type { User, WhiteBoardRoom } from '../../reducers/app';

type Props = {
  history: { push: Function },
};

type State = {
  isWhiteBoardLoading: boolean,
  isSidePanelShow: boolean,
};

class Room extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      isWhiteBoardLoading: false,
      isSidePanelShow: false,
      boardRoom: null,
    };
    this.whiteBoardSDK = new WhiteWebSdk();
    this.throttledWindowSizeChange = throttle(this.handleWindowSizeChange, 200);
    this.messageList = null;
  }

  componentDidMount() {
    const { user } = this.props;
    const { role } = user;
    if (role === 0) {
      // teacher create a whiteboard room
      this.createWhiteBoardRoom();
    } else {
      // student join a whiteboard room
      this.joinWhiteBoardRoom();
    }
    YIMClient.instance.$video.startCapture();
    this.pollingTask = setInterval(this.doupdate, 50);  // update video
    window.addEventListener('resize', this.throttledWindowSizeChange, false);
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
    window.removeEventListener('resize', this.throttledWindowSizeChange, false);
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
      const boardRoom = await this.whiteBoardSDK.joinRoom({ uuid, roomToken, });
      boardRoom.setViewMode('follower');
      this.setState({ boardRoom });
    } catch(err) {
      message.error('join whiteboard room error!, please close app and try agian!');
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

  handleWindowSizeChange = () => {
    const whiteboard = document.getElementById('whiteboard');
    const { clientWidth, clientHeight } = whiteboard;
    const { boardRoom } = this.state;
    if (boardRoom) {
      boardRoom.refreshViewSize(clientWidth, clientHeight);
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

  openWhiteBoardSidePanel = () => {
    this.setState({ isSidePanelShow: true });
  }

  closeWhiteBoardSidePanel = () => {
    this.setState({ isSidePanelShow: false });
  }

  handleWhiteBoardToolChange = (tool: Tool) => {
    const { boardRoom } = this.state;
    if (boardRoom) {
      boardRoom.setMemberState({ currentApplianceName: tool, });
    }
  }

  handleWhiteBoardColorChange = () => {
    const { boardRoom } = this.state;
    if (boardRoom) {
    }
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

  componentDidCatch(a, b) {
    console.log(`error in Room Tool: ${a}, ${b}`)
  }

  render() {
    const { messages, nickname, users } = this.props;
    const { isWhiteBoardLoading, boardRoom, isSidePanelShow } = this.state;

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
            <div className={styles.content_main_left} id='whiteboard'>
              {
                boardRoom &&
               <RoomWhiteboard
                 className={styles.whiteboard}
                 room={boardRoom}
               />
              }

              <WhiteBoardTool
                className={styles.docker}
                onToolChange={this.handleWhiteBoardToolChange}
                onColorChange={this.handleWhiteBoardColorChange}
              />

              <WhiteBoardScaler className={styles.scaler} />
              {
                isSidePanelShow &&
                <WhiteBoardSidePanel
                  className={styles.side_panel}
                  onClosePress={this.closeWhiteBoardSidePanel}
                />
              }

              <div
                className={styles.shortcut_hover}
                onClick={this.openWhiteBoardSidePanel}
              >
                <Tooltip title="快捷键说明" mouseEnterDelay={0.8}>
                  <Icon.Info size={22}/>
                </Tooltip>
              </div>
            </div>

            <div className={styles.content_main_right}>
              <canvas id={`canvas-${teacherId}`} className={styles.video}>
                <Spin className={styles.spin} size="large" />
              </canvas>

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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);
