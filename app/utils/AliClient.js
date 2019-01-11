/*
 * @Author: fan.li
 * @Date: 2019-01-11 16:54:15
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-11 17:24:41
 *
 * AliCloud 工具封装
 *
 * @flow
 */

import OSSClient from "ali-oss";
import { RPCClient } from "@alicloud/pop-core";

import {
  ALI_ACCESS_KEY_ID,
  ALI_ACCESS_KEY_SECRET,
  IMM_END_POINT,
  IMM_API_VERSION,
  OSS_REGION,
  OSS_BUCKET_NAME,
  OSS_END_POINT,
  IMM_PROJECT_NAME,
  OSS_SRC_URI_BASE,
  IMM_TARGET_URI_BASE,
} from "../config";

export default class AliClient {
  static _instance = null;

  constructor() {
    if (AliClient._instance) {
      return AliClient._instance;
    }

    this.imm = new RPCClient({   // docs to images client
      accessKeyId: ALI_ACCESS_KEY_ID,
      accessKeySecret: ALI_ACCESS_KEY_SECRET,
      endpoint: IMM_END_POINT,
      apiVersion: IMM_API_VERSION,
    });

    this.oss = new OSSClient({
      accessKeyId: ALI_ACCESS_KEY_ID,
      accessKeySecret: ALI_ACCESS_KEY_SECRET,
    });

    return AliClient._instance || (AliClient._instance = this);
  }

  static get instance() {
    return new AliClient();
  }

  uploadFile(file: File): Promise<any> {
    const { name, path } = file;
    const fileName = Date.now() + "_" + name;
    return this.oss.put(fileName, path);
  }

  uploadDocAndConvertToImages(file: File, room: string): Promise<any> {
    const { name, path } = file;
    const sessionName = room + "_" + Date.now();
    const fileName = room + "_" + Date.now() + "_" + name;

    return async function() {
      const ossResult = await this.oss.put(fileName, path);
      const immCreateParams = {
        Project: IMM_PROJECT_NAME,
        SrcUri: OSS_SRC_URI_BASE + fileName,
        TgtType: "jpg",
        TgtUri: IMM_TARGET_URI_BASE + sessionName,
      };

      const immCreateResult = await this.imm.request("createOfficeConversionTask", immCreateParams);

      const immQueryParams = {
        Project: IMM_PROJECT_NAME,
        TaskId: immCreateResult.TaskId,
      };

      return new Promise(async (resolve, reject) => {
        const task = setInterval(() => {
          const immQueryResult = await this.imm.request("GetOfficeConversionTask", immQueryParams);
          if (immQueryResult.Status !== "Running") {
            clearInterval(task);
            const isFinished = immQueryResult === "Finished";
            if (isFinished) {
              return resolve(immQueryResult);
            }
            return reject(immQueryResult);
          }
        }, 2000);
      });
    }
  }
}
