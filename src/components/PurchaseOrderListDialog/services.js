/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-08 15:55:15
 * @Description: 采购订单选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/purchase/order/getList',
    method: 'post',
    data: query,
  });
};

export const loadExchangeList = (query) => {
  return request({
    url: '/purchase/order/getExchangeList',
    method: 'post',
    data: query,
  });
};
