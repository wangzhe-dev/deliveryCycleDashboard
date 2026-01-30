/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: 胡洋杰
 * @LastEditTime: 2023-08-23 14:45:47
 * @Description: 客户主数据选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/supplier/pageSearch',
    method: 'post',
    data: query
  });
};