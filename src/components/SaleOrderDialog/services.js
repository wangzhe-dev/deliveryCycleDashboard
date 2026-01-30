/*
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:02:30
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-12 18:05:27
 * @Description:
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpSell/market/order/ReferOrderList',
    method: 'post',
    data: query,
  });
};
