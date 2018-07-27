/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-07-27 17:11:42
 *
 * @flow
 */
import * as React from "react";
import { Button } from "antd";
import TitleBar from "../TitleBar";
import styles from "./style.scss";

type Props = {};

class Room extends React.Component<Props> {
  handleStopBtn = () => {
    console.log("logout");
  };

  render() {
    return (
      <div className={styles.container}>
        <header className={styles.title}>
          <TitleBar>
            <Button
              ghost
              icon="logout"
              onClick={this.handleStopBtn}
              className={styles.menu_btn}
            />
          </TitleBar>
        </header>

        <main className={styles.main}>
          <header className={styles.header}>
            <div>学生1</div>
          </header>

          <section className={styles.content}>
            <div className={styles.left}>左边</div>
            <div className={styles.right}>
              <div className={styles.main_video}>教师摄像头</div>
              <div className={styles.im}>IM 聊天</div>
            </div>
          </section>
        </main>
      </div>
    );
  }
}

export default Room;
