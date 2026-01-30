/*
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2025-03-06 15:09:37
 * @Description: 生产订单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/employee/pageList',
    method: 'post',
    data: query
  })
}

export const getDepartmentList = (query) => {
  return request({
    url: '/erpMaster/costDepartment/listTree',
    method: 'post',
    data: query
  })
}
