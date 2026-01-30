import request from '@/utils/request';

// 按请求编码查询详情（含物料列表）
export function getSchedulingRequestByCode(requestCode) {
  return request({
    url: `/logistics/jne/lineScheduling/requests/${requestCode}`,
    method: 'get'
  });
}
