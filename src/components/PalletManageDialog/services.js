/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-03-13 09:52:17
 * @Description: 托盘管理选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/stock/tray/pageList',
    method: 'post',
    data: query,
  });
};
