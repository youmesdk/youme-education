/*
 * @Author: fan.li
 * @Date: 2018-11-11 13:50:53
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-17 15:01:45
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
  text: string,
};

export default class ChatBottom extends React.Component<Props, State> {
  static defaultProps = {
    onSendText: f => f,
  };

  state = {
    text: '',
  };

  handleTextChange = (e: any) => {
    this.setState({ text: e.target.value });
  }

  handleSendBtnClick = () => {
    const { text } = this.state;
    const { onSendText } = this.props;
    this.setState({ text: '' });
    onSendText(text);
  }

  render () {
    const { text } = this.state;
    return (
      <div className={styles.container}>
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
    );
  }
}
