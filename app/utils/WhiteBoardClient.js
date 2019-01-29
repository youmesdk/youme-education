/*
 * @Author: fan.li
 * @Date: 2019-01-29 10:18:24
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-29 15:09:17
 *
 * @flow
 *
 * 白板SDK封装
 */

 export default class WhiteBoardClient {
   static _instance = null;

   constructor() {
     if (WhiteBoardClient._instance !== null) {
       return WhiteBoardClient._instance;
     }
   }

   static get instance() {
     return WhiteBoardClient._instance || (WhiteBoardClient._instance = new WhiteBoardClient());
   }

   static injectStore(store) {
     WhiteBoardClient.store = store;
   }

   // 创建一个白板
   createRoom(token: string, room: string, limit = 5): Promise<any> {
     const url = `https://cloudcapiv3.herewhite.com/room?token=${token}`;
     return axios({
       url: url,
       method: 'post',
       headers: {
         'content-type': 'application/json',
       },
       data: { name: room, limit },
     });
   }

   // 获取白板快照
   fetchSnapshot(uuid: string, width: number, height: number, scene: number): Promise<any> {
     const url = `https://cloudcapiv3.herewhite.com/handle/room/snapshot?token=${token}`;
     return axios({
       url: url,
       method: 'post',
       headers: {
         'content-type': 'application/json',
       },
       data: { uuid, width, height, scene }
     });
   }
 }
