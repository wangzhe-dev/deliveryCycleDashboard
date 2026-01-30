/*
 * @Author: hupaocai 13767071930@163.com
 * @Date: 2024-10-18 09:10:26
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-12-05 14:54:30
 * @FilePath: /mcm-web/src/utils/auth.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'

const ExpiresInKey = 'Admin-Expires-In'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function getExpiresIn() {
  return Cookies.get(ExpiresInKey) || -1
}

export function setExpiresIn(time) {
  return Cookies.set(ExpiresInKey, time)
}

export function removeExpiresIn() {
  return Cookies.remove(ExpiresInKey)
}

export function getSToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const newToken = urlParams.get('token') || urlParams.get('STOKEN');
  return newToken ? { origin: 'passport', sToken: newToken } : { origin: 'cookie', sToken: Cookies.get('STOKEN') }
}

export function setSToken(token) {
  return Cookies.set('STOKEN', token)
}

export function setUT() {
  return Cookies.set('Ut', '00')
}

export const toggleEDC = (flag = false) => {
  localStorage.setItem('useEdc', flag ? 1 : 0)
}

export const getUseEDC = (flag = false) => {
  return +localStorage.getItem('useEdc')
}

export const setEDC = (edcObj) => {
  localStorage.setItem('edc', JSON.stringify(edcObj))
}

export const getEDC = () => {
  const edcJson = localStorage.getItem('edc')
  return edcJson ? JSON.parse(edcJson) : null
}

export const getEDCSToken = () => {
  const { sToken } = getEDC() || {}
  return sToken
}

export const delEDC = () => {
  localStorage.removeItem('edc')
}
