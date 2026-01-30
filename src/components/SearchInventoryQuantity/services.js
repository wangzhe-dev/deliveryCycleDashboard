import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/stock/stockQuery/findByMaterielsCodeIn',
    method: 'post',
    data: query
  });
};