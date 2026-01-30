import request from '@/utils/request';

// 查询项目-编码
export const productNumberByNumber = (query) => {
  return request({
    url: '/erpMaster/project/pageList',
    method: 'post',
    data: query
  });
};