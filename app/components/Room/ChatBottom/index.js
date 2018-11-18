/*
 * @Author: fan.li
 * @Date: 2018-11-11 13:50:53
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-18 11:48:53
 *
 * @flow
 *
 * 聊天输入框
 */

import * as React from 'react';
import { Input, Button } from 'antd';
import styles from './style.scss';
import chatSoundIcon from '../../../assets/images/chat_sound.png';
import chatKeyboardIcon from '../../../assets/images/chat_keyboard.png';

type Props = {
  onSendText?: Function,
};

type State = {
  isRecording: boolean,
  text: string,
};

export default class ChatBottom extends React.Component<Props, State> {
  state = {
    isRecording: false,
    text: '',
  };

  changeRole = () => {
    const { isRecording } = this.state;
    this.setState({ isRecording: !isRecording });
  }

  handleTextChange = (e) => {
    this.setState({ text: e.target.value });
  }

  handleSendBtnClick = () => {
    const { text } = this.state;
    this.setState({ text: '' });
    this.props.onSendText && this.props.onSendText(text);
  }

  renderText = () => {
    const { text } = this.state;
    return (
      <div className={styles.inputWrap}>
        <Input
          className={styles.input}
          value={text}
          onChange={this.handleTextChange}
          placeholder='输入文本...'
        />
        <Button
          type='ghost'
          onClick={this.handleSendBtnClick}
        >
          send
        </Button>
      </div>
    )
  }

  renderVoice = () => {
    return (
      <div className={styles.inputWrap}>
        <Button
          block
          type='ghost'
        >
          Press to send voice
        </Button>
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
