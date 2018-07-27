/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-07-27 18:45:29
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
          <section className={styles.remote}>
            <div>远端视频</div>
          </section>
          <section className={styles.workspace}>
            <div>录屏</div>
          </section>
          <section className={styles.local}>
            <div>本地视频</div>
          </section>
          <section className={styles.im}>
            <div>IM</div>
          </section>
        </main>
      </div>
    );
  }
}

export default Room;
