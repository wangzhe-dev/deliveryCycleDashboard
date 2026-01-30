/*
 * @Author: zhaijinsong
 * @Date: 2023-08-01 13:23:17
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-12-06 09:42:18
 * @Description:
 */
import router from './router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import useSettingsStore from '@/store/modules/settings';

NProgress.configure({ showSpinner: false });

router.beforeEach((to, from, next) => {
  NProgress.start();
  if (to.meta?.title) {
    useSettingsStore().setTitle(to.meta.title);
  }
  next();
});

router.afterEach(() => {
  NProgress.done();
});
