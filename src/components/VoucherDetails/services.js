/*
 * @Author: zhaijinsong
 * @Date: 2024-01-17 16:33:25
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-17 16:38:59
 * @Description:
 */
import request from '@/utils/request';

export const findFinanceVoucherById = (query) => {
  return request({
    url: '/treasurer/financeVoucher/findFinanceVoucherById',
    method: 'post',
    data: query,
  });
};

// 公司信息
export const companyInfo = (query = {}) => {
  return request({
    url: '/erpMaster/companyInfo/pageList',
    method: 'post',
    data: query,
  });
};

// 凭证类型
export const findVoucherTypeList = (query = {}) => {
  return request({
    url: '/treasurer/financeVoucher/findVoucherTypeList',
    method: 'post',
    data: query,
  });
};
