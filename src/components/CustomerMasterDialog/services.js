/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-08-22 14:15:28
 * @Description: 客户主数据选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/customer/list',
    method: 'post',
    data: query
  });
};