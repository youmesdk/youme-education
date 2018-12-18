/*
 * @Author: fan.li
 * @Date: 2018-07-27 10:58:16
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-22 10:43:08
 *
 * 设备检测
 */

import * as React from 'react';
import { Form, Select, Button, message, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import styles from './style.scss';
import TitleBar from '../commons/TitleBar';
import logo from '../../assets/images/logo.png';
import YIMClient from '../../utils/client';

const { Item: FormItem } = Form
const { Option } = Select

class DeviceCheck extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogouting: false,
      cameras: [],
      outputVolume: 0
    };
  }

  componentWillMount() {
    const { user, room } = this.props;
    const { id } = user;
    // init video sdk
    YIMClient.instance.initVideo();
    YIMClient.instance.joinVideoRoom(id, room).catch((code) => {
      message.error(`join video room error!: ${code}`);
    });
  }

  componentDidMount() {
    this.bindEvents();
    const cameras = [];
    let outputVolume = 0;
    const count = YIMClient.instance.$video.getCameraCount();
    for (let i = 0; i < count; i++) {
      cameras.push(YIMClient.instance.$video.getCameraName(i));
    }
    outputVolume = YIMClient.instance.$video.getVolume();
    this.setState({
      outputVolume,
      cameras
    });
  }

  componentWillUnmount() {
    this.unbindEvents();
  }

  bindEvents = () => {
    YIMClient.instance.$im.emitter.on('OnLogout', this._onLogout);
  }

  unbindEvents = () => {
    YIMClient.instance.$im.emitter.removeListener('OnLogout', this._onLogout);
  }

  // 退出事件监听
  _onLogout = () => {
    this.setState({
      isLogouting: false
    });
    message.info('logout!');
    this.props.history.push('/');
  }

  handleLogoutBtn = () => {
    this.setState({
      isLogouting: true
    });
    YIMClient.instance.logout();
  }

  render() {
    const { cameras, outputVolume } = this.state;
    return (
      <div className={styles.container}>
        <TitleBar>
          <Button
            ghost
            icon="logout"
            onClick={this.handleLogoutBtn}
            className={styles.menu_btn}
          />
        </TitleBar>

        <main className={styles.content}>
          <img src={logo} alt="youme tech logo" className={styles.logo} />
          <h1 className={styles.title}>Device Check</h1>

          <section className={styles.devices}>
            <Form>
              <FormItem label="Camera" colon={false}>
                <Select defaultValue={cameras[0]}>
                {
                  cameras.map((item, index) => {
                    return (
                      <Option value={item} key={index}>{item}</Option>
                    );
                  })
                }
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

const mapStateToProps = (state, ownProps) => {
  const { app } = state;
  const { room, user } = app;
  return { room, user };
}

export default connect(mapStateToProps, null)(DeviceCheck);
