/*
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:02:30
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-18 11:25:05
 * @Description: 选择加工单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/produce/mesProductOrder/list',
    method: 'post',
    data: query,
  });
};
