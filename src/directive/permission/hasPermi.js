/*
 * @Author: zhaijs
 * @Date: 2023-07-28 11:21:43
 * @LastEditTime: 2024-03-14 16:25:34
 * @Description: 请填写简介
 */
/**
 * v-hasPermi 操作权限处理
 * Copyright (c) 2019 jne
 */

import useUserStore from '@/store/modules/user';

export default {
  mounted(el, binding, vnode) {
    if (!el.parentNode) return;
    const { value } = binding;
    const all_permission = '*:*:*';
    const permissions = useUserStore().permissions;

    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value;

      const hasPermissions = permissions.some((permission) => {
        return all_permission === permission || permissionFlag.includes(permission);
      });

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error(`请设置操作权限标签值`);
    }
  },
};
