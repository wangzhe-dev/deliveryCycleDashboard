/*
 * @Author: zhaijinsong
 * @Date: 2023-09-08 15:48:19
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-11-15 09:11:12
 * @Description: 核算维度
 */
import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/purchase/order/get',
    method: 'post',
    data: query,
  });
};
