/*
 * @Author: fan.li
 * @Date: 2018-10-22 11:20:07
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-22 11:26:40
 *
 * 消息列表
 */

import * as React from 'react';
import styles from './style.scss';
import avatar from '../../../assets/images/avatar.png';

export default class MessageList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [
        { msgId: '1', isFromMe: true, msgType: 'voice', content: '这是一条语音消息', time: Date.now() },
        { msgId: '2', isFromMe: false, msgType: 'text', content: '这是一条文本消息', time: Date.now() },
        { msgId: '3', isFromMe: true, msgType: 'voice', content: '这是一条语音消息', time: Date.now() },
        { msgId: '4', isFromMe: false, msgType: 'text', content: '这是一条文本消息', time: Date.now() },
        { msgId: '5', isFromMe: true, msgType: 'text', content: '这是一条文本消息', time: Date.now() },
        { msgId: '6', isFromMe: true, msgType: 'text', content: '这是一条文本消息', time: Date.now() },
        { msgId: '7', isFromMe: true, msgType: 'text', content: '这是一条文本消息', time: Date.now() },
        { msgId: '8', isFromMe: false, msgType: 'text', content: '这是一条文本消息', time: Date.now() },
      ]
    };
  }

  renderMessage = (msg) => {
    if (msg.msgType === 'voice') {
      return this._renderVoiceMessage(msg);
    }
    if (msg.msgType === 'text') {
      return this._renderTextMessage(msg);
    }
    return null;
  }

  _renderTextMessage = (msg) => {
    const isFromMe = msg.isFromMe;
    const isFromMeStyle = isFromMe ? styles.align_right: null;

    return (
      <div
        className={[styles.msg, styles.text, isFromMeStyle]}
        key={msg.msgId}
      >
        <img src={avatar} className={styles.avatar} />
      </div>
    );
  }

  _renderVoiceMessage = (msg) => {
    const isFromMe = msg.isFromMe;

    return (
      <div
        className={[styles.msg, styles.voice]}
        key={msg.msgId}
      >
        {msg.content}
      </div>
    );
  }

  render() {
    const { messages } = this.state;
    return (
      <div className={styles.container}>
      {
        messages.map(item => {
          return this.renderMessage(item);
        })
      }
      </div>
    );
  }
}
