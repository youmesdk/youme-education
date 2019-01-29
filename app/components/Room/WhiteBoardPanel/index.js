/*
 * @Author: fan.li
 * @Date: 2019-01-07 16:03:46
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 17:17:25
 *
 * 白板操作面板
 */

import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { WhiteWebSdk, RoomWhiteboard, } from 'white-react-sdk';
import { Tooltip, Pagination, message } from 'antd';
import * as Icon from 'react-feather';

import styles from './style.scss';
import WhiteBoardTool from '../../commons/WhiteBoardTool';
import WhiteBoardScaler from '../../commons/WhiteBoardScaler';
import WhiteBoardSidePanel from '../../commons/WhiteBoardSidePanel';
import WhiteBoardDocSidePanel from '../../commons/WhiteBoardDocPanel';
import { throttle } from '../../../utils/utils';
import type { Tool } from '../../commons/WhiteBoardTool'

import * as fileActions from '../../../actions/files';
import * as appActions from '../../../actions/app';

import AliClient from '../../../utils/AliClient';


type Props = {
  boardRoom: object,
  zoomScale: number,
  onZoomScaleDecrease: () => void,
  onZoomScaleIncrease: () => void,
};

class WhiteboardPanel extends React.Component<Props> {
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

  fileToImage = (file: File) => {
    const fileReader = new FileReader();
    const img = new Image();
    return new Promise((resolve, reject) => {
      fileReader.onload = function() {
        img.src = fileReader.result;
      }

      fileReader.onerror = function(err) {
        reject(err);
      }

      img.onload = function() {
        resolve(img);
      }

      img.onerror = function(err) {
        reject(err);
      }
      fileReader.readAsDataURL(file);
    });
  }

  handleWhiteBoardChooseFile = async (file: File) => {
    try {
      const { boardRoom } = this.props;

      // 选中的是图片,在白板中插入图片
      if (/image/.test(file.type)) {
        if (boardRoom) {
          const img: Image = await this.fileToImage(file);
          const imgRes = await AliClient.instance.uploadFile(file);
          const { name: uuid, url } = imgRes;

          boardRoom.insertImage({
            uuid: uuid,
            centerX: 0,
            centerY: 0,
            width: img.width,
            height: img.height,
          });
          boardRoom.completeImageUpload(uuid, url);
        }
      }
    } catch(err) {
      message.error('upload file error');
    } finally {
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
          onChooseFile={this.handleWhiteBoardChooseFile}
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

const mapStateToProps = (state) => {
  const { app, files } = state;
  const { room, user, whiteBoardRoom } = app;
  const { fileList } = files;

  return {
    room,
    user,
    whiteBoardRoom,
    fileList,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WhiteboardPanel);
