/*
 * @Author: fan.li
 * @Date: 2018-07-27 16:16:37
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-09-06 15:40:40
 *
 * @flow
 */
import * as React from 'react'
import { Button, Spin } from 'antd'
import TitleBar from '../commons/TitleBar'
import styles from './style.scss'

type Props = {
  history: any
}

class Room extends React.Component<Props> {
  handleStopBtn = () => {
    this.props.history.push('/')
  }

  render() {
    return (
      <div className={styles.container}>
        <TitleBar>
          <Button
            ghost
            icon="logout"
            onClick={this.handleStopBtn}
            className={styles.menu_btn}
          />
        </TitleBar>

        <main className={styles.content}>
          <section className={styles.content_header}>
            <div className={styles.content_header_item}>
              <Spin className={styles.spin} size="small" />
            </div>

            <div className={styles.content_header_item}>
              <Spin className={styles.spin} size="small" />
            </div>

            <div className={styles.content_header_item}>
              <Spin className={styles.spin} size="small" />
            </div>

            <div className={styles.content_header_item}>
              <Spin className={styles.spin} size="small" />
            </div>

            <div className={styles.content_header_item}>
              <Spin className={styles.spin} size="small" />
            </div>
          </section>

          <section className={styles.content_main}>
            <div className={styles.content_main_left} />
            <div className={styles.content_main_right}>
              <div className={styles.video}>
                <Spin className={styles.spin} size="large" />
              </div>
              <div className={styles.im}>IM</div>
            </div>
          </section>
        </main>
      </div>
    )
  }
}

export default Room
