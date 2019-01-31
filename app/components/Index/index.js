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
import { connect } from 'react-redux';

import TitleBar from '../commons/TitleBar';
import logo from '../../assets/images/logo.png';
import { isEmpty } from '../../utils/utils';
import styles from './style.scss';
import * as appActions from '../../actions/app';

import YIMClient, {
   CLASS_IS_EXIST,
   CLASS_IS_NOT_EXIST,
   MAX_NUMBER_MEMBER_ERROR,
} from '../../utils/client';


const { Group: RadioGroup } = Radio;
const Option = Select.Option;

type State = {
  role: 0 | 1,   // 0: teacher 1: student;
  name: string,
  room: string,
  isLoading: boolean,
};

class Index extends React.Component<null, State> {
  constructor(props) {
    super(props);
    this.state = {
      role: 1,
      name: '',
      room: '',
      isLoading: false,
    };
  }

  handleSubmit = async () => {
    try {
      const { role, name, room } = this.state;
      const { setRoom, setUser, history, setWhiteBoardRoom } = this.props;

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

      const user = {
        id: `${name}_${Date.now()}_${role}`,
        name: name,
        role: role,
        isMicOn: true,
        isCameraOn: true,
      };

      // login
      await YIMClient.instance.login(user.id).catch(({ code }) => {
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
        const { whiteBoardRoom, files } = evt;
        // get whiteboard params and save into redux
        setWhiteBoardRoom(whiteBoardRoom);
      }

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

  render() {
    const { isLoading, role, } = this.state;

    return (
      <div className={styles.container}>
        <TitleBar />
        <main className={styles.content}>
          { isLoading ? (<Spin className={styles.spin} size="large" />) : (null) }
          <img src={logo} alt="youme tech logo" className={styles.logo} />
          <h1 className={styles.title}>LOGO IN</h1>

          <section className={styles.form}>
            <input
              name="name"
              className={styles.form__input}
              placeholder="N A M E"
              onChange={this.onInputChange}
            />
            <input
              name="room"
              className={styles.form__input}
              placeholder="R O O M"
              onChange={this.onInputChange}
            />
          </section>

          <RadioGroup
            className={styles.roles}
            value={role}
            onChange={this.onRadioChange}
          >
            <Radio className={styles.roles_radio} value={0}>Teacher</Radio>
            <Radio className={styles.roles_radio} value={1}>Student</Radio>
          </RadioGroup>

          <section style={{ marginTop: '3%' }}>
            <button
              className={styles.submit_btn}
              onClick={this.handleSubmit}
              disabled={isLoading}
            >
              { role === 0 ? 'create room' : 'Join' }
            </button>
          </section>
        </main>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setRoom: bindActionCreators(appActions.setRoom, dispatch),
    setUser: bindActionCreators(appActions.setUser, dispatch),
    setWhiteBoardRoom: bindActionCreators(appActions.setWhiteBoardRoom, dispatch),
  };
};

export default connect(null, mapDispatchToProps)(Index);
