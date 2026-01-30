import request from '@/utils/request';

// 查询仓库
export const loadList = (query = {}) => {
  return request({
    url: '/stock/warehouseMain/listAll',
    method: 'post',
    data: query,
  });
};
