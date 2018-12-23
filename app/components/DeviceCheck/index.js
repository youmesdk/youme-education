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
import { VIDEO_REGION_NAME, VIDEO_SERVERE_REGION } from '../../config';

const { Item: FormItem } = Form
const { Option } = Select

class DeviceCheck extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      cameras: [],
      outputVolume: 0
    };
  }

  componentDidMount() {
    this.bindEvents();
    this.initVideo();
  }

  componentWillUnmount() {
    this.unbindEvents();
  }

  initVideo = async () => {
    this.setState({ isLoading: true });
    const { user, room } = this.props;
    const { id } = user;
    // init video sdk
    await YIMClient.instance.initVideo(VIDEO_SERVERE_REGION, VIDEO_REGION_NAME).catch((code) => {
      message.error(`init video engine error!: ${code}`)
    });

    // set video engine
    YIMClient.instance.$video.setExternalInputMode(false);
    YIMClient.instance.$video.setAVStatisticInterval(5000);
    YIMClient.instance.$video.videoEngineModelEnabled(false);
    YIMClient.instance.$video.setVideoLocalResolution(320, 240);
    YIMClient.instance.$video.setVideoNetResolution(320, 240);
    YIMClient.instance.$video.setMixVideoSize(320, 240);
    YIMClient.instance.$video.setVideoCallback("");
    YIMClient.instance.$video.setAutoSendStatus(true);
    YIMClient.instance.$video.setVolume(100);

    // join video room
    await YIMClient.instance.joinVideoRoom(id, room).catch(({ code }) => {
      message.error(`join video room error!: ${code}`);
    });

    // join video room success, open microphtone and speacker;
    YIMClient.instance.$video.setMicrophoneMute(false);
    YIMClient.instance.$video.setSpeakerMute(false);

    // get cameras an current volume
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
    this.setState({ isLoading: false });
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
      isLoading: false
    });
    message.info('logout!');
    this.props.history.push('/');
  }

  handleLogoutBtn = () => {
    this.setState({
      isLoading: true
    });
    YIMClient.instance.logout();
  }

  render() {
    const { cameras, outputVolume, isLoading } = this.state;
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

          { isLoading && <Spin size='large' className={styles.spin} /> }
        </main>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { app } = state;
  const { room, user } = app;
  return { room, user };
}

export default connect(mapStateToProps, null)(DeviceCheck);
