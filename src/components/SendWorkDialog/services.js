/*
 * @Author: 胡洋杰
 * @Date: 2023-08-24 16:11:13
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-22 16:02:40
 * @Description: 派工单API
 */
import request from '@/utils/request';

export const listAllEmployee = (query = {}) => {
  return request({
    url: '/erpMaster/employee/queryList',
    method: 'post',
    data: query,
  });
};

// 批量创建派工单
export const dispatchBatchAdd = (query = {}) => {
  return request({
    url: '/produce/mes/dispatch/batch/add',
    method: 'post',
    data: query,
  });
};

// 批量修改派工单
export const dispatchBatchUpdate = (query = {}) => {
  return request({
    url: '/produce/mes/dispatch/batch/update',
    method: 'post',
    data: query,
  });
};

// 查询派工单
export const findByProcessNumberCode = (query = {}) => {
  return request({
    url: '/produce/mes/dispatch/findByProcessNumberCode',
    method: 'post',
    data: query,
  });
};

// 查询设备
export const selectJneEquipmentInfoList = (query = {}) => {
  return request({
    url: '/equipment/equipmentInfo/selectJneEquipmentInfoList',
    method: 'post',
    data: query,
  });
};

export const dispatchDel = (query = {}) => {
  return request({
    url: '/produce/mes/dispatch/del',
    method: 'post',
    data: query,
  });
};

// 查询设备
export const selectEquipmentInfoByArea = (query = {}) => {
  return request({
    url: '/equipment/equipmentInfo/selectEquipmentInfo',
    method: 'post',
    data: query,
  });
};

// 查询产线
export const selectFactoryTree = (query = {}) => {
  return request({
    url: '/equipment/factory/getFactoryTree',
    method: 'post',
    data: query,
  });
};

// 查询班组下面的人
export const selectWorkGroupPerson = (query = {}) => {
  return request({
    url: '/equipment/workGroupPerson/selectWorkGroupPerson',
    method: 'post',
    data: query,
  });
};
