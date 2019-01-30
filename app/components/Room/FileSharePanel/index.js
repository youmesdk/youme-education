/*
 * @Author: fan.li
 * @Date: 2019-01-28 17:41:40
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-28 21:22:23
 *
 * @flow
 *
 * 文档下载面板
 */

import * as React from 'react';
import * as Icons from 'react-feather';
import { message } from 'antd';

import FileItem from './FileItem';
import styles from './style.scss';

type Props = {
  files: FileType[],
  onChooseFile: (file: File) => void,
};

type FileType = {
  fileName: string,
  fileType: string,
  fileSize: number,
  fileUrl: string,
  createTime: string | number,
};


export default class FileSharePanel extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.fileInputRef = null;
  }

  handleUploadBtnClick = (e) => {
    if (this.fileInputRef) {
      this.fileInputRef.click();
    }
  }

  handleFileInputChange = (e) => {
    const file = e.target.files[0];
    const { onChooseFile } = this.props;
    onChooseFile(file);
  }

  handleFileDownload = (url: string) => {
    message.info('begin download file!');
    const aDom = document.createElement('a');
    HTMLAnchorElement
    aDom.download = true;
    aDom.href = url;
    aDom.click();
  }

  render() {
    const { files, onUploadFile } = this.props;

    return (
      <div className={styles.container}>
        {files.map((file, index) => {
          return (
            <FileItem
              key={index}
              fileName={file.fileName}
              fileType={file.fileType}
              fileSize={file.fileSize}
              fileUrl={file.fileUrl}
              createTime={file.createTime}
              onDownloadClick={this.handleFileDownload}
            />
          );
        })}

        <div className={styles.float_btn} onClick={this.handleUploadBtnClick}>
          <input
            type="file"
            name="file"
            onChange={this.handleFileInputChange}
            style={{ display: "none" }}
            ref={o => this.fileInputRef = o}
          />
          <Icons.PlusCircle size={35} />
        </div>
      </div>
    );
  }
}

FileSharePanel.defaultProps = {
  files: [],
  onChooseFile: f => f,
};
