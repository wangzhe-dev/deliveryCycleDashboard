/*
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:02:30
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-17 18:28:07
 * @Description:
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpSell/market/order/ReferOrderCreateList',
    method: 'post',
    data: query,
  });
};
