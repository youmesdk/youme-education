/*
 * @Author: fan.li
 * @Date: 2018-07-27 10:58:16
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-19 17:14:17
 *
 * 设备检测
 */

import * as React from 'react';
import { Form, Select, Button } from 'antd';
import { Link } from 'react-router-dom';
import styles from './style.scss';
import TitleBar from '../commons/TitleBar';
import logo from '../../assets/images/logo.png';

const { Item: FormItem } = Form
const { Option } = Select

export default class DeviceCheck extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.container}>
        <TitleBar />

        <main className={styles.content}>
          <img src={logo} alt="youme tech logo" className={styles.logo} />
          <h1 className={styles.title}>Device Check</h1>

          <section className={styles.devices}>
            <Form>
              <FormItem label="Camera" colon={false}>
                <Select defaultValue="camera1">
                  <Option value="camera1">USB2.0 PC CAMERA</Option>
                </Select>
              </FormItem>

              <FormItem label="Microphone" colon={false}>
                <Select defaultValue="mic1">
                  <Option value="mic1">麦克风(2-USB2.0 MIC)</Option>
                </Select>
              </FormItem>
            </Form>
          </section>

          <section>
            <Link to="/room">
              <button className={styles.nextBtn}>Next Step</button>
            </Link>
          </section>
        </main>
      </div>
    )
  }
}
