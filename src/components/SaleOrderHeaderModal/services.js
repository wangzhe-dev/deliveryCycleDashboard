/*
 * @Author: zhaijinsong
 * @Date: 2023-08-24 09:44:01
 * @LastEditors: 胡洋杰
 * @LastEditTime: 2023-09-12 15:24:29
 * @Description: 物料Form
 */
import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/erpSell/market/order/findByMarketOrderCode',
    method: 'post',
    data: query,
  });
};
