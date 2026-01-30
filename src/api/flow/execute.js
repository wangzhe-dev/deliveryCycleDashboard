/*
 * @Author: zhaijinsong
 * @Date: 2024-08-14 15:43:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-08-22 11:12:47
 * @Description:
 */
import request from '@/utils/request';

// 查询待办任务列表
export function toDoPage(query) {
  return request({
    url: '/warmFlow/execute/toDoPage',
    method: 'get',
    params: query,
  });
}

// 查询已办任务列表
export function donePage(query) {
  return request({
    url: '/warmFlow/execute/donePage',
    method: 'get',
    params: query,
  });
}

// 查询抄送任务列表
export function copyPage(query) {
  return request({
    url: '/warmFlow/execute/copyPage',
    method: 'get',
    params: query,
  });
}

// 查询已办任务列表
export function doneList(instanceId) {
  return request({
    url: '/warmFlow/execute/doneList/' + instanceId,
    method: 'get',
  });
}

// 查询跳转任意节点列表
export function anyNodeList(instanceId, nodeCode) {
  return request({
    url: '/warmFlow/execute/anyNodeList/' + instanceId + '/' + nodeCode,
    method: 'get',
  });
}

// 转办|加签|委派|减签
export function interactiveType(taskId, assigneePermission, operatorType) {
  return request({
    url: '/warmFlow/execute/interactiveType',
    method: 'post',
    data: {
      taskId: taskId,
      addHandlers: assigneePermission,
      operatorType: operatorType,
    },
  });
}

// 查询跳转任意节点列表
export function getTaskById(taskId) {
  return request({
    url: '/warmFlow/execute/getTaskById/' + taskId,
    method: 'get',
  });
}
// 审核｜驳回
export function handle(taskId, skipType, message, nodeCode) {
  return request({
    url: '/warmFlow/execute/handle',
    method: 'post',
    data: {
      taskId: taskId,
      nodeCode: nodeCode,
      skipType: skipType,
      message: message,
    },
  });
}
