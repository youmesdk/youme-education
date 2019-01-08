/*
 * @Author: fan.li
 * @Date: 2018-07-27 10:58:16
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-22 10:43:08
 *
 * 设备检测
 */

import * as React from 'react';
import { Form, Select, Button, message, Spin, Slider } from 'antd';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import DetectRTC from 'detectrtc';

import styles from './style.scss';
import TitleBar from '../commons/TitleBar';
import logo from '../../assets/images/logo.png';
import YIMClient from '../../utils/client';

const { Item: FormItem } = Form
const { Option } = Select

type Props = {};

type State = {
  isLoading: boolean,
  cameras: Array<object>,
  speakers: Array<object>,
  microphones: Array<object>,
};

class DeviceCheck extends React.Component<Props, State> {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      cameras: [],
      speakers: [],
      microphones: [],
    };
  }

  componentDidMount() {
    this.detectDeviceInfo();
  }

  detectDeviceInfo = () => {
    this.setState({ isLoading: true });
    DetectRTC.load(() => {
      const microphones = DetectRTC.audioInputDevices;
      const speakers = DetectRTC.audioOutputDevices;
      const cameras = DetectRTC.videoInputDevices;

      this.setState({
        isLoading: false,
        cameras,
        speakers,
        microphones,
      });
    });
  }

  // 退出事件监听
  _onLogout = () => {
    this.setState({
      isLoading: false
    });
    message.info('logout!');
    this.props.history.push('/');
  }

  handleLogoutBtn = () => {
    this.setState({ isLoading: true });
    YIMClient.instance.logout();
  }

  handleNextBtnPress = () => {
    const { history } = this.props;
    history.push('/room');
  }

  render() {
    const { cameras, isLoading, speakers, microphones, } = this.state;

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
                <Select value={cameras[cameras.length - 1] ? cameras[cameras.length - 1].deviceId : ''}>
                {
                  cameras.map((item) => {
                    return (
                      <Option value={item.deviceId} key={item.deviceId}>{item.label}</Option>
                    );
                  })
                }
                </Select>
              </FormItem>

              <FormItem label="Microphones" colon={false}>
                <Select value={microphones[microphones.length - 1] ? microphones[microphones.length - 1].deviceId : ''}>
                  {
                    microphones.map((item) => {
                      return (
                        <Option value={item.deviceId} key={item.deviceId}>{item.label}</Option>
                      );
                    })
                  }
                </Select>
              </FormItem>

              <FormItem label="Speakers" colon={false}>
                <Select value={speakers[speakers.length - 1] ? speakers[speakers.length - 1].deviceId : ''}>
                  {
                    speakers.map((item) => {
                      return (
                        <Option value={item.deviceId} key={item.deviceId}>{item.label}</Option>
                      );
                    })
                  }
                </Select>
              </FormItem>
            </Form>
          </section>

          <section>
            <button
              className={styles.nextBtn}
              onClick={this.handleNextBtnPress}
              disabled={isLoading}
            >
              Next Step
            </button>
          </section>

          {isLoading && (
            <Spin size='large' className={styles.spin} />
          )}
        </main>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { app } = state;
  const { room, user, } = app;
  return { room, user, };
}

export default connect(mapStateToProps, null)(DeviceCheck);
