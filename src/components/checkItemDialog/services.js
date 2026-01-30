import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/quality/jneQualityInspectionRules/queryPage',
    method: 'post',
    data: query,
  });
};
// 工序
export const routeStepLoadList = ({}) => {
  return request({
    url: '/equipment/routeStep/select-routeStep',
    method: 'post',
    data: {},
  });
};
