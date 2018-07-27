/*
 * @Author: fan.li
 * @Date: 2018-07-27 14:25:18
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-07-27 18:26:45
 *
 * @flow
 */
import * as React from "react";
import { Link } from "react-router-dom";
import { Form, Icon, Input, Button, Radio, Modal } from "antd";
import TitleBar from "../TitleBar";
import styles from "./style.scss";

const { Item: FormItem } = Form;
const { Group: RadioGroup } = Radio;
const { info } = Modal;

type Props = {
  form: {
    getFieldDecorator: Function
  },
  history: { push: Function }
};

class Index extends React.Component<Props> {
  props: Props;

  handleSubmit = e => {
    e.preventDefault();
    this.props.history.push("/devicecheck");
  };

  showHelpInfo = () => {
    info({
      title: "帮助",
      content: "第一次登录我们将给你创建账号，请妥善保管好账号和密码",
      okText: "我知道了"
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div className={styles.container}>
        <header className={styles.title}>
          <TitleBar />
        </header>
        <main className={styles.form}>
          <Form onSubmit={this.handleSubmit}>
            <FormItem>
              {getFieldDecorator("room", {
                rules: [{ required: true, message: "请输入房间号" }]
              })(
                <Input
                  prefix={
                    <Icon type="home" style={{ color: "rgba(0,0,0,.25)" }} />
                  }
                  placeholder="房间"
                />
              )}
            </FormItem>

            <FormItem>
              {getFieldDecorator("userName", {
                rules: [{ required: true, message: "请输入用户名" }]
              })(
                <Input
                  prefix={
                    <Icon type="user" style={{ color: "rgba(0,0,0,.25)" }} />
                  }
                  placeholder="用户名"
                />
              )}
            </FormItem>

            <FormItem>
              {getFieldDecorator("password", {
                rules: [{ required: true, message: "请输入密码" }]
              })(
                <Input
                  prefix={
                    <Icon type="lock" style={{ color: "rgba(0,0,0,.25)" }} />
                  }
                  type="password"
                  placeholder="密码"
                />
              )}
            </FormItem>

            <FormItem>
              {getFieldDecorator("role", {
                initialValue: "teacher"
              })(
                <RadioGroup>
                  <Radio value="teacher">教师</Radio>
                  <Radio value="student">学生</Radio>
                </RadioGroup>
              )}
            </FormItem>

            <div className={styles.help} onClick={this.showHelpInfo}>
              账号相关问题?
            </div>

            <FormItem>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
              >
                登录
              </Button>
              <Link to="/register">注册</Link>
            </FormItem>
          </Form>
        </main>
      </div>
    );
  }
}

const IndexForm = Form.create()(Index);

export default IndexForm;
