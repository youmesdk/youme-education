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
  onColorChange?: (color: string) => void,
  onToolChange?: (tool: Tool) => void,
};

type State = {
  tool: Tool,
};

export type Tool = 'pencil' | 'selector' | 'text' | 'eraser' | 'ellipse' | 'rectangle';

export const Tools = {
  pencil: 'pencil',
  selector: 'selector',
  text: 'text',
  eraser: 'eraser',
  ellipse: 'ellipse',
  rectangle: 'rectangle',
};

export default class WhiteBoardTool extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { defaultSelect, defaultColor } = props;
    this.state = {
      tool: defaultSelect,
      color: defaultColor,
      isColorPickerShow: false,
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyboard);
  }

  componentWillUnmount() {
    window.addEventListener('keydown', this.handleKeyboard);
  }

  handleToolChange = (tool: Tool) => () => {
    const { onToolChange } = this.props;
    this.setState({ tool: tool });
    onToolChange(tool);
  }

  handleToolChangeByKeyBoard = (tool: Tool) => {
    const { onToolChange } = this.props;
    this.setState({ tool: tool });
    onToolChange(tool);
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

  handleKeyboard = (event: KeyboardEvent) => {
    const { keyCode } = event;
    switch (keyCode) {
      // V ----> Tools.selector
      case 86: {
        this.handleToolChangeByKeyBoard(Tools.selector);
        break;
      }

      // P ----> Tools.pencil
      case 80: {
        this.handleToolChangeByKeyBoard(Tools.pencil);
        break;
      }

      // T ----> Tools.text
      case 84: {
        this.handleToolChangeByKeyBoard(Tools.text);
        break;
      }

      // E ----> Tools.eraser
      case 69: {
        this.handleToolChangeByKeyBoard(Tools.eraser);
        break;
      }

      // O ----> Tools.ellipse
      case 79: {
        this.handleToolChangeByKeyBoard(Tools.ellipse);
        break;
      }

      // R ----> Tools.rectangle
      case 82: {
        this.handleToolChangeByKeyBoard(Tools.rectangle);
        break;
      }
    }
  }

  render() {
    const { className } = this.props;
    const { tool, color, isColorPickerShow } = this.state;

    return (
      <div className={[styles.container, className].join(' ')}>
        <div
          className={[styles.icon, tool === Tools.selector ? styles.selected : '' ].join(' ')}
          onClick={this.handleToolChange(Tools.selector)}
        >
          <Tooltip title="选择" mouseEnterDelay={1.0}>
            <Icon.Navigation />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, tool === Tools.pencil ? styles.selected : ''].join(' ')}
          onClick={this.handleToolChange(Tools.pencil)}
        >
          <Tooltip title="自由绘画" mouseEnterDelay={1.0}>
            <Icon.Edit2 />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, tool === Tools.text ? styles.selected : ''].join(' ')}
          onClick={this.handleToolChange(Tools.text)}
        >
          <Tooltip title="绘制文字" mouseEnterDelay={1.0}>
            <Icon.Type />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, tool === Tools.eraser ? styles.selected : ''].join(' ')}
          onClick={this.handleToolChange(Tools.eraser)}
        >
          <Tooltip title="橡皮擦" mouseEnterDelay={1.0}>
            <Icon.Book />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, tool === Tools.ellipse ? styles.selected : ''].join(' ')}
          onClick={this.handleToolChange(Tools.ellipse)}
        >
          <Tooltip title="绘制圆形" mouseEnterDelay={1.0}>
            <Icon.Circle />
          </Tooltip>
        </div>

        <div
          className={[styles.icon, tool === Tools.rectangle ? styles.selected : ''].join(' ')}
          onClick={this.handleToolChange(Tools.rectangle)}
        >
          <Tooltip title="绘制矩形" mouseEnterDelay={1.0}>
            <Icon.Square />
          </Tooltip>
        </div>

        {/* <div
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
        </div> */}
      </div>
    );
  }
}

WhiteBoardTool.defaultProps = {
  className: '',
  defaultSelect: Tools.pencil,
  defaultColor: '#000',
  onColorChange: f => f,
  onToolChange: f => f,
};
