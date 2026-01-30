/*
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:02:30
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2025-01-09 18:09:11
 * @Description: 选择加工单
 */
import request from '@/utils/request';

export const loadList = (query) => {
  return request({
    url: '/quality/inspectionPlan/list',
    method: 'post',
    data: query,
  });
};

// 班组
export const getFactoryTreeBZ = () => {
  return request({
    url: '/equipment/factory/getFactoryTree',
    method: 'post',
    data: { factoryType: 'WORKGROUP' },
  });
};

