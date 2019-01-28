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

import FileItem from './FileItem';
import styles from './style.scss';

type Props = {
  files: Array<FileType>[],
};

type FileType = {
  fileName: string,
  fileType: string,
  fileSize: number,
  fileUrl: string,
  createTime: string | number,
};


export default class DocPanel extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.fakeFiles = [
      { fileType: 'text', fileName: '文件1', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'exe', fileName: '文件2', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'png', fileName: '文件3', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'file', fileName: '文件4', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'gif', fileName: '文件5', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'jpg', fileName: '文件6', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件7', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件8', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件9', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件10', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件11', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件12', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件13', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件14', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件15', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件16', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件17', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件18', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件19', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件20', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件21', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件22', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件23', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件24', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件25', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件26', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件27', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
      { fileType: 'word', fileName: '文件28', fileSize: 1000, fileUrl: 'https://youme.im', createTime: Date.now() },
    ];
  }



  render() {
    const { files } = this.props;

    return (
      <div className={styles.container}>
        {this.fakeFiles.map((file) => {
          return (
            <FileItem
              key={file.fileName}
              fileName={file.fileName}
              fileType={file.fileType}
              fileSize={file.fileSize}
              fileUrl={file.fileUrl}
              createTime={file.createTime}
              onDownloadClick={f => f}
            />
          );
        })}

        <div className={styles.float_btn}>
          <Icons.PlusCircle size={35} />
        </div>
      </div>
    );
  }
}

DocPanel.defaultProps = {
  files: []
};
