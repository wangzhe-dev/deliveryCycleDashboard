/*
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-25 10:54:18
 * @Description: 生产组件清单
 */
import request from '@/utils/request';

export const loadList = (query = {}) => {
  return request({
    url: '/produce/productionMaterialHeader/getProductionMaterialLinePage',
    method: 'post',
    data: query,
  });
};
