/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-02-05 18:06:49
 * @Description: 委外组件清单API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/purchase/outsourcing/materials/getList',
    method: 'post',
    data: query,
  });
};
