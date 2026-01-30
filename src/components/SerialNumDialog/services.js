/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-08-22 14:15:28
 * @Description: 序列号主数据选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/materialSerial/main/pageList',
    method: 'post',
    data: query
  });
};