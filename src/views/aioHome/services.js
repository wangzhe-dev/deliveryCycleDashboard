/*
 * @Descripttion:
 * @version:
 * @Author: lj
 * @Date: 2025-05-27 09:48:20
 * @LastEditors: liangjia
 * @LastEditTime: 2025-12-17 09:29:57
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/message/ruleConfig/listpage',
    method: 'post',
    data: query,
  });
};

export const addList = (query) => {
  return request({
    url: '/message/ruleConfig/add',
    method: 'post',
    data: query,
  });
};

export const deleteList = (query) => {
  return request({
    url: '/message/ruleConfig/deleteById',
    method: 'post',
    data: query,
  });
};

export const updateList = (query) => {
  return request({
    url: '/message/ruleConfig/update',
    method: 'post',
    data: query,
  });
};
