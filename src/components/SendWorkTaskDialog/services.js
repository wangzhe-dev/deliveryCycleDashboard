/*
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-25 10:51:39
 * @Description: 派工任务列表弹窗
 */
import request from '@/utils/request';

export const loadList = (query = {}) => {
  return request({
    url: '/produce/mes/dispatch/pageList',
    method: 'post',
    data: query,
  });
};
