import request from '@/utils/request';

// 查询工厂
export const loadList = (query = {}) => {
  return request({
    url: '/stock/factoryMain/listAll',
    method: 'post',
    data: query,
  });
};
