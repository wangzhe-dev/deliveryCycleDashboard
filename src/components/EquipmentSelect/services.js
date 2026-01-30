import request from '@/utils/request';

// 查询工厂
export const loadList = (query = {}) => {
  return request({
    url: '/equipment/rpc/equipmentInfo/selectJneEquipmentInfoList',
    method: 'post',
    data: query,
  });
};
