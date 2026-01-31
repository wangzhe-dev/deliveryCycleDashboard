<!--
 * @Author: wz
 * @Date: 2025-05-29 15:41:07
 * @LastEditors: lj
 * @LastEditTime: 2025-07-02 18:47:26
 * @Description: file content
 * @FilePath: /CMWH/src/layout/components/Sidebar/index.vue
-->
<template>
  <div
    ref="sidebarRef"
    class="sidebar-wrapper"
    :class="{ 'has-logo': showLogo }"
    @mouseleave="handleMouseLeave"
  >
    <!-- 一级菜单 -->
    <el-scrollbar ref="scrollbarRef" class="menu-scrollbar">
      <div
        class="primary-menu-list"
        :style="{
          backgroundColor:
            sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground,
        }"
      >
        <div
          v-for="(route, index) in visibleMenuList"
          :key="route.path + index"
          :class="[
            'primary-menu-item',
            {
              active: isActiveRoute(route) || isHoveredRoute(route),
              'is-home':
                route.name === 'Index' || route.path === '/index' || route.path === 'index',
            },
          ]"
          @mouseenter="handleMouseEnter(route, $event)"
          @click="handleFirstMenuClick(route, $event)"
        >
          <svg-icon
            v-if="route.meta?.icon && route.meta.icon !== '#'"
            class="menu-icon"
            :icon-class="route.meta.icon"
          />
          <span class="menu-title">{{ route.meta?.title }}</span>
          <el-icon
            v-if="hasVisibleChildren(route) && route.name !== 'Index' && route.path !== '/index'"
            class="arrow-icon"
          >
            <arrow-right />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>

    <!-- 弹出的子菜单面板 -->
    <transition name="slide-fade">
      <div
        v-if="popoverVisible && activeFirstMenu && hasVisibleChildren(activeFirstMenu)"
        ref="popoverRef"
        class="submenu-popover"
        :style="popoverInlineStyle"
        @mouseenter="handlePopoverEnter"
        @mouseleave="handlePopoverLeave"
      >
        <div class="submenu-header">
          <span class="submenu-title">
            <svg-icon
              v-if="activeFirstMenu.meta?.icon && activeFirstMenu.meta.icon !== '#'"
              class="menu-icon"
              :icon-class="activeFirstMenu.meta.icon"
            />
            {{ activeFirstMenu.meta?.title }}
          </span>
        </div>
        <el-scrollbar class="popover-scrollbar">
          <div class="tree-menu">
            <template
              v-for="(secondItem, idx) in getVisibleChildren(activeFirstMenu.children)"
              :key="secondItem.name"
            >
              <!-- 二级菜单节点 -->
              <div
                class="tree-node level-2"
                :class="{
                  'is-last': idx === getVisibleChildren(activeFirstMenu.children).length - 1,
                }"
              >
                <div
                  class="tree-node-content"
                  :class="{ 'has-children': hasVisibleChildren(secondItem) }"
                  @click="
                    hasVisibleChildren(secondItem)
                      ? toggleSecondLevel(secondItem.name)
                      : handleMenuClick(secondItem)
                  "
                >
                  <span
                    v-if="hasVisibleChildren(secondItem)"
                    class="tree-arrow"
                    :class="{ expanded: expandedSecondLevel.includes(secondItem.name) }"
                  ></span>
                  <span class="tree-label">{{ secondItem.meta?.title }}</span>
                  <el-icon
                    v-if="hasVisibleChildren(secondItem)"
                    class="tree-expand-icon"
                    :class="{ expanded: expandedSecondLevel.includes(secondItem.name) }"
                  >
                    <arrow-right />
                  </el-icon>
                </div>

                <!-- 三级菜单 -->
                <div
                  v-if="hasVisibleChildren(secondItem)"
                  v-show="expandedSecondLevel.includes(secondItem.name)"
                  class="tree-children"
                >
                  <template
                    v-for="(thirdItem, tIdx) in getVisibleChildren(secondItem.children)"
                    :key="thirdItem.name"
                  >
                    <div
                      class="tree-node level-3"
                      :class="{
                        'is-last': tIdx === getVisibleChildren(secondItem.children).length - 1,
                      }"
                    >
                      <div
                        class="tree-node-content"
                        :class="{ 'has-children': hasVisibleChildren(thirdItem) }"
                        @click="
                          hasVisibleChildren(thirdItem)
                            ? toggleThirdLevel(thirdItem.name)
                            : handleMenuClick(thirdItem)
                        "
                      >
                        <span
                          v-if="hasVisibleChildren(thirdItem)"
                          class="tree-arrow"
                          :class="{ expanded: expandedThirdLevel.includes(thirdItem.name) }"
                        ></span>
                        <span class="tree-label">{{ thirdItem.meta?.title }}</span>
                        <el-icon
                          v-if="hasVisibleChildren(thirdItem)"
                          class="tree-expand-icon"
                          :class="{ expanded: expandedThirdLevel.includes(thirdItem.name) }"
                        >
                          <arrow-right />
                        </el-icon>
                      </div>

                      <!-- 四级菜单 -->
                      <div
                        v-if="hasVisibleChildren(thirdItem)"
                        v-show="expandedThirdLevel.includes(thirdItem.name)"
                        class="tree-children"
                      >
                        <div
                          v-for="(fourthItem, fIdx) in getVisibleChildren(thirdItem.children)"
                          :key="fourthItem.name"
                          class="tree-node level-4"
                          :class="{
                            'is-last': fIdx === getVisibleChildren(thirdItem.children).length - 1,
                          }"
                        >
                          <div class="tree-node-content" @click="handleMenuClick(fourthItem)">
                            <span class="tree-label">{{ fourthItem.meta?.title }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </el-scrollbar>
      </div>
    </transition>

    <!-- 底部折叠按钮 -->
    <div class="collapse-btn">
      <hamburger
        id="hamburger-container"
        :is-active="appStore.sidebar.opened"
        class="hamburger-container"
        @toggleClick="toggleSideBar"
      />
    </div>
  </div>
</template>

<script setup>
import { ArrowRight } from '@element-plus/icons-vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import variables from '@/assets/styles/variables.module.scss';
import Hamburger from '@/components/Hamburger';
import useAppStore from '@/store/modules/app';
import usePermissionStore from '@/store/modules/permission';
import useSettingsStore from '@/store/modules/settings';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const settingsStore = useSettingsStore();
const permissionStore = usePermissionStore();

const scrollbarRef = ref(null);
const popoverRef = ref(null);
const sidebarRef = ref(null);
const lastTriggerEl = ref(null);

// 弹出菜单相关状态
const activeFirstKey = ref(null);
const popoverVisible = ref(false);
const isInPopover = ref(false);
const HEADER_HEIGHT = 65;
const VIEWPORT_PADDING = 16;
const POPOVER_HEIGHT = 480; // 面板预估高度，用于居中计算
const COLLAPSED_SIDEBAR_WIDTH = 54; // 折叠后的侧边栏宽度，与样式保持一致

const popoverStyle = ref({
  top: `${HEADER_HEIGHT}px`,
  height: `${POPOVER_HEIGHT}px`,
});

// 折叠菜单状态
const activeCollapseNames = ref([]);
const expandedSecondLevel = ref([]);
const expandedThirdLevel = ref([]);

const sidebarRouters = computed(() => permissionStore.sidebarRouters);
const showLogo = computed(() => settingsStore.sidebarLogo);
const sideTheme = computed(() => settingsStore.sideTheme);
const popoverLeft = computed(() =>
  appStore.sidebar.opened ? variables.sideBarWidth : `${COLLAPSED_SIDEBAR_WIDTH}px`,
);
const popoverInlineStyle = computed(() => ({
  ...popoverStyle.value,
  left: popoverLeft.value,
}));

// 过滤隐藏菜单，并处理首页路由
const visibleMenuList = computed(() => {
  const result = [];

  sidebarRouters.value.forEach((item) => {
    // 跳过隐藏的路由
    if (item.hidden) return;

    // 特殊处理：如果是只有一个子路由且没有 alwaysShow 标志的路由
    // 直接展示子路由（这是首页的情况）
    if (item.children && item.children.length === 1 && !item.alwaysShow) {
      const child = item.children[0];
      // 使用子路由的信息，但保留父路由的 name
      // 解析子路由的完整路径（子 path 为空时取父 path）
      const childPath = child.path ? resolvePath(child.path, item.path) : item.path;
      result.push({
        ...child,
        name: item.name || child.name,
        path: childPath || item.path,
        redirect: item.redirect || child.redirect,
        meta: child.meta || item.meta,
      });
    } else {
      // 正常路由直接添加
      result.push(item);
    }
  });

  return result;
});

// 当前激活的一级菜单
const activeFirstMenu = computed(() => {
  return sidebarRouters.value.find((item) => item.name === activeFirstKey.value);
});

// 当前路由对应的一级菜单
const currentFirstMenuName = computed(() => {
  const activePath = route.meta?.activeMenu || route.path;
  if (!activePath || /^(https?:|mailto:|tel:)/.test(activePath)) {
    return null;
  }

  const normalizedPath = getNormalPath(activePath);

  // 先在 visibleMenuList 中直接匹配（处理折叠后的单子路由情况）
  for (const item of visibleMenuList.value) {
    const itemPath = getNormalPath(item.path);
    if (itemPath && (normalizedPath === itemPath || normalizedPath.startsWith(`${itemPath}/`))) {
      return item.name;
    }
    // 检查 redirect
    if (item.redirect) {
      const redirectPath = getNormalPath(item.redirect);
      if (normalizedPath === redirectPath) {
        return item.name;
      }
    }
  }

  // 再在原始路由树中递归查找
  return findFirstMenuName(visibleMenuList.value, normalizedPath);
});

// 将一级菜单滚动到当前激活位置
const scrollToActiveFirstMenu = () => {
  nextTick(() => {
    const scrollbar = scrollbarRef.value;
    if (!scrollbar) return;

    const wrap = scrollbar.wrapRef || scrollbar.$refs?.wrapRef;
    const container = scrollbar.$el || scrollbar;
    if (!wrap || !container) return;

    const activeEl = container.querySelector('.primary-menu-item.active');
    if (!activeEl) return;

    const offsetTop = activeEl.offsetTop;
    const targetTop = Math.max(offsetTop - (wrap.clientHeight - activeEl.offsetHeight) / 2, 0);
    if (typeof wrap.scrollTo === 'function') {
      wrap.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      wrap.scrollTop = targetTop;
    }
  });
};

// 获取可见的子菜单
const getVisibleChildren = (children) => {
  if (!children) return [];
  // console.log(children, 'children');
  // return children.filter((item) => !item.hidden && item.name !== 'AioHome');
  return children.filter((item) => !item.hidden);
};

// 判断是否有可见子菜单
const hasVisibleChildren = (item) => {
  return getVisibleChildren(item.children).length > 0;
};

// 判断路由是否激活
const isActiveRoute = (item) => {
  return currentFirstMenuName.value === item.name;
};

// 判断路由是否悬停
const isHoveredRoute = (item) => {
  return activeFirstKey.value === item.name;
};

// 计算弹出面板位置 - 面板顶部对齐触发元素顶部，并确保不超出边界
const calculatePopoverPosition = (triggerEl) => {
  const targetEl = triggerEl || lastTriggerEl.value;

  const viewportHeight = window.innerHeight;
  const minTop = HEADER_HEIGHT;
  const maxBottom = viewportHeight - VIEWPORT_PADDING;
  const maxAvailableHeight = maxBottom - minTop;

  // 面板最大高度
  const popoverHeight = Math.min(POPOVER_HEIGHT, maxAvailableHeight);

  let top = minTop; // 默认从顶部开始

  if (targetEl) {
    lastTriggerEl.value = targetEl;
    const rect = targetEl.getBoundingClientRect();

    // 面板顶部对齐触发元素顶部
    top = rect.top;

    // 边界约束：不能超出顶部
    top = Math.max(top, minTop);

    // 边界约束：不能超出底部
    if (top + popoverHeight > maxBottom) {
      top = maxBottom - popoverHeight;
    }

    // 再次确保不超出顶部
    top = Math.max(top, minTop);
  }

  // 实际可用高度：从 top 到底部边界的距离
  const actualHeight = Math.min(popoverHeight, maxBottom - top);

  popoverStyle.value = {
    top: `${Math.round(top)}px`,
    height: `${Math.round(actualHeight)}px`,
  };
};

// 鼠标进入一级菜单
const handleMouseEnter = (item, event) => {
  // 首页不显示二级面板
  if (item.name === 'Index' || item.path === '/index' || item.path === 'index') {
    popoverVisible.value = false;
    return;
  }

  activeFirstKey.value = item.name;
  if (hasVisibleChildren(item)) {
    if (event?.currentTarget) {
      lastTriggerEl.value = event.currentTarget;
    }
    popoverVisible.value = true;
    nextTick(() => {
      calculatePopoverPosition(event?.currentTarget);
    });
  } else {
    popoverVisible.value = false;
  }
};

// 鼠标离开整个菜单区域
const handleMouseLeave = () => {
  setTimeout(() => {
    if (!isInPopover.value) {
      activeFirstKey.value = null;
      popoverVisible.value = false;
    }
  }, 100);
};

// 鼠标进入弹出面板
const handlePopoverEnter = () => {
  isInPopover.value = true;
};

// 鼠标离开弹出面板
const handlePopoverLeave = () => {
  isInPopover.value = false;
  activeFirstKey.value = null;
  popoverVisible.value = false;
};

const closePopover = () => {
  isInPopover.value = false;
  activeFirstKey.value = null;
  popoverVisible.value = false;
};

// 规范化路径（参考 SidebarItem 的逻辑）
function getNormalPath(path = '') {
  if (!path || path === 'undefined') {
    return path;
  }
  const newPath = `${path}`.replace('//', '/').replace(/\/+$/, ''); // 移除末尾的斜杠
  return newPath.startsWith('/') ? newPath : `/${newPath}`;
}

// 解析路由完整路径（参考 SidebarItem 的 resolvePath 逻辑）
function resolvePath(routePath = '', basePath = '') {
  // 如果是外部链接，直接返回
  if (/^(https?:|mailto:|tel:)/.test(routePath)) {
    return routePath;
  }
  if (/^(https?:|mailto:|tel:)/.test(basePath)) {
    return basePath;
  }

  const normalizedBase = getNormalPath(basePath) || '';
  // 拼接路径
  const fullPath = normalizedBase ? `${normalizedBase}/${routePath}` : routePath;
  return getNormalPath(fullPath);
}

// 根据当前路由查找对应的一级菜单
function findFirstMenuName(menus, targetPath, basePath = '') {
  if (!Array.isArray(menus)) {
    return null;
  }

  for (const menu of menus) {
    if (!menu || menu.hidden) continue;

    const fullPath = resolvePath(menu.path || '', basePath);
    const isExternalLink = /^(https?:|mailto:|tel:)/.test(fullPath);
    const normalizedFullPath = isExternalLink ? '' : getNormalPath(fullPath);
    const nextBasePath = normalizedFullPath || basePath;

    if (
      normalizedFullPath &&
      (targetPath === normalizedFullPath || targetPath.startsWith(`${normalizedFullPath}/`))
    ) {
      return menu.name;
    }

    if (menu.children && menu.children.length) {
      const childMatch = findFirstMenuName(
        menu.children.filter((child) => !child.hidden),
        targetPath,
        nextBasePath,
      );
      if (childMatch) {
        return menu.name;
      }
    }
  }

  return null;
}

// 查找菜单项的完整路径（带 basePath 的递归查找）
const findFullPath = (item) => {
  const findPath = (routes, targetItem, parentPath = '') => {
    for (const route of routes) {
      // 构建当前路由的完整路径
      const currentPath = resolvePath(route.path, parentPath);

      // 如果找到目标项，直接返回当前完整路径
      if (route.name === targetItem.name || route === targetItem) {
        return currentPath;
      }

      // 递归查找子路由
      if (route.children && route.children.length > 0) {
        for (const child of route.children) {
          if (child === targetItem || child.name === targetItem.name) {
            return resolvePath(child.path, currentPath);
          }

          // 继续递归查找
          const found = findPath(route.children, targetItem, currentPath);
          if (found) return found;
        }
      }
    }
    return null;
  };

  return findPath(sidebarRouters.value, item);
};

// 点击菜单项
const handleMenuClick = (item) => {
  if (item.meta?.link) {
    // 外部链接
    window.open(item.meta.link, '_blank');
    closePopover();
    return;
  }

  try {
    // 查找完整路径
    let targetPath = findFullPath(item);

    // 如果没找到，尝试直接使用 item.path
    if (!targetPath) {
      targetPath = getNormalPath(item.path);
    }

    // 如果路径为空或根路径，尝试用 redirect
    if (!targetPath || targetPath === '/') {
      const originalRoute = sidebarRouters.value.find((r) => r.name === item.name);
      if (originalRoute?.redirect) {
        targetPath = originalRoute.redirect;
      }
    }

    // 跳转路由
    router.push(targetPath).catch((err) => {
      console.error('路由跳转失败:', err, '目标路径:', targetPath);
    });

    // 点击后关闭弹出面板
    closePopover();
  } catch (error) {
    console.error('路由跳转错误:', error);
  }
};

// 切换二级菜单展开/折叠
const toggleSecondLevel = (name) => {
  const index = expandedSecondLevel.value.indexOf(name);
  if (index > -1) {
    expandedSecondLevel.value.splice(index, 1);
  } else {
    expandedSecondLevel.value.push(name);
  }
};

// 切换三级菜单展开/折叠
const toggleThirdLevel = (name) => {
  const index = expandedThirdLevel.value.indexOf(name);
  if (index > -1) {
    expandedThirdLevel.value.splice(index, 1);
  } else {
    expandedThirdLevel.value.push(name);
  }
};

// 点击一级菜单
const handleFirstMenuClick = (item, event) => {
  // 首页或者没有子菜单的直接跳转
  if (
    item.name === 'Index' ||
    item.path === '/index' ||
    item.path === 'index' ||
    !hasVisibleChildren(item)
  ) {
    handleMenuClick(item);
  } else {
    // 有子菜单的，点击也打开面板
    activeFirstKey.value = item.name;
    if (event?.currentTarget) {
      lastTriggerEl.value = event.currentTarget;
    }
    popoverVisible.value = true;
    nextTick(() => {
      calculatePopoverPosition(event?.currentTarget);
    });
  }
};

function toggleSideBar() {
  appStore.toggleSideBar();
}

const updatePopoverOnViewportChange = () => {
  if (!popoverVisible.value) return;
  nextTick(() => calculatePopoverPosition());
};

const handleDocumentPointerDown = (event) => {
  if (!popoverVisible.value) return;
  const target = event.target;
  if (!target) return;

  const popoverEl = popoverRef.value;
  const sidebarEl = sidebarRef.value;
  if (popoverEl?.contains(target) || sidebarEl?.contains(target)) {
    return;
  }

  closePopover();
};

// 监听折叠菜单变化，不需要重新计算位置，因为高度是固定的，内容会滚动
watch(
  [activeCollapseNames, expandedSecondLevel, expandedThirdLevel],
  () => {
    // 折叠展开时，滚动条会自动处理，不需要重新计算位置
  },
  { deep: true },
);

// 路由切换时滚动到激活的一级菜单
watch(
  () => currentFirstMenuName.value,
  () => {
    scrollToActiveFirstMenu();
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener('resize', updatePopoverOnViewportChange, { passive: true });
  window.addEventListener('scroll', updatePopoverOnViewportChange, { passive: true });
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  scrollToActiveFirstMenu();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePopoverOnViewportChange);
  window.removeEventListener('scroll', updatePopoverOnViewportChange);
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
});
</script>

<style lang="scss">
@import '@/assets/styles/variables.module.scss';

.sidebar-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: visible;
  position: relative;

  .menu-scrollbar {
    flex: 1;

    :deep(.el-scrollbar__view) {
      padding: 8px 0;
    }
  }

  .primary-menu-list {
    padding: 8px 0;
  }

  .primary-menu-item {
    height: 56px;
    padding: 0 20px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
    margin: 2px 0;
    position: relative;

    .menu-icon {
      font-size: 20px;
      color: #0679dc;
      flex-shrink: 0;
    }

    .menu-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .arrow-icon {
      font-size: 14px;
      color: #999;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    &:hover {
      background-color: rgba(6, 121, 220, 0.08);

      .arrow-icon {
        color: #0679dc;
        transform: translateX(2px);
      }
    }

    &.active {
      background: linear-gradient(90deg, #1e3a5f 0%, #2a5a8f 100%);
      color: #fff;
      border-left-color: #3b7dcc;

      .menu-icon {
        color: #fff;
      }

      .menu-title {
        font-weight: 700;
        color: #fff;
      }

      .arrow-icon {
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }

  // 弹出面板 - 使用固定高度，内部滚动
  .submenu-popover {
    width: 320px;
    position: fixed;
    left: $base-sidebar-width;
    background: #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    z-index: 2600; // higher than loading mask (2000) so it stays visible while lists load
    overflow: hidden;
    margin-left: 4px;
    display: flex;
    flex-direction: column;
  }

  // 弹出面板头部 - 固定在顶部
  .submenu-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafbfc;
    flex-shrink: 0;
  }

  .submenu-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    display: inline-flex;
    align-items: center;
    gap: 8px;

    .menu-icon {
      font-size: 18px;
      color: #0679dc;
    }
  }

  // 滚动区域 - 关键：必须有明确的高度限制
  .popover-scrollbar {
    flex: 1;
    min-height: 0;
    overflow: hidden;

    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
      overflow-y: scroll; // 强制显示滚动条
    }

    :deep(.el-scrollbar__bar.is-vertical) {
      opacity: 1; // 始终显示滚动条
    }
  }

  // 树形菜单
  .tree-menu {
    padding: 8px 0;
  }

  // 连接线颜色
  $line-color: #d0d0d0;

  .tree-node {
    position: relative;

    // 二级节点
    &.level-2 {
      > .tree-node-content {
        padding: 10px 16px;
        font-weight: 500;
      }

      > .tree-children {
        position: relative;
        margin-left: 24px;
        padding-left: 16px;

        // 垂直连接线 - 从顶部到最后一个子节点中心
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 18px; // 留出最后一个节点中心以下的空间
          width: 1px;
          background: $line-color;
        }
      }
    }

    // 三级节点
    &.level-3 {
      position: relative;

      // 水平连接线
      &::before {
        content: '';
        position: absolute;
        left: -16px;
        top: 18px;
        width: 16px;
        height: 1px;
        background: $line-color;
      }

      // 垂直连接线 - 连接兄弟节点
      &:not(.is-last)::after {
        content: '';
        position: absolute;
        left: -16px;
        top: 18px;
        bottom: -18px; // 延伸到下一个兄弟节点的中心
        width: 1px;
        background: $line-color;
      }

      > .tree-node-content {
        padding: 9px 16px;
      }

      > .tree-children {
        position: relative;
        margin-left: 16px;
        padding-left: 16px;

        // 垂直连接线
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 16px;
          width: 1px;
          background: $line-color;
        }
      }
    }

    // 四级节点
    &.level-4 {
      position: relative;

      // 水平连接线
      &::before {
        content: '';
        position: absolute;
        left: -16px;
        top: 16px;
        width: 16px;
        height: 1px;
        background: $line-color;
      }

      // 垂直连接线 - 连接兄弟节点
      &:not(.is-last)::after {
        content: '';
        position: absolute;
        left: -16px;
        top: 16px;
        bottom: -16px;
        width: 1px;
        background: $line-color;
      }

      > .tree-node-content {
        padding: 8px 16px;
      }
    }
  }

  .tree-node-content {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 4px;
    margin: 0 8px 2px 0;

    &:hover {
      background: #f0f7ff;

      .tree-label {
        color: #0679dc;
      }

      .tree-expand-icon {
        color: #0679dc;
      }
    }

    &.has-children {
      .tree-label {
        flex: 1;
      }
    }
  }

  .tree-arrow {
    display: none;
  }

  .tree-label {
    font-size: 16px;
    color: #1a1a1a;
    flex: 1;
    line-height: 1.5;
  }

  .tree-expand-icon {
    font-size: 12px;
    color: #999;
    transition: transform 0.2s ease;
    margin-left: 8px;

    &.expanded {
      transform: rotate(90deg);
      color: #0679dc;
    }
  }

  .tree-children {
    overflow: hidden;
  }

  .collapse-btn {
    height: 48px;
    line-height: 48px;
    text-align: center;
    border-top: 1px solid #e4e7ed;
    background: rgba(0, 0, 0, 0.02);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.3s;
    flex-shrink: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .hamburger-container {
      width: 100%;
      line-height: inherit;
      height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      .hamburger {
        width: 20px;
        height: 20px;
        vertical-align: middle;
        fill: currentColor;
        transition: transform 0.3s ease;
        &.is-active {
          transform: rotate(180deg);
        }
      }
    }
  }
}

// 动画
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.15s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>
