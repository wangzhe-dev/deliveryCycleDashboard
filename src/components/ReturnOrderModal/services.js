/*
 * @Author: zhaijinsong
 * @Date: 2023-08-24 09:44:01
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-18 11:22:34
 * @Description: 退换货订单
 */
import request from '@/utils/request';

export const checkCode = (query) => {
  return request({
    url: '/erpSell/market/order/findByMarketOrderCode',
    method: 'post',
    data: query,
  });
};
