/*
 * @Author: fan.li
 * @Date: 2018-10-19 19:49:40
 * @Last Modified by: fan.li
 * @Last Modified time: 2019-01-11 16:59:12
 *
 * 一些常量
 */
import dotenv from 'dotenv';

dotenv.config();

export const APP_KEY = 'YOUME5BE427937AF216E88E0F84C0EF148BD29B691556';
export const APP_SECRET = 'y1sepDnrmgatu/G8rx1nIKglCclvuA5tAvC0vXwlfZKOvPZfaUYOTkfAdUUtbziW8Z4HrsgpJtmV/RqhacllbXD3abvuXIBlrknqP+Bith9OHazsC1X96b3Inii6J7Und0/KaGf3xEzWx/t1E1SbdrbmBJ01D1mwn50O/9V0820BAAE=';
export const API_SECRET = 'f2d520691f378d9e37ccfc76f46fbdb0';  // 实际使用时，API_SECRET 只需要放到服务器端，用于token计算

export const WHITEBOARD_TOKEN = 'WHITEcGFydG5lcl9pZD1uVUcwRUFmaGpkRzZLd1BScWdqSnBjblRDbE0zUDYycm1Vc0Imc2lnPTYwYmY2MDE0NWZmYTM5MjllYjZjZmJiNGEyYmU2YTZmMDAwNmM4ZDQ6YWRtaW5JZD02NiZyb2xlPW1pbmkmZXhwaXJlX3RpbWU9MTU3NjY5NDg0NSZhaz1uVUcwRUFmaGpkRzZLd1BScWdqSnBjblRDbE0zUDYycm1Vc0ImY3JlYXRlX3RpbWU9MTU0NTEzNzg5MyZub25jZT0xNTQ1MTM3ODkyNTAyMDA';

export const PUSH_STREAM_BASE_URL = 'rtmp://pili-publish.youme.im/youmetest/';     // 推流服务器地址
export const PULL_STREAM_BASE_URL = 'http://pili-live-rtmp.youme.im/youmetest/';  // 拉流服务器地址

export const ALI_ACCESS_KEY_ID = 'LTAInM5gYC17YD0h';
export const ALI_ACCESS_KEY_SECRET = 'vKEYtnDCxPY1l9xgVDnwPa7wyu7OlF';

export const IMM_END_POINT = 'https://imm.cn-beijing.aliyuncs.com/'; // 文档转图片
export const IMM_API_VERSION = '2017-09-06';
export const IMM_PROJECT_NAME = 'ym-edu-demo';
export const IMM_TARGET_URI_BASE = 'oss://ym-edu-demo/docs/';

export const OSS_SRC_URI_BASE = 'oss://youme-byy/';
export const OSS_END_POINT = 'https://oss-cn-shenzhen.aliyuncs.com/'; // 云存储
export const OSS_BUCKET_NAME = "youme-byy";
export const OSS_REGION = "oss-cn-shenzhen";
