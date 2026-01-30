/*
 * @Author: zhaijinsong
 * @Date: 2023-09-08 15:48:19
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-18 15:16:36
 * @Description: 外向交货单
 */
import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/erpSell/market/delivery/findByDeliveryOrderCode',
    method: 'post',
    data: query,
  });
};
