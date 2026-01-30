/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-15 11:40:44
 * @Description: 采购收货单选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/purchase/receipt/getList',
    method: 'post',
    data: query,
  });
};

export const refLoadList = (query) => {
  return request({
    url: '/purchase/receipt/listPurchaseReceipt',
    method: 'post',
    data: query,
  });
};
