/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-08 15:55:15
 * @Description: 核算维度选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/projectAccountingDimension/list',
    method: 'post',
    data: query,
  });
};

export const getPdaTypeList = (query) => {
  return request({
    url: '/erpMaster/projectAccountingDimensionType/listNoPage',
    method: 'post',
    data: query,
  });
};
