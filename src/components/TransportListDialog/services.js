/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-02-27 15:24:59
 * @Description: 采购运单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/purchase/transport/getList',
    method: 'post',
    data: query,
  });
};
