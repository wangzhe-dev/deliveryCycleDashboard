/*
 * @Author: hupaocai 13767071930@163.com
 * @Date: 2024-10-18 09:10:26
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2025-01-06 11:39:10
 * @FilePath: /mcm-web/src/api/login.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/utils/request'
import { getEDC } from '@/utils/auth';

// 登录方法
export function login(username, password, code, uuid) {
  return request({
    url: '/auth/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: { username, password, code, uuid }
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 刷新方法
export function refreshToken() {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

// 退出方法 统一登录平台
export function logoutByStoken() {
  return request({
    url: '/system/user/sf/logout',
    method: 'get'
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: '/code',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}

// yingyunshi token
export function getYysAuth() {
  return request({
    url: '/stock/yys/api/auth',
    method: 'get'
  })
}


// edc登录
/**
 * 
 * @param {{ userCode: string, timestamp: string, sign: string }} data 
 * @returns 
 */
export function edcLoginCheckSign(data) {
  return request({
    url: '/system/edcLogin/edcLoginCheckSign',
    method: 'post',
    data,
  });
}

// edc退出
export function edcLogout(data) {
  const { per_field1, timestamp, sign } = getEDC()
  return request({
    url: '/system/edcLogin/logout',
    method: 'post',
    data: { userCode: per_field1, timestamp, sign },
  });
}