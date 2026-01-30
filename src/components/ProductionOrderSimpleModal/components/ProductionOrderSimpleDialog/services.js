import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/logistics/wlPmProductWorkOrder/page',
    method: 'post',
    data: query,
  });
};
