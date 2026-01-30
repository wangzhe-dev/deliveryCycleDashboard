import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/produce/xcPre/page',
    method: 'post',
    data: query,
  });
};
