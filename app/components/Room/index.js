/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-18 10:27:51
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

import type { User } from '../../reducers/app';

type Props = {
  history: { push: Function },
};

type State = {
  isRecording: boolean,
};


class Room extends React.Component<Props, State> {
  constructor(props) {
    super(props)

    this.$client = YIMClient.getInstance();
  }

  componentDidMount() {
    this.$client.$video.startCapture();
    this.pollingTask = setInterval(this.doupdate, 50);
  }

  componentWillUnmount() {
    if (this.pollingTask) {
      clearInterval(this.pollingTask);
    }
  }

  // 更新视频画面
  doupdate = () => {
    const { users } = this.props;
    users.forEach((user) => {
      this.$client.$video.updateCanvas(user.name, `canvas-${user.name}`);
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
    const { messages, nickname, users } = this.props;
    const index = users.findIndex((u) => u.role === 0);
    const teacherName = index !== -1 ? users[index].name : '';
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
                  <canvas className={styles.content_header_item} id={`canvas-${s.name}`} key={s.name}>
                    <Spin className={styles.spin} size="small" />
                  </canvas>
                );
              })
            }
          </section>

          <section className={styles.content_main}>
            <div className={styles.content_main_left}>
              画板
            </div>

            <div className={styles.content_main_right}>
              <canvas id={`canvas-${teacherName}`} className={styles.video}>
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
  const { messages, room, nickname, users, role  } = app;
  return { messages, room, nickname, users, role };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addOneMessage: bindActionCreators(actions.addOneMessage, dispatch),
    updateOneMessage: bindActionCreators(actions.updateOneMessage, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);
