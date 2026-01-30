/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-15 11:40:44
 * @Description: 采购退货单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/purchase/return/getList',
    method: 'post',
    data: query,
  });
};
