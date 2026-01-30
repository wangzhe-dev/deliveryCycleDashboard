import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/erpMaster/customer/queryByCustomerCode',
    method: 'post',
    data: query
  });
};