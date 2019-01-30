/*
 * @Author: fan.li
 * @Date: 2019-01-07 16:03:46
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 20:16:09
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
import * as whiteboardActions from '../../../actions/whiteboard';

import AliClient from '../../../utils/AliClient';
import WhiteBoardClient from '../../../utils/WhiteBoardClient';

type Page = {
  index: number,
  img: string,
};

type Props = {
  boardRoom: object,
  zoomScale: number,
  onZoomScaleDecrease: () => void,
  onZoomScaleIncrease: () => void,
};

type State = {
  isShortcutPanelShow: boolean,
  isDocPanelShow: boolean,
  pages: Pages[],
};

class WhiteboardPanel extends React.Component<Props> {
  constructor(props) {
    super(props);

    this.state = {
      isShortcutPanelShow: false,   // should show shortcut panel?
      isDocPanelShow: false,        // should show documents panel?
      pages: [],
    };

    this.throttledWindowSizeChange = throttle(this.handleWindowSizeChange, 200);
  }

  componentDidMount() {
    // update whiteboard draw area when window size changed
    window.addEventListener('resize', this.throttledWindowSizeChange, false);
    // fetch whiteboard page preview
    const { count, whiteBoardRoom } = this.props;
    const { uuid } = whiteBoardRoom;
    this.fetchSnapshot(uuid, count);
  }

  componentWillUnmount() {
    // remove resize listener when compoent will unmount
    window.removeEventListener('resize', this.throttledWindowSizeChange, false);
  }

  fetchSnapshot = async (uuid: string, count: number) => {
    try {
      const pages: Page[] = [];

      for (let i = 0; i < count; i++) {
        const res = await WhiteBoardClient.instance.fetchSnapshot(uuid, 250, 120, i);
        const imgDataURL = await this.imageBlobToDataURL(res.data);
        const page = { index: i, img: imgDataURL };
        pages.push(page);
      }

      this.setState({ pages: pages });
    } catch(err) {
      message.error('获取画板预览图失败，请重试');
    }
  }

  imageBlobToDataURL = (blob: Blob) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(blob);

    return new Promise((resolve, reject) => {
      fileReader.onload = function() {
        resolve(fileReader.result);
      }

      fileReader.onerror = function(err) {
        reject(err);
      }
    });
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
      } else {
        message.info('only support image file');
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
    const { count, whiteBoardRoom } = this.props;
    const { uuid } = whiteBoardRoom;
    this.fetchSnapshot(uuid, count);
  }

  closeWhiteBoardDocSidePanel = () => {
    this.setState({ isDocPanelShow: false });
  }

  handleWhiteBoarddDocAddPage = () => {
    const { setWhiteBoardPageCount, count, boardRoom, whiteBoardRoom } = this.props;
    const { uuid } = whiteBoardRoom;

    if (boardRoom) {
      // push new page into whiteboard
      boardRoom.insertNewPage(count);
      setWhiteBoardPageCount(count + 1);
      this.fetchSnapshot(uuid, count + 1);
    }
  }

  handleWhiteBoardDocPageClick = (page: Page) => {
    const { boardRoom, setWhiteBoardCurrentPage } = this.props;
    const { index } = page;
    if (boardRoom) {
      boardRoom.setGlobalState({ currentSceneIndex: index });
      setWhiteBoardCurrentPage(index);
    }
  }

  handlePaginationChange = (index: number) => {
    const { boardRoom, setWhiteBoardCurrentPage } = this.props;
    if (boardRoom) {
      boardRoom.setGlobalState({ currentSceneIndex: index - 1 });
      setWhiteBoardCurrentPage(index -1);
    }
  }

  render() {
    const {
      boardRoom, zoomScale, onZoomScaleDecrease, onZoomScaleIncrease,
      whiteBoardRoom, currentPage, count,
    } = this.props;

    const { isShortcutPanelShow, isDocPanelShow, pages } = this.state;

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
            total={count}
            currentPage={currentPage}
            onAddPage={this.handleWhiteBoarddDocAddPage}
            onPageClick={this.handleWhiteBoardDocPageClick}
            onClosePress={this.closeWhiteBoardDocSidePanel}
            pages={pages}
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
            current={currentPage + 1}
            total={count * 10}
            onChange={this.handlePaginationChange}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { app, files, whiteboard } = state;

  const { room, user, whiteBoardRoom } = app;
  const { fileList } = files;
  const { count, currentPage, } = whiteboard;

  return {
    room,
    user,
    whiteBoardRoom,
    fileList,
    count,
    currentPage,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setWhiteBoardPageCount: bindActionCreators(whiteboardActions.setPageCount, dispatch),
    setWhiteBoardCurrentPage: bindActionCreators(whiteboardActions.setCurrentPage, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WhiteboardPanel);
