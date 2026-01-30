/*
 * @Author: heqi
 * @Date: 2023-09-07 14:42:52
 * @LastEditTime: 2023-09-07 14:47:01
 * @Description: 请填写简介
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/subject/treeSubject',
    method: 'post',
    data: query,
  });
};
