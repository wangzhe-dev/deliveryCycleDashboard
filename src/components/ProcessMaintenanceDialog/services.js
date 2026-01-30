/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-09-26 20:21:42
 * @Description: 客户主数据选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/equipment/route/select-routeById',
    method: 'post',
    data: query
  });
};