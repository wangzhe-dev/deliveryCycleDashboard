/*
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:02:30
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2025-01-10 16:28:19
 * @Description: 选择质检填报单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/produce/order/page',
    method: 'post',
    data: query,
  });
};
