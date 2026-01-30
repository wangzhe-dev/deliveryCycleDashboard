/*
 * @Author: zhaijinsong
 * @Date: 2023-08-24 09:44:01
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-25 09:53:20
 * @Description: 选择加工单
 */
import request from '@/utils/request';

export const checkCode = (query) => {
  return request({
    url: '/erpSell/market/order/findByMarketOrderCode',
    method: 'post',
    data: query,
  });
};
