<!--
 * @Author: heqi 17686373732@163.com
 * @Date: 2023-08-02 16:54:44
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-04-23 09:49:04
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition v-if="flag" name="fade-transform" mode="out-in">
        <keep-alive :include="tagsViewStore.cachedViews">
          <component v-if="!route.meta.link" :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
      <keep-alive v-else :include="tagsViewStore.cachedViews">
        <component v-if="!route.meta.link" :is="Component" :key="route.path" />
      </keep-alive>
    </router-view>
    <iframe-toggle />
  </section>
</template>

<script setup>
import iframeToggle from './IframeToggle/index';
import useTagsViewStore from '@/store/modules/tagsView';
const flag = import.meta.env.VITE_APP_ENV === 'production';
const tagsViewStore = useTagsViewStore();
</script>

<style lang="scss" scoped>
.app-main {
  /* 80= topHeader  80  */
  max-height: calc(100vh - 80px);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.fixed-header + .app-main {
  padding-top: 50px;
}

.hasTagsView {
  .app-main {
    /* 120 = tapHeader + tags-view = 80 + 40 */
    height: calc(100vh - 100px);
  }

  .fixed-header + .app-main {
    padding-top: 84px;
  }
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 6px;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background-color: #c0c0c0;
  border-radius: 3px;
}
</style>
