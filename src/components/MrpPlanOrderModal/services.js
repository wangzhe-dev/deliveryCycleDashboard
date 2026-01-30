/*
 * @Author: zhaijinsong
 * @Date: 2023-09-08 15:48:19
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-03 10:24:36
 * @Description: MRP计划单
 */
import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/purchase/outsourcing/order/getList',
    method: 'post',
    data: query,
  });
};
