/*
 * @Author: zhaijinsong
 * @Date: 2023-08-22 13:58:51
 * @LastEditors: jufuli 1030891512@qq.com
 * @LastEditTime: 2025-02-21 13:55:40
 * @Description: 客户主数据选择弹窗API
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/companyInfo/pageList',
    method: 'post',
    data: query,
  });
};
