import request from '@/utils/request';

// 分页查询
export function page(data) {
  return request({
    url: '/logistics/wlBmFrameType/page',
    method: 'post',
    data: data,
  });
}

// 单条详情
export function getInfo(id) {
  return request({
    url: '/logistics/wlBmFrameType/selectOne',
    method: 'get',
    params: { id },
  });
}

// 新增
export function add(data) {
  return request({
    url: '/logistics/wlBmFrameType/add',
    method: 'post',
    data: data,
  });
}

// 修改
export function update(data) {
  return request({
    url: '/logistics/wlBmFrameType/update',
    method: 'put',
    data: data,
  });
}

// 单条删除
export function del(id) {
  return request({
    url: '/logistics/wlBmFrameType/delete',
    method: 'delete',
    params: { id },
  });
}

// 批量删除
export function deleteBatch(ids) {
  return request({
    url: '/logistics/wlBmFrameType/deleteBatch',
    method: 'delete',
    params: { ids: ids.join(',') },
  });
}

// 导出
export function exportData(data) {
  return request({
    url: '/logistics/wlBmFrameType/export',
    method: 'post',
    data: data,
    responseType: 'blob',
  });
}

// 导入
export function importData(data) {
  return request({
    url: '/logistics/wlBmFrameType/import',
    method: 'post',
    data: data,
  });
}

// 导入模板
export function downloadTemplate() {
  return request({
    url: '/logistics/wlBmFrameType/temp',
    method: 'post',
    responseType: 'blob',
  });
}
