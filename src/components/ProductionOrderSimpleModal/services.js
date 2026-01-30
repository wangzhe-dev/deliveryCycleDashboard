import request from '@/utils/request';

export const checkCode = (query) => {
  return request({
    url: '/logistics/wlPmProductWorkOrder/page',
    method: 'post',
    data: {
      ...query,
      pageNum: 1,
      pageSize: 1,
    },
  });
};
