/*
 * @Author: zhaijinsong
 * @Date: 2023-09-08 15:48:19
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-20 17:12:07
 * @Description:
 */
import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/purchase/outsourcing/materials/findByNumber',
    method: 'post',
    data: query,
  });
};
