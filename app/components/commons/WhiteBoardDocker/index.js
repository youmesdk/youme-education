/*
 * @Author: fan.li
 * @Date: 2018-12-19 15:45:54
 * @Last Modified by: fan.li
 * @Last Modified time: 2018-12-19 20:36:04
 *
 * @flow
 *
 * WhiteBoard Docker Menu
 */

import * as React from 'react';
import * as Icon from 'react-feather';
import { Tooltip, Menu } from 'antd';
import { CirclePicker } from 'react-color';

import styles from './style.scss';

type Props = {
  className?: string,
  defaultSelect?: string,
  defaultColor?: string,
  onSelectPress?: () => void,
  onPenPress?: () => void,
  onTextPress?: () => void,
  onEraserPress?: () => void,
  onCirclePress?: () => void,
  onSquarePress?: () => void,
  onColorChange: (color: string) => void,
};

type State = {
  selectIndex: SelectIndex,
};

export type SelectIndex = 'pen' | 'select' | 'text' | 'eraser' | 'circle' | 'square';

const Menus = {
  pen: 'pen',
  select: 'select',
  text: 'text',
  eraser: 'eraser',
  circle: 'circle',
  square: 'square',
};

export default class WhiteBoardDocker extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { defaultSelect, defaultColor } = props;
    this.state = {
      selectIndex: defaultSelect,
      color: defaultColor,
      isColorPickerShow: false,
    };
  }

  handleSelectSelected = () => {
    this.setState({ selectIndex: Menus.select });
    const { onSelectPress } = this.props;
    onSelectPress();
  }

  handlePenSelected = () => {
    this.setState({ selectIndex: Menus.pen });
    const { onPenPress } = this.props;
    onPenPress();
  }

  handleTextSelected = () => {
    this.setState({ selectIndex: Menus.text });
    const { onTextPress } = this.props;
    onTextPress();
  }

  handleEraserSelected = () => {
    this.setState({ selectIndex: Menus.eraser });
    const { onEraserPress } = this.props;
    onEraserPress();
  }

  handleCircleSelected = () => {
    this.setState({ selectIndex: Menus.circle });
    const { onCirclePress } = this.props;
    onCirclePress();
  }

  handleSquareSelected = () => {
    this.setState({ selectIndex: Menus.square });
    const { onSquarePress } = this.props;
    onSquarePress();
  }

  handleColorSelected = () => {
    const { isColorPickerShow } = this.state;
    this.setState({ isColorPickerShow: !isColorPickerShow });
  }

  handleColorChangeComplete = (color) => {
    this.setState({ color: color.hex });
    const { onColorChange } = this.props;
    onColorChange(color.hex);
  }

  render() {
    const { className } = this.props;
    const { selectIndex, color, isColorPickerShow } = this.state;

    return (
      <div className={[styles.container, className].join(' ')}>
        <div
          className={[styles.icon, selectIndex === Menus.select ? styles.selected : '' ].join(' ')}
          onClick={this.handleSelectSelected}
        >
          <Tooltip title="选择" mouseEnterDelay={1.0}>
            <Icon.Navigation />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, selectIndex === Menus.pen ? styles.selected : ''].join(' ')}
          onClick={this.handlePenSelected}
        >
          <Tooltip title="自由绘画" mouseEnterDelay={1.0}>
            <Icon.Edit2 />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, selectIndex === Menus.text ? styles.selected : ''].join(' ')}
          onClick={this.handleTextSelected}
        >
          <Tooltip title="绘制文字" mouseEnterDelay={1.0}>
            <Icon.Type />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, selectIndex === Menus.eraser ? styles.selected : ''].join(' ')}
          onClick={this.handleEraserSelected}
        >
          <Tooltip title="橡皮擦" mouseEnterDelay={1.0}>
            <Icon.Book />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, selectIndex === Menus.circle ? styles.selected : ''].join(' ')}
          onClick={this.handleCircleSelected}
        >
          <Tooltip title="绘制圆形" mouseEnterDelay={1.0}>
            <Icon.Circle />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, selectIndex === Menus.square ? styles.selected : ''].join(' ')}
          onClick={this.handleSquareSelected}
        >
          <Tooltip title="绘制矩形" mouseEnterDelay={1.0}>
            <Icon.Square />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, styles.color_container].join(' ')}
          onClick={this.handleColorSelected}
        >
          <Tooltip title="调色板" mouseEnterDelay={1.0}>
            <Icon.Slack color={color} />
          </Tooltip>

          { isColorPickerShow &&
           <CirclePicker
             className={styles.color_picker}
             color={color}
             onChangeComplete={this.handleColorChangeComplete}
             onChange={f => f}
           />
          }
        </div>
      </div>
    );
  }
}

WhiteBoardDocker.defaultProps = {
  className: '',
  defaultSelect: Menus.pen,
  defaultColor: '#000',
  onSelectPress: f => f,
  onPenPress: f => f,
  onTextPress: f => f,
  onEraserPress: f => f,
  onCirclePress: f => f,
  onSquarePress: f => f,
  onColorChange: f => f,
};
