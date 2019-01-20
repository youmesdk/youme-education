/*
 * @Author: fan.li
 * @Date: 2018-07-27 11:13:13
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-16 15:47:12
 *
 * @flow
 */

import * as React from 'react';
import { Button, Modal } from 'antd';
import YIMClient from '../../../utils/client';

import styles from './style.scss';

const { confirm } = Modal;
const { ipcRenderer, shell } = require('electron');

type Props = {
  children?: React.Node
};

type State = {
  isFullScreen: boolean
};

class TitleBar extends React.Component<Props, State> {
  props: Props
  static defaultProps = {
    children: null
  }
  state = {
    isFullScreen: false,
    isInfoModalShow: false,
  }

  handleMax = () => {
    if (this.state.isFullScreen) {
      ipcRenderer.send('restore-window')
      this.setState({
        isFullScreen: !this.state.isFullScreen
      })
    } else {
      ipcRenderer.send('max-window')
      this.setState({
        isFullScreen: !this.state.isFullScreen
      })
    }
  }

  handleClose = () => {
    confirm({
      title: '确定要退出应用吗?',
      content: '',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        YIMClient.instance.logout();
        ipcRenderer.send('close-window')
      }
    })
  }

  handleMin = () => {
    ipcRenderer.send('hide-window');
  }

  showInfoModal = () => {
    this.setState({ isInfoModalShow: true });
  }

  hideInfoModal = () => {
    this.setState({ isInfoModalShow: false });
  }

  openHomePage = (e) => {
    e.preventDefault();
    shell.openExternal('https://youme.im/');
  }

  render() {
    const { isFullScreen, isInfoModalShow } = this.state;

    // max/shrink button
    const btnIcon = isFullScreen ? 'shrink' : 'arrows-alt';

    return (
      <div className={styles['btn-group']}>
        {this.props && this.props.children}
        <Button
          className={styles.btn}
          ghost
          icon="question-circle"
          onClick={this.showInfoModal}
        />
        <Button
          className={styles.btn}
          ghost
          icon="minus"
          onClick={this.handleMin}
        />
        <Button
          className={styles.btn}
          ghost
          icon={btnIcon}
          onClick={this.handleMax}
        />
        <Button
          className={styles.btn}
          ghost
          icon="close"
          onClick={this.handleClose}
        />

        {/* info modal */}
        <Modal
          title="About"
          visible={isInfoModalShow}
          onOk={this.hideInfoModal}
          onCancel={this.hideInfoModal}
        >
          <span>
            游密通讯云 for education demo, 涵盖IM、实时视频、实时白板功能。官网：
            <a onClick={this.openHomePage}>https://www.youme.im/</a>
          </span>
        </Modal>
      </div>
    )
  }
}

export default TitleBar;
