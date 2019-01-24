/*
 * @Author: fan.li
 * @Date: 2018-07-27 14:25:18
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-17 18:05:53
 *
 * @flow
 *
 *  主页，登录页
 */
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Radio, message, Spin, Select } from 'antd';
import { bindActionCreators } from 'redux';

import logo from '../../assets/images/logo.png';
import { connect } from 'react-redux';

import TitleBar from '../commons/TitleBar';
import styles from './style.scss';
import { isEmpty } from '../../utils/utils';

import YIMClient, {
   CLASS_IS_EXIST,
   CLASS_IS_NOT_EXIST,
   MAX_NUMBER_MEMBER_ERROR,
} from '../../utils/client';
import * as actions from '../../actions/app';
import { VIDEO_REGION_NAME, VIDEO_SERVERE_REGION, REGION_MAP } from '../../config';

const { Group: RadioGroup } = Radio;
const Option = Select.Option;

type State = {
  role: 0 | 1,   // 0: teacher 1: student;
  name: string,
  room: string,
  isLoading: boolean,
  regionCode: string,
  regionName: string,
};

class Index extends React.Component<null, State> {
  constructor(props) {
    super(props);
    this.state = {
      role: 1,
      name: '',
      room: '',
      regionCode: REGION_MAP[0].code,
      regionName: REGION_MAP[0].name,
      isLoading: false,
    };
  }

  handleSubmit = async () => {
    try {
      const { role, name, room } = this.state;
      const { setRoom, setUser, history, setWhiteBoardRoom, setRegionCode, setRegionName } = this.props;

      if (isEmpty(name) || isEmpty(room)) {
        return message.warn("username and room name not allow empty");
      }

      if (!/^[0-9a-zA-Z]+$/.test(name)) {
        return message.error('name can only consist a-z | A-Z | 0-9!');
      }

      if (!/^[0-9a-zA-Z]+$/.test(room)) {
        return message.error('room can only consist a-z | A-Z | 0-9!');
      }

      this.setState({ isLoading: true });

      // login
      await YIMClient.instance.login(name).catch(({ code }) => {
        throw new Error(`login fail, code=${code}`);
      });

      if (role === 0) {
        // teacher create a chat room
        await YIMClient.instance.createChatRoom(room).catch(({ code }) => {
          YIMClient.instance.logout();
          if (code === CLASS_IS_EXIST) {
            throw new Error(`current room is used, code=${CLASS_IS_EXIST}`);
          }
          throw new Error(`create room error, code=${code}`);
        });
      } else {
        // student join a chat room
        const res = await YIMClient.instance.joinChatRoom(room).catch(({ code }) => {
          YIMClient.instance.logout();
          if (code === CLASS_IS_NOT_EXIST) {
            throw new Error(`join room error, room is not exist, code=${code}`)
          }

          if (code === MAX_NUMBER_MEMBER_ERROR) {
            throw new Error(`join room error, too manay student in room, code=${code}`);
          }

          throw new Error(`join room error, code=${code}`);
        });

        const { code, evt } = res;
        const { whiteBoardRoom, regionCode, regionName } = evt;
        // get whiteboard params and save into redux
        setWhiteBoardRoom(whiteBoardRoom);
        setRegionCode(regionCode);
        setRegionName(regionName);
      }

      const user = {
        id: `${name}_${Date.now()}_${role}`,
        name: name,
        role: role,
        isMicOn: true,
        isCameraOn: true,
      };

      // save room and nickname into redux
      setRoom(room);
      setUser(user)

      message.info('login success!');
      this.setState({ isLoading: false });
      history.push('/devicecheck');
    } catch(err) {
      message.error(err.message);
      this.setState({ isLoading: false });
    }
  }

  onInputChange = (e) => {
    const name = e.target.name;
    this.setState({ [name]: e.target.value });
  }

  onRadioChange = (e) => {
    this.setState({ role: e.target.value });
  }

  onRegionChange = (value: string) => {
    const temp = value.split('-');
    const code = parseInt(temp[0], 10);
    const name = temp[1];
    this.setState({ regionCode: code, regionName: name });

    const { setRegionCode, setRegionName } = this.props;
    setRegionCode(code);
    setRegionName(name);
  }

  render() {
    const { isLoading, role, regionCode, regionName } = this.state;

    return (
      <div className={styles.container}>
        <TitleBar />
        <main className={styles.content}>
          { isLoading ? ( <Spin className={styles.spin} size="large" />) : (null) }
          <img src={logo} alt="youme tech logo" className={styles.logo} />
          <h1 className={styles.title}>LOGO IN</h1>

          <section className={styles.form}>
            <input
              name="name"
              className={styles.form__input}
              placeholder="昵称"
              onChange={this.onInputChange}
            />
            <input
              name="room"
              className={styles.form__input}
              placeholder="会议编号，其他人可加入该会议"
              onChange={this.onInputChange}
            />
          </section>

          { role === 0 && (
            <Select
              defaultValue={`${regionCode}-${regionName}`}
              className={styles.region}
              onChange={this.onRegionChange}
            >
              {
                REGION_MAP.map((region) => {
                  return (
                    <Option
                      key={region.code}
                      value={`${region.code}-${region.name}`}
                    >
                      {region.label}
                    </Option>
                  );
                })
              }
            </Select>)
          }

          <RadioGroup
            className={styles.roles}
            value={role}
            onChange={this.onRadioChange}
          >
            <Radio className={styles.roles_radio} value={0}>主持人</Radio>
            <Radio className={styles.roles_radio} value={1}>参会人</Radio>
          </RadioGroup>

          <section style={{ marginTop: '3%' }}>
            <button
              className={styles.submit_btn}
              onClick={this.handleSubmit}
              disabled={isLoading}
            >
              { role === 0 ? 'Create Meeting' : 'Join Meeting' }
            </button>
          </section>
        </main>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setRoom: bindActionCreators(actions.setRoom, dispatch),
    setUser: bindActionCreators(actions.setUser, dispatch),
    setWhiteBoardRoom: bindActionCreators(actions.setWhiteBoardRoom, dispatch),
    setRegionName: bindActionCreators(actions.setRegionName, dispatch),
    setRegionCode: bindActionCreators(actions.setRegionCode, dispatch),
  };
};

export default connect(null, mapDispatchToProps)(Index);
