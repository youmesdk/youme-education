/*
 * @Author: fan.li
 * @Date: 2019-01-11 17:32:07
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 19:40:06
 *
 * 白板文档上传及分页工具
 *
 * @flow
 */

import * as React from 'react';
import { message } from 'antd';

import styles from './style.scss';
import WhiteBoardClient from '../../../utils/WhiteBoardClient';

type Props = {
  contentClassName?: string,
  onClosePress?: () => void,
  onAddPage?: () => void,
  onRemovePage?: () => void,
  boardRoom: object | null;
  whiteBoardRoom: { uuid: string }
};

export default class WhiteBoardDocPanel extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      pages: [],
      current: 0,
    };
  }

  componentDidMount() {
    this.fetchSnapshot();
  }

  fetchSnapshot = async () => {
    try {
      const { whiteBoardRoom, total } = this.props;
      const { uuid } = whiteBoardRoom;
      const pages = [];

      for (let i = 0; i < total; i++) {
        const res = await WhiteBoardClient.instance.fetchSnapshot(uuid, 250, 120, i);
        const imgDataURL = await this.imageBlobToDataURL(res.data);
        console.log(imgDataURL);
        const page = { index: i, img: imgDataURL };
        pages.push(page);
      }

      this.setState({ pages: pages });
    } catch(err) {
      console.log(err);
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

  handlePageClick = (index: number) => {
    const { boardRoom } = this.props;
    if (!boardRoom) {
      return;
    }

    boardRoom.setGlobalState({
      currentSceneIndex: index,
    });
  }

  render() {
    const { contentClassName, onClosePress } = this.props;
    const { pages, current } = this.state;
    console.log(pages);

    return (
      <div className={[styles.container, contentClassName].join(' ')}>
        <header className={styles.header}>
          <h1>文档</h1>
          <span onClick={onClosePress}>X</span>
        </header>

        <main className={styles.content}>
          {pages.map((item) => {
            const { index, img } = item;
            const isSelected = index === current;

            return (
              <div className={styles.page_item} key={index}>
                <div className={[styles.page_item__left, isSelected ? styles.active : ''].join(' ')}>
                  {index + 1}
                </div>
                <div className={styles.page_item__box}>
                  <img src={img} />
                </div>
              </div>
            )
          })}
        </main>

        <footer className={styles.footer}>
          <span>+</span>
          <span>新增页面</span>
        </footer>
      </div>
    );
  }
}

WhiteBoardDocPanel.defaultProps = {
  contentClassName: '',
  total: 1,
  current: 0,

  onClosePress: f => f,
  onAddPage: f => f,
  onRemovePage: f => f,
};

