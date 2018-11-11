/*
 * @Author: fan.li
 * @Date: 2018-11-11 13:50:53
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-11 14:43:33
 *
 * 聊天输入框
 */

import * as React from 'react';
import { Input, Button } from 'antd';
import styles from './style.scss';
import chatSoundIcon from '../../../assets/images/chat_sound.png';
import chatKeyboardIcon from '../../../assets/images/chat_keyboard.png';

export default class ChatBottom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRecording: false
    };
  }

  changeRole = () => {
    const { isRecording } = this.state;
    this.setState({ isRecording: !isRecording });
  }

  renderText = () => {
    return (
      <div className={styles.inputWrap}>
        <Input className={styles.input} />
        <Button type='ghost'>send</Button>
      </div>
    );
  }

  renderVoice = () => {
    return (
      <div className={styles.inputWrap}>
        <Button block type='ghost'>Press to send voice</Button>
      </div>
    );
  }

  render () {
    const { isRecording } = this.state;
    const children = isRecording ? this.renderVoice() : this.renderText();
    return (
      <div className={styles.container}>
        <img
          className={styles.switch}
          src={isRecording ? chatKeyboardIcon : chatSoundIcon }
          onClick={this.changeRole}
        />
        { children }
      </div>
    );
  }
}
