import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/produce/weld/page',
    method: 'post',
    data: query,
  });
};
