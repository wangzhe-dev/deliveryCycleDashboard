/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-18 15:15:58
 * @Description: 采购订单选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpSell/market/delivery/pageList',
    method: 'post',
    data: query,
  });
};
