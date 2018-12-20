/*
 * @Author: fan.li
 * @Date: 2018-10-22 11:20:07
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-11 11:36:47
 *
 *
 * 消息列表
 */

import * as React from 'react';
import styles from './style.scss';

type Props = {
  data: Array<any>,
  renderItem: ({item: any, index: number}) => any,
  keyExtractor?: ({item: any, index: number}) => (string)
};

export default class MessageList extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.messageList = null;
  }

  scrollToBottom = () => {
    if (this.messageList) {
      const scrollHeight = this.messageList.scrollHeight;
      const height = this.messageList.clientHeight;
      const maxScrollTop = scrollHeight - height;
      this.messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  }

  render() {
    const { data, renderItem, keyExtractor } = this.props;
    const children = data.map((item, index) => {
      const child = renderItem({ item, index });
      child.key = keyExtractor(item, index);
      return child;
    });

    return (
      <div
        className={styles.container}
        ref={o => this.messageList = o}
      >
        { children }
      </div>
    );
  }
}

MessageList.defaultProps = {
  keyExtractor: f => f,
};
