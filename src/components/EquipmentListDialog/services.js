import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/equipment/equipmentInfo/pageList',
    method: 'post',
    data: query,
  });
};

export const loadTreeList = (query = {}) => {
  return request({
    url: '/equipment/factory/select-factoryTree',
    method: 'post',
    data: query,
  });
};
