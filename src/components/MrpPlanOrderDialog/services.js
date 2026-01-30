/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-03 15:15:41
 * @Description: MRP计划单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/purchase/manufacturing/sales/purchasingRequirementsList',
    method: 'post',
    data: query,
  });
};
