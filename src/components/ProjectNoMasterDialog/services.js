import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/project/pageList',
    method: 'post',
    data: query
  });
};