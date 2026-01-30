import request from '@/utils/request';

export const curvedSegment = (params = {}) =>
  request({
    url: '/construction/curvedSegment/list',
    method: 'post',
    data: params,
  });
export const fetchVenueOptionsList = (data = {}) =>
  request({
   url: '/construction/shipMaster/list',
    method: 'post',
    data,
  });

export * from '../services';

// 船号下拉
export const fetchShipList = (query = {}) =>
  request({
    url: '/construction/shipMaster/list',
    method: 'post',
    data: {
      pageNum: query.pageNum || 1,
      pageSize: query.pageSize || 200,
      shipNo: query.shipNo || '',
    },
  }).then((res = {}) => {
    const list =
      (Array.isArray(res?.data?.records) && res.data.records) ||
      (Array.isArray(res?.data?.list) && res.data.list) ||
      [];
    return {
      data: list.map((item) => ({
        label: item.shipNo || item.projectNo || item.projectName,
        value: item.shipNo,
      })),
    };
  });
