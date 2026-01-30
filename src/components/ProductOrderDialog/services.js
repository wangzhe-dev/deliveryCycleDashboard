/*
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-25 10:51:39
 * @Description: 生产订单
 */
import request from '@/utils/request';

export const loadList = (query = {}) => {
  return request({
    url: '/produce/produceOrderLine/page',
    method: 'post',
    data: query,
  });
};
