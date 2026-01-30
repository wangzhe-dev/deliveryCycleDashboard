import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/treasurer/assetsBalanceSheet/pageList',
    method: 'post',
    data: query,
  });
};

// 公司信息
export const companyInfo = (query = {}) => {
  return request({
    url: '/erpMaster/companyInfo/pageList',
    method: 'post',
    data: query,
  });
};

// 资产分类
export const assetsclass = (query = {}) => {
  return request({
    url: '/treasurer/assetsClass/pageList',
    method: 'post',
    data: query,
  });
};

//成本中心;
export const costDepartment = (query = {}) => {
  return request({
    url: '/erpMaster/costDepartment/listTree',
    method: 'post',
    data: query,
  });
};

// 使用人
export const employee = (query = {}) => {
  return request({
    url: '/erpMaster/employee/queryList',
    method: 'post',
    data: query,
  });
};
