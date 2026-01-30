/*
 * @Author: zhaijinsong
 * @Date: 2023-09-08 15:48:19
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-08 15:57:12
 * @Description:
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
