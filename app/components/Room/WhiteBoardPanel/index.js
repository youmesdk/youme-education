/*
 * @Author: fan.li
 * @Date: 2019-01-07 16:03:46
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-11 18:08:07
 *
 * 白板操作面板
 */

import * as React from 'react';
import { WhiteWebSdk, RoomWhiteboard, } from 'white-react-sdk';
import { Tooltip, Pagination } from 'antd';
import * as Icon from 'react-feather';

import styles from './style.scss';
import WhiteBoardTool from '../../commons/WhiteBoardTool';
import WhiteBoardScaler from '../../commons/WhiteBoardScaler';
import WhiteBoardSidePanel from '../../commons/WhiteBoardSidePanel';
import WhiteBoardDocSidePanel from '../../commons/WhiteBoardDocPanel';
import { throttle } from '../../../utils/utils';

import type { Tool } from '../../commons/WhiteBoardTool'


type Props = {
  boardRoom: object,
  zoomScale: number,
  onZoomScaleDecrease: () => void,
  onZoomScaleIncrease: () => void,
};

export default class WhiteboardPanel extends React.Component<Props> {
  constructor(props) {
    super(props);

    this.state = {
      isShortcutPanelShow: false,   // should show shortcut panel?
      isDocPanelShow: false,        // should show documents panel?
    };

    this.throttledWindowSizeChange = throttle(this.handleWindowSizeChange, 200);
  }

  componentDidMount() {
    // update whiteboard draw area when window size changed
    window.addEventListener('resize', this.throttledWindowSizeChange, false);
  }

  componentWillUnmount() {
    // remove resize listener when compoent will unmount
    window.removeEventListener('resize', this.throttledWindowSizeChange, false);
  }

  handleWindowSizeChange = () => {
    const { boardRoom } = this.props;
    const whiteboardDom = document.getElementById('whiteboard');
    const { clientWidth, clientHeight } = whiteboardDom;
    if (boardRoom) {
      boardRoom.refreshViewSize(clientWidth, clientHeight);
    }
  }

  handleWhiteBoardToolChange = (tool: Tool) => {
    const { boardRoom } = this.props;
    if (boardRoom) {
      boardRoom.setMemberState({ currentApplianceName: tool, });
    }
  }

  openWhiteBoardShortcutSidePanel = () => {
    this.setState({ isShortcutPanelShow: true });
  }

  closeWhiteBoardShortcutSidePanel = () => {
    this.setState({ isShortcutPanelShow: false });
  }

  openWhiteBoardDocSidePanel = () => {
    this.setState({ isDocPanelShow: true });
  }

  closeWhiteBoardDocSidePanel = () => {
    this.setState({ isDocPanelShow: false });
  }

  render() {
    const { boardRoom, zoomScale, onZoomScaleDecrease, onZoomScaleIncrease } = this.props;
    const { isShortcutPanelShow, isDocPanelShow } = this.state;

    return (
      <div className={styles.container} id="whiteboard">
        <RoomWhiteboard
          className={styles.whiteboard}
          room={boardRoom}
        />

        <WhiteBoardTool
          className={styles.docker}
          onToolChange={this.handleWhiteBoardToolChange}
        />

        <WhiteBoardScaler
          className={styles.scaler}
          scale={zoomScale}
          onDecreasePress={onZoomScaleDecrease}
          onIncreasePress={onZoomScaleIncrease}
        />

        {isShortcutPanelShow && (
          <WhiteBoardSidePanel
            className={styles.side_panel}
            onClosePress={this.closeWhiteBoardShortcutSidePanel}
          />
        )}

        {isDocPanelShow && (
          <WhiteBoardDocSidePanel
            contentClassName={styles.side_panel}
            onClosePress={this.closeWhiteBoardDocSidePanel}
          />
        )}

        <div className={styles.right_bottom_tools}>
          <span className={styles.shortcut_hover}>
            <Tooltip
              title="快捷键说明"
              mouseEnterDelay={0.8}
              onClick={this.openWhiteBoardShortcutSidePanel}
            >
              <Icon.Info size={22} />
            </Tooltip>
          </span>

          <span className={styles.shortcut_hover}>
            <Tooltip
              title="文档"
              mouseEnterDelay={0.8}
              onClick={this.openWhiteBoardDocSidePanel}
            >
              <Icon.Package size={22} />
            </Tooltip>
          </span>

          <Pagination
            size="small"
            defaultCurrent={1}
            total={50}
          />
        </div>
      </div>
    );
  }
}
