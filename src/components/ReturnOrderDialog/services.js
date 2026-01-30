/*
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:02:30
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-18 11:25:05
 * @Description: 退换货订单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpSell/market/order/pageListReturnOrder',
    method: 'post',
    data: query,
  });
};
