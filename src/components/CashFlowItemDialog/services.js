/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-08-22 14:15:28
 * @Description: 财务科目主数据弹窗API
 */
import request from '@/utils/request';

// 科目编码
export const treeSubject = (query = {}) => {
  return request({
    url: '/erpMaster/cashflow/pageList',
    method: 'post',
    data: query,
  });
};
