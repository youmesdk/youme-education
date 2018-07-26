import React from "react";
import { Button, Modal } from "antd";
import styles from "./style.scss";

const confirm = Modal.confirm;
const ipcRenderer = require("electron").ipcRenderer;

class TitleBar extends React.Component {
  constructor() {
    super();
    this.state = {
      isFullScreen: false
    };
  }

  handleMax = () => {
    if (this.state.isFullScreen) {
      ipcRenderer.send("restore-window");
      this.setState({
        isFullScreen: !this.state.isFullScreen
      });
    } else {
      ipcRenderer.send("max-window");
      this.setState({
        isFullScreen: !this.state.isFullScreen
      });
    }
  };

  handleClose = () => {
    confirm({
      title: "Do you Want to close app?",
      content: "",
      onOk: () => {
        ipcRenderer.send("close-window");
      }
    });
  };

  handleMin = () => {
    ipcRenderer.send("hide-window");
  };

  render() {
    // max/shrink button
    const btnIcon = this.state.isFullScreen ? "shrink" : "arrows-alt";

    return (
      <header className={styles.header}>
        <div className={styles["btn-group"]}>
          <Button
            className={styles.btn}
            ghost
            icon="minus"
            onClick={this.handleMin}
          />
          <Button
            className={styles.btn}
            ghost
            icon={btnIcon}
            onClick={this.handleMax}
          />
          <Button
            className={styles.btn}
            ghost
            icon="close"
            onClick={this.handleClose}
          />
        </div>
      </header>
    );
  }
}

export default TitleBar;
