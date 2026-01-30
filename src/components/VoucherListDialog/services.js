/*
 * @Author: zhaijs
 * @Date: 2023-09-12 15:02:30
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-17 13:47:27
 * @Description: 凭证清单弹窗
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/treasurer/financeVoucher/findFinanceVoucherHeader',
    method: 'post',
    data: query,
  });
};
