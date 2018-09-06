/*
 * @Author: fan.li
 * @Date: 2018-07-27 11:13:13
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-09-06 14:27:09
 *
 * @flow
 */

import * as React from 'react'
import { Button, Modal } from 'antd'
import styles from './style.scss'

const { confirm } = Modal
const { ipcRenderer } = require('electron')

type Props = {
  children?: React.Node
}

type State = {
  isFullScreen: boolean
}

class TitleBar extends React.Component<Props, State> {
  props: Props

  static defaultProps = {
    children: null
  }

  state = {
    isFullScreen: false
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
        ipcRenderer.send('close-window')
      }
    })
  }

  handleMin = () => {
    ipcRenderer.send('hide-window')
  }

  render() {
    // max/shrink button
    const btnIcon = this.state.isFullScreen ? 'shrink' : 'arrows-alt'

    return (
      <div className={styles['btn-group']}>
        {this.props && this.props.children}
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
      </div>
    )
  }
}

export default TitleBar
