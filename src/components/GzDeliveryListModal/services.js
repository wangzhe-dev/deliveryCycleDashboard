/*
 * @Author: zhaijinsong
 * @Date: 2023-09-08 15:48:19
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-15 11:41:47
 * @Description: 采购收货单
 */
import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query = {}) => {
  return request({
    url: '/purchase/receipt/get',
    method: 'post',
    data: query,
  });
};
