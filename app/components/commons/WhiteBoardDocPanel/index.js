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

import styles from './style.scss';

type Props = {
  contentClassName?: string,
  onClosePress?: () => void,
  onAddPage?: () => void,
  onRemovePage?: () => void,
  onPageClick?: (page: Page) => void,
  total: number,
  currentPage: number,
  pages: Page[],
};

type Page = {
  index: number,
  img: string,
};

export default class WhiteBoardDocPanel extends React.Component<Props, State> {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      contentClassName,
      onClosePress,
      currentPage,
      pages,
      onAddPage,
      onPageClick,
    } = this.props;

    return (
      <div className={[styles.container, contentClassName].join(' ')}>
        <header className={styles.header}>
          <h1>文档</h1>
          <span onClick={onClosePress}>X</span>
        </header>

        <main className={styles.content}>
          {pages.map((item) => {
            const { index, img } = item;
            const isSelected = index === currentPage;

            return (
              <div
                className={styles.page_item} key={index}
                onClick={() => onPageClick(item)}
              >
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
          <div onClick={onAddPage}>
            <span>+</span>
            <span>新增页面</span>
          </div>
        </footer>
      </div>
    );
  }
}

WhiteBoardDocPanel.defaultProps = {
  contentClassName: '',

  onClosePress: f => f,
  onAddPage: f => f,
  onRemovePage: f => f,
  onPageClick: f => f,
};

