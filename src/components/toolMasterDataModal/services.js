/*
 * @Author: jufuli
 * @Date: 2024-05-16 10:45:33
 * @LastEditTime: 2024-07-12 13:12:05
 * @Description: 刀具主数据api
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/toolMaster/queryList',
    method: 'post',
    data: query,
  });
};

// 新增
export const save = (query) => {
  return request({
    url: '/tm/master/save',
    method: 'post',
    data: query,
  });
};
//删除
export const deleteBatch = (query) => {
  return request({
    url: '/tm/master/delete',
    method: 'post',
    data: query,
  });
};

export const queryStatusQuantity = (query) => {
  return request({
    url: '/erpMaster/toolMaster/queryStatusQuantity',
    method: 'get',
    data: query,
  });
};

