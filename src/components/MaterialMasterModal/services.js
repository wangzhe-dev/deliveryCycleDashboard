/*
 * @Author: zhaijinsong
 * @Date: 2023-08-24 09:44:01
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-08-24 10:05:30
 * @Description: 物料Form
 */
import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/erpMaster/material/queryByMaterialsCode',
    method: 'post',
    data: query
  });
};