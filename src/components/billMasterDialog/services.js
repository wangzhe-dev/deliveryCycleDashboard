/*
 * @Author: heqi
 * @Date: 2023-09-07 14:42:52
 * @LastEditTime: 2023-09-07 14:47:01
 * @Description: 请填写简介
 */
import request from '@/utils/request';

export const listFBillInformation = (query) => {
  return request({
    url: '/treasurer/financeVoucher/listFBillInformation',
    method: 'post',
    data: query,
  });
};
