/*
 * @Author: fan.li
 * @Date: 2018-07-27 10:58:16
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-07-27 17:29:45
 *
 * @flow
 */
import * as React from "react";
import { Form, Select, Button } from "antd";
import { Link } from "react-router-dom";
import styles from "./style.scss";
import TitleBar from "../TitleBar";

const { Item: FormItem } = Form;
const { Option } = Select;

type Props = {};

class DeviceCheck extends React.Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container}>
        <header className={styles.title}>
          <TitleBar />
        </header>

        <main className={styles.main}>
          <section className={styles.form}>
            <header>
              <h1 style={{ textAlign: "center" }}>设备检测</h1>
            </header>
            <Form>
              <FormItem label="摄像头" colon={false}>
                <Select defaultValue="camera1">
                  <Option value="camera1">摄像头1</Option>
                </Select>
              </FormItem>

              <FormItem label="麦克风" colon={false}>
                <Select defaultValue="mic1">
                  <Option value="mic1">麦克风1</Option>
                </Select>
              </FormItem>
            </Form>

            <section className={styles.btnGroup}>
              <Button type="primary">
                <Link to="/">上一步</Link>
              </Button>
              <Button type="primary">
                <Link to="/room">加入房间</Link>
              </Button>
            </section>
          </section>
        </main>
      </div>
    );
  }
}

export default DeviceCheck;
