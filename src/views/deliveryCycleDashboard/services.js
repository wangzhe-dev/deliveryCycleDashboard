import request from '@/utils/request';

const API_DISABLED = !import.meta.env.VITE_APP_BASE_API;

export const fetchMaster3dByCode = (materialsCode) => {
  if (API_DISABLED) {
    return Promise.resolve({ success: true, data: null });
  }
  return request({
    url: '/erpMaster/master3d/getByCode',
    method: 'get',
    params: { materialsCode },
  });
};

export const updateMaster3dJson = (materialsCode, json) => {
  if (API_DISABLED) {
    return Promise.resolve({ success: true, data: true });
  }
  return request({
    url: '/erpMaster/master3d/saveOrUpdate',
    method: 'post',
    data: {
      materialsCode,
      json: typeof json === 'string' ? json : JSON.stringify(json ?? {}),
    },
  });
};
