import request from '@/utils/request';

// 查询工厂
export const loadList = (query) => {
  return request({
    url: '/factory/select-factoryModel',
    method: 'post',
    data: query,
  });
};
