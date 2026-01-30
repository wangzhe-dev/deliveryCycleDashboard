import request from '@/utils/request';

/**
 * 获取储位树形结构
 * 接口来源：/logistics/wms/waresLocation/tree
 */
export const loadTreeList = (query = {}) => {
  return request({
    url: '/logistics/wms/waresLocation/tree',
    method: 'post',
    data: query,
  });
};
