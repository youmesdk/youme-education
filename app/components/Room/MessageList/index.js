/*
 * @Author: fan.li
 * @Date: 2018-10-22 11:20:07
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-11-11 11:36:47
 *
 * @flow
 *
 * 消息列表
 */

import * as React from 'react';
import styles from './style.scss';

type Props = {
  data: Array<any>,
  renderItem: ({item: any, index: number}) => any,
  keyExtractor?: ({item: any, index: number}) => (string | number)
};

export default class MessageList extends React.Component<Props> {

  render() {
    const { data, renderItem, keyExtractor } = this.props;
    const children = data.map((item, index) => {
      const child = renderItem({ item, index });
      return child;
    });

    return (
      <div className={styles.container}>
        { children }
      </div>
    );
  }
}
