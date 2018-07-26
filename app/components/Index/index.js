import React, { Component } from "react";
import styles from "./style.scss";
import { Form, Icon, Input, Button, Checkbox } from "antd";
import { Link } from "react-router-dom";

const FormItem = Form.Item;
class Index extends Component {
  handleBtnClick = () => {
    console.log("Btn click");
  };

  handleSubmit = e => {
    e.preventDefault();
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div className={styles.container}>
        <Form onSubmit={this.handleSubmit}>
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
                placeholder="入密码"
              />
            )}
          </FormItem>

          <FormItem>
            <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
              登录
            </Button>
            <Link to='/register'>注册</Link>
          </FormItem>
        </Form>
      </div>
    );
  }
}

const IndexForm = Form.create()(Index);

export default IndexForm;
