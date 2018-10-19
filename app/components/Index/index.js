/*
 * @Author: fan.li
 * @Date: 2018-07-27 14:25:18
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-10-19 16:30:40
 *
 *  主页，登录页
 */
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Radio, message } from 'antd';
import logo from '../../assets/images/logo.png';
import TitleBar from '../commons/TitleBar';
import styles from './style.scss';
import { isEmpty } from '../../utils/utils';

const { Group: RadioGroup } = Radio;

export default class Index extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      role: 'teacher',
      name: '',
      passwd: ''
    };
  }

  handleSubmit = () => {
    const { role, name, passwd } = this.state;
    if (isEmpty(name) || isEmpty(passwd)) {
      message.info("username and password not allow empty");
      return;
    }
    this.props.history.push('/devicecheck');
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
    return (
      <div className={styles.container}>
        <TitleBar />
        <main className={styles.content}>
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
              name="passwd"
              className={styles.form__input}
              placeholder="P A S S W O R D"
              type="password"
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
