import request from '@/utils/request';

// 查询项目-编码
export const checkCode = (query) => {
  return request({
    url: '/equipment/routeStep/select-routeStep',
    method: 'post',
    data: query
  });
};