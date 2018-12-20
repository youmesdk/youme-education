/*
 * @Author: fan.li
 * @Date: 2018-12-20 11:55:16
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-20 11:55:39
 *
 * @flow
 *
 * 白板侧侧边栏，
 */

import * as React from 'react';
import * as Icon from 'react-feather';

import styles from './style.scss';

type Props = {
  className?: string,
  onClosePress?: () => void,
};


export default class WhiteBoardSidePanel extends React.PureComponent<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    const { className, onClosePress } = this.props;

    return (
      <div className={[styles.container, className].join(' ')}>
        <header className={styles.header}>
          <h1>快捷键说明</h1>
          <span onClick={onClosePress}>X</span>
        </header>

        <section className={styles.section}>
          <h2>工具</h2>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_icon}>
                <Icon.Navigation size={15} />
              </span>
              <span className={styles.menu_tool_box_name}>选择工具</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>V</span>
            </div>
          </div>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_icon}>
                <Icon.Edit2 size={15} />
              </span>
              <span className={styles.menu_tool_box_name}>铅笔</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>P</span>
            </div>
          </div>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_icon}>
                <Icon.Type size={15} />
              </span>
              <span className={styles.menu_tool_box_name}>文字</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>T</span>
            </div>
          </div>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_icon}>
                <Icon.Book size={15} />
              </span>
              <span className={styles.menu_tool_box_name}>橡皮</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>E</span>
            </div>
          </div>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_icon}>
                <Icon.Circle size={15} />
              </span>
              <span className={styles.menu_tool_box_name}>椭圆</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>O</span>
            </div>
          </div>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_icon}>
                <Icon.Square size={15} />
              </span>
              <span className={styles.menu_tool_box_name}>矩形</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>R</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>其他</h2>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_name}>移动画布</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>空格键</span>
              <span style={{ margin: '0 8px' }}>+</span>
              <span className={styles.menu_tool_box_bg}>拖动</span>
            </div>
          </div>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_name}>放大画布</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>Ctrl</span>
              <span style={{ margin: '0 8px' }}>+</span>
              <span className={styles.menu_tool_box_bg}>+</span>
            </div>
          </div>

          <div className={styles.menu_tool_box}>
            <div className={styles.menu_tool_box_left}>
              <span className={styles.menu_tool_box_name}>缩小画布</span>
            </div>
            <div className={styles.menu_tool_box_right}>
              <span className={styles.menu_tool_box_bg}>Ctrl</span>
              <span style={{ margin: '0 8px'}}>+</span>
              <span className={styles.menu_tool_box_bg}>-</span>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

WhiteBoardSidePanel.defaultProps = {
  className: '',
  onClosePress: f => f,
};
