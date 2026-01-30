/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-13 18:08:01
 * @Description: 采购通知单选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/purchase/notify/getList',
    method: 'post',
    data: query,
  });
};
