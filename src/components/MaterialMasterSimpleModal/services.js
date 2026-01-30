import request from '@/utils/request';

export const checkCode = (query) => {
  return request({
    url: '/erpMaster/material/queryByMaterialsCode',
    method: 'post',
    data: query,
  });
};
