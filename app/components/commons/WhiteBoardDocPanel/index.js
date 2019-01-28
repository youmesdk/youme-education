/*
 * @Author: fan.li
 * @Date: 2019-01-11 17:32:07
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-11 17:35:04
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
  pages?: Array,
};

export default class WhiteBoardDocPanel extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    const { contentClassName, onClosePress, pages } = this.props;

    return (
      <div className={[styles.container, contentClassName].join(' ')}>
        <header className={styles.header}>
          <h1>文档</h1>
          <span onClick={onClosePress}>X</span>
        </header>

        <main className={styles.content}>
          {pages.map((item, index) => {
            const isSelected = index === 2;
            return (
              <div className={styles.page_item} key={index}>
                <div className={[styles.page_item__left, isSelected ? styles.active : ''].join(' ')}>
                  {index + 1}
                </div>
                <div className={styles.page_item__box}></div>
              </div>
            )
          })}
        </main>

        <footer className={styles.footer}>
          <span>+</span>
          <span>增减页面</span>
        </footer>
      </div>
    );
  }
}

WhiteBoardDocPanel.defaultProps = {
  contentClassName: '',
  onClosePress: f => f,
  pages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
};

