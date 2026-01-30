
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/departmentFunction/functionPageList',
    method: 'post',
    data: query,
  });
};
