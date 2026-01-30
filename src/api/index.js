/*
 * @Author: zhaijs
 * @Date: 2023-08-09 11:04:09
 * @LastEditTime: 2024-09-06 07:55:28
 * @Description: 请填写简介
 */
import request from '@/utils/request';

// 根据字典类型查询字典数据信息
export function getDicts(dictType) {
  return request({
    url: '/system/dict/data/type/' + dictType,
    method: 'get',
  });
}

// 批量查询字典数据信息
export function queryDictList(dictType) {
  return request({
    url: '/system/dict/data/queryDictList',
    method: 'post',
    data: dictType,
  });
}

// 查询当前用户未读消息数量
export function messageNumber(dictType) {
  return request({
    url: '/infra/user/message/number',
    method: 'post',
    data: dictType,
  });
}

// 查询当前用户消息
export function messagePageList(dictType) {
  return request({
    url: '/infra/user/message/pageList',
    method: 'post',
    data: dictType,
    noLoading: true,
    headers: {
      repeatSubmit: false,
    },
  });
}

// 一键已读
export function messageRead(dictType) {
  return request({
    url: '/infra/user/message/read',
    method: 'post',
    data: dictType,
  });
}
