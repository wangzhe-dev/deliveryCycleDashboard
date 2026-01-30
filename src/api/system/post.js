/*
 * @Author: hupaocai 13767071930@163.com
 * @Date: 2024-08-26 16:33:43
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-08-27 09:51:23
 * @FilePath: /mcm-web/src/api/system/post.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/utils/request'

// 查询岗位列表
export function listPost(query) {
  return request({
    url: '/erpMaster/employee/queryPostList',
    // url: '/system/post/list',
    method: 'post',
    data: query
  })
}

// 查询岗位详细
export function getPost(postId) {
  return request({
    url: '/system/post/' + postId,
    method: 'get'
  })
}

// 新增岗位
export function addPost(data) {
  return request({
    url: '/system/post',
    method: 'post',
    data: data
  })
}

// 修改岗位
export function updatePost(data) {
  return request({
    url: '/system/post',
    method: 'put',
    data: data
  })
}

// 删除岗位
export function delPost(postId) {
  return request({
    url: '/system/post/' + postId,
    method: 'delete'
  })
}
