/*
 * @Author: fan.li
 * @Date: 2018-07-27 14:25:18
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-20 16:02:47
 *
 *  主页，登录页
 */
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Radio, message, Spin } from 'antd';
import logo from '../../assets/images/logo.png';
import TitleBar from '../commons/TitleBar';
import styles from './style.scss';
import { isEmpty } from '../../utils/utils';
import Client from '../../utils/client';

const { Group: RadioGroup } = Radio;

export default class Index extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      role: 'teacher',
      name: '',
      room: '',
      isLogining: false
    };
    this.$client = Client.getInstance();
  }

  handleSubmit = () => {
    const { role, name, room } = this.state;
    if (isEmpty(name) || isEmpty(room)) {
      message.warn("username and roomname not allow empty");
      return;
    }
    this.setState({
      isLogining: true
    });
    // IM 登录
    this.$client.login(name).then(() => {
      // 加入房间
      this.$client.joinRoom(room).then(() => {
        message.info('login success!');
        this.setState({ isLogining: false });
        this.props.history.push('/devicecheck');
      }).catch(code => {
        message.error(`join room error, code=${code}`);
        this.setState({ isLogining: false });
      });
    }).catch((code) => {
      message.error(`login fail! code=${code}`);
      this.setState({ isLogining: false });
    });
  }

  onInputChange = (e) => {
    const name = e.target.name;
    this.setState({
      [name]: e.target.value
    });
  }

  onRadioChange = (e) => {
    this.setState({
      role: e.target.value
    });
  }

  render() {
    const { isLogining } = this.state;

    return (
      <div className={styles.container}>
        { <Spin className={styles.spin} /> }
        <TitleBar />
        <main className={styles.content}>
          {/* isLogining ? ( <Spin size="small" />) : (null) */}
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
            value={this.state.role}
            onChange={this.onRadioChange}
          >
            <Radio className={styles.roles_radio} value="teacher">Teacher</Radio>
            <Radio className={styles.roles_radio} value="student">Student</Radio>
          </RadioGroup>

          <section style={{ marginTop: '3%' }}>
            <button
              className={styles.submit_btn}
              onClick={this.handleSubmit}
            >
              Join
            </button>
          </section>
        </main>
      </div>
    );
  }
}
