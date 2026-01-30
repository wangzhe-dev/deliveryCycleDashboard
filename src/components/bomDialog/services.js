import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/erpMaster/bom/master/queryByList',
    method: 'post',
    data: query,
  });
};

export const loadBomList = (query) => {
  return request({
    url: '/erpMaster/bom/master/queryByBomList',
    method: 'post',
    data: query,
  });
};
