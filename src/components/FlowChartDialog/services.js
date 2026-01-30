import request from '@/utils/request';

export function flowRecordList(data = {}) {
  return request({
    url: '/warmFlow/execute/recordList',
    method: 'post',
    data,
  });
}
