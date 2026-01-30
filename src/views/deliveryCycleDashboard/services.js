import request from '@/utils/request';

export const fetchMaster3dByCode = (materialsCode) => {
  return request({
    url: '/erpMaster/master3d/getByCode',
    method: 'get',
    params: { materialsCode },
  });
};

export const updateMaster3dJson = (materialsCode, json) => {
  return request({
    url: '/erpMaster/master3d/saveOrUpdate',
    method: 'post',
    data: {
      materialsCode,
      json: typeof json === 'string' ? json : JSON.stringify(json ?? {}),
    },
  });
};
