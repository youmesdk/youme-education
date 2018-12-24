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
    const { user, room, regionCode, regionName } = this.props;
    const { id } = user;
    // init video sdk
    await YIMClient.instance.initVideo(regionCode, regionName).catch((code) => {
      message.error(`init video engine error!: ${code}`)
    });

    // set video engine
    YIMClient.instance.$video.setExternalInputMode(false);
    YIMClient.instance.$video.setAVStatisticInterval(5000);
    YIMClient.instance.$video.videoEngineModelEnabled(false);
    YIMClient.instance.$video.setVideoLocalResolution(640, 480);
    YIMClient.instance.$video.setVideoNetResolution(640, 480);
    YIMClient.instance.$video.setMixVideoSize(640, 480);
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
    this.setState({ isLoading: true });
    YIMClient.instance.logout();
  }

  handleNextBtnPress = () => {
    const { history } = this.props;
    history.push('/room');
  }

  handleVolumeChange = (value: number) => {
    // disable it, avoid someone set low volume
    // YIMClient.instance.$video.setVolume(value);
    this.setState({ outputVolume: value });
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
                <Select defaultValue={cameras[0]} value={cameras[0]}>
                {
                  cameras.map((item, index) => {
                    return (
                      <Option value={item} key={index}>{item}</Option>
                    );
                  })
                }
                </Select>
              </FormItem>

              <FormItem label="Volume" colon={false}>
                <Slider
                  defaultValue={outputVolume}
                  value={outputVolume}
                  onChange={this.handleVolumeChange}
                />
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

          { isLoading && <Spin size='large' className={styles.spin} /> }
        </main>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { app } = state;
  const { room, user, regionCode, regionName } = app;
  return { room, user, regionCode, regionName };
}

export default connect(mapStateToProps, null)(DeviceCheck);
