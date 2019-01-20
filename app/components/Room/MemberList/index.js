/*
 * @Author: fan.li
 * @Date: 2019-01-20 12:13:58
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-20 16:44:03
 *
 * @flow
 *
 * 成员列表
 */

import * as React from 'react';
import * as Icon from 'react-feather';
import { Dropdown, Menu } from 'antd';

import styles from './style.scss';

import type { User } from '../../../reducers/app';
import MemberItem from './MemberItem';

type Props = {
  user?: User,
  members?: User[],
  onRowClick?: (item) => void,
  onMicClick?: (item) => void,
  onCameraClick?: (item) => void,
};

export default class MemberList extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    const menu = (
      <Menu>
        <Menu.Item><div>关闭</div></Menu.Item>
        <Menu.Item><div>最小化</div></Menu.Item>
      </Menu>
    );

    const { user, members } = this.props;
    const memberCount = members.length + 1;

    return (
      <div className={styles.container}>
        <header>
          {/* <Dropdown className={styles.chevron_down} overlay={menu}>
            <Icon.ChevronDown />
          </Dropdown> */}
          <h1 className={styles.title}>参会者({memberCount})</h1>
        </header>

        <main className={styles.main}>
          {/* myself */}
          <MemberItem
            name={user.name}
            role={user.role}
            isMicOn={user.isMicOn}
            isCameraOn={user.isCameraOn}
            isMyself={true}
          />

          {/* others */}
          {members.map((u: User) => (
            <MemberItem
              key={u.id}
              name={u.name}
              role={u.role}
              isMicOn={u.isMicOn}
              isCameraOn={u.isCameraOn}
              isMyself={false}
            />)
          )}
        </main>

        <footer>
          {/* <span>静音</span> */}
          {/* <span>举手</span> */}
        </footer>
      </div>
    );
  }
}

