/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-13 18:08:01
 * @Description: 产品API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/apsService/standard/product/getProductMaterials',
    method: 'post',
    data: query,
  });
};
