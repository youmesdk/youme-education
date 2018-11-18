/*
 * @Author: fan.li
 * @Date: 2018-11-11 10:48:44
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-11 13:46:31
 *
 * 消息
 */

import * as React from 'react';
import styles from './style.scss';
import sendFailIcon from '../../../assets/images/msg_send_fail.png';
import sendGoingIcon from '../../../assets/images/msg_send_going.gif';

export default class Message extends React.Component {
  constructor(props) {
    super(props);
  }

  renderLeft = () => {
    const { avatar, nickname, content } = this.props;
    return (
      <div className={styles.container}>
        <img src={avatar} className={styles.avatar} />
        <div className={styles.message} style={{ marginLeft: '8px' }}>
          <span className={styles.nickname}>{nickname}</span>
          <div className={styles.contentWrap}>
            <div className={styles.content}>{content}</div>
          </div>
        </div>
      </div>
    );
  }

  renderRight = () => {
    const { avatar, nickname, content, status } = this.props;
    return (
      <div className={styles.containerRight}>
        <img src={avatar} className={styles.avatar} />
        <div className={styles.message} style={{ marginRight: '8px', alignItems: 'flex-end' }}>
          <span className={styles.nickname}>{nickname}</span>
          <div className={styles.contentWrapRight}>
            <div className={styles.contentRight}>{content}</div>
            { status === 2 &&
              <img
                src={sendFailIcon}
                className={styles.status}
                style={{ marginRight: '8px' }}
              />
            }
            {
              status === 0 &&
              <img
                src={sendGoingIcon}
                className={styles.status}
                style={{ marginRight: '8px' }}
              />
            }
          </div>
          { status === 2 &&
            <span className={styles.sendFailInfo}>
              消息发送失败
              <span className={styles.sendFailLink}>重新发送</span>
            </span>
          }
        </div>
      </div>
    );
  }

  render() {
    const { isFromMe } = this.props;
    const child = isFromMe ? this.renderRight() : this.renderLeft();
    return ( child);
  }
}
