/*
 * @Author: zhaijinsong
 * @Date: 2023-08-24 13:12:17
 * @LastEditors: liangjia
 * @LastEditTime: 2025-07-17 17:06:14
 * @Description:
 */
import {
  login,
  logout,
  getInfo,
  logoutByStoken,
  getYysAuth,
  edcLoginCheckSign,
  edcLogout,
} from '@/api/login';
import { getToken, setToken, removeToken, setEDC, toggleEDC } from '@/utils/auth';
import defAva from '@/assets/images/profile.png';
import { getUseEDC, delEDC } from '../../utils/auth';
import { encrypt, decrypt } from '@/utils/jsencrypt';
const useSTOKEN = +import.meta.env.VITE_APP_USE_STOKEN;
const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    userInfo: {}, // 用户详情
    name: '',
    nickName: '',
    userId: '',
    avatar: '',
    isShowAvatar: false,
    roles: [],
    permissions: [],
    yingYunShiToken: '',
    employeeNumber: '',
  }),
  actions: {
    // 登录
    login(userInfo) {
      const username = userInfo.username.trim();
      const password = encrypt(userInfo.password);
      const code = userInfo.code;
      const uuid = userInfo.uuid;
      return new Promise((resolve, reject) => {
        login(username, password, code, uuid)
          .then((res) => {
            let data = res.data;
            setToken(data.access_token);
            this.token = data.access_token;
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    // 获取用户信息
    getInfo() {
      return new Promise((resolve, reject) => {
        getInfo()
          .then((res) => {
            // this.getYingYunShiToken();
            const user = res.user || {};
            const avatar = user.avatar == '' || user.avatar == null ? defAva : user.avatar;

            if (res.roles && res.roles.length > 0) {
              // 验证返回的roles是否是一个非空数组
              this.roles = res.roles;
              this.permissions = res.permissions;
            } else {
              this.roles = ['ROLE_DEFAULT'];
              reject({ ...res });
            }
            this.name = user.userName;
            this.nickName = user.nickName;
            this.userId = user.userId;
            this.avatar = avatar;
            this.isShowAvatar = !!user.avatar;
            this.employeeNumber = user.employeeNumber;
            this.userInfo = user;
            resolve(res);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    // 退出系统
    logOut() {
      return new Promise((resolve, reject) => {
        // location.href = import.meta.env.VITE_APP_PASSPORT_LOGIN_PAGE
        const logoutHandler = useSTOKEN ? logoutByStoken : getUseEDC() ? edcLogout : logout;
        logoutHandler(this.token)
          .then(() => {
            this.token = '';
            this.roles = [];
            this.nickName = '';
            this.userId = '';
            this.permissions = [];
            this.employeeNumber = '';

            // delEDC();
            // toggleEDC(false);
            removeToken();
            resolve(true);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    getYingYunShiToken() {
      getYysAuth()
        .then((res) => {
          this.yingYunShiToken = res.data
            ? JSON.parse(res.data).data?.access_token
            : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJST0xFIjp7ImVudGVycHJpc2VfaWQiOiIxODUiLCJlbnRlcnByaXNlX25hbWUiOiLpsrjoiKrlt6XkuJoiLCJyb2xlX2lkIjoiMjAxIiwicm9sZV9uYW1lIjoi5bmz5Y-w566h55CG5ZGYIiwidXNlcl9pZCI6ImY3MjAyYWYxMzhkOTQxOTk5MTg2ZWFhMzU1MzhmMjA0IiwidXNlcl9uYW1lIjoi6bK46Iiq5bel5Lia5bmz5Y-w5a-55o6l6LSm5oi3Iiwic3R5bGVfa2V5IjoiIzIzNzdmYyJ9LCJhdWQiOiJmNzIwMmFmMTM4ZDk0MTk5OTE4NmVhYTM1NTM4ZjIwNCIsImV4cCI6MTcxNTc2ODQxOH0.HIrVgEufKHPVsfLrnBYqVEaTpVdnh5tz-qFbFIzIAyw';
        })
        .catch((error) => {
          console.log(error, 'getYysAuth-error');
        });
    },

    // edc 统一登录校验
    edcCheckLogin() {
      return new Promise((resolve, reject) => {
        if (location.pathname.includes('/center')) {
          const urlParams = new URLSearchParams(window.location.search);
          const userCode = urlParams.get('userCode');
          const timestamp = urlParams.get('timestamp');
          const sign = urlParams.get('sign');

          if (userCode && timestamp && sign) {
            toggleEDC(true);
            edcLoginCheckSign({ userCode, timestamp, sign })
              .then(({ data }) => {
                setEDC({ per_field1: userCode, timestamp, sign, sToken: data });
                resolve(true);
              })
              .catch((e) => {
                reject(false);
              });
            return;
          }
        }

        // 普通登录
        toggleEDC(false);
        getToken() ? resolve(true) : reject(false);
      });
    },
  },
});

export default useUserStore;
