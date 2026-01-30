import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/material/pageList',
    method: 'post',
    data: query
  });
};