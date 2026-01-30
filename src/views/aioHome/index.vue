<template>
  <div class="app-container wsll-table aio-home">
    <div class="aio-home__wrapper">
      <!-- 顶部头部区域 -->
      <header class="aio-home__header">
        <div class="aio-home__header-left">
          <img
            class="aio-home__logo"
            src="../../assets/images/header-logo-jl.png"
            alt="CMI WEIHAI SHIPYARD"
          />
        </div>
        <div class="aio-home__header-right">
          <div class="aio-home__time-block">
            <div class="aio-home__time">{{ timeText }}</div>
            <div class="aio-home__date">{{ dateText }}</div>
          </div>
          <div class="aio-home__weather">
            <SmartWeatherBar />
          </div>
        </div>
      </header>

      <!-- 中间上半部分：左侧banner + 右侧常用信息 -->
      <section class="aio-home__top">
        <div class="aio-home__banner">
          <img
            class="aio-home__banner-img"
            src="../../assets/images/aioHome/steamship.png"
            alt="高效管理生产流程 提升车间运营效率"
          />
          <div class="aio-home__banner-mask"></div>
          <!-- <div class="aio-home__banner-text">
            <p>高效管理生产流程</p>
            <p>提升车间运营效率</p>
          </div>-->
        </div>

        <div class="aio-home__panel">
          <div class="aio-home__panel-header">
            <span class="aio-home__panel-bar"></span>
            <span class="aio-home__panel-title">常用信息</span>
          </div>
          <div class="aio-home__panel-body">
            <div
              v-for="item in commonList"
              :key="item.label"
              class="aio-home__shortcut"
              :class="{ 'aio-home__shortcut--disabled': !item.hasPermission }"
              @click="handleShortcutClick(item)"
            >
              <div class="aio-home__shortcut-icon">
                <img :src="item.icon" :alt="item.label" />
              </div>
              <div class="aio-home__shortcut-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 下半部分：功能入口卡片 -->
      <section class="aio-home__bottom">
        <div
          v-for="item in entryList"
          :key="item.label"
          class="aio-home__card"
          :class="{
            'aio-home__card--todo': item.status === 'todo',
            'aio-home__card--disabled': !item.hasPermission,
          }"
          @click="handleEntryClick(item)"
        >
          <div class="aio-home__card-bg"></div>
          <div class="aio-home__card-main">
            <div class="aio-home__card-icon">
              <img :src="item.icon" :alt="item.label" />
            </div>
            <div class="aio-home__card-label">{{ item.label }}</div>
          </div>
          <div v-if="item.status === 'todo'" class="aio-home__card-tag">待开发</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup name="AioHome">
import iconWorkOrder from '@/assets/images/aioHome/gongdanbaogong.png';
import iconTimeReport from '@/assets/images/aioHome/gongshibaogong.png';
import iconProcessReport from '@/assets/images/aioHome/gongxubaogong.png';
import iconPrecisionGrey from '@/assets/images/aioHome/jingdujiance_gray.png';
import iconAttendance from '@/assets/images/aioHome/kaoqindaka.png';
import cardBg from '@/assets/images/aioHome/smallCard.png';

import { default as iconFeed, default as iconFeedGrey } from '@/assets/images/aioHome/sxqk1.png';
import iconFlawGrey from '@/assets/images/aioHome/tanshangjiance_gray.png';
import iconAbnormal from '@/assets/images/aioHome/yichangandeng.png';
import iconAbnormalGrey from '@/assets/images/aioHome/yichangandeng_gray.png';
import iconQualityFill from '@/assets/images/aioHome/zhijianbaogao.png';
import iconQualityGrey from '@/assets/images/aioHome/zhiliangjiance_gray.png';
import usePermissionStore from '@/store/modules/permission';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import SmartWeatherBar from './components/SmartWeatherBar.vue';
const permissionStore = usePermissionStore();
const router = useRouter();
const timeText = ref('');
const dateText = ref('');
let timer = null;

const flattenTree = (tree = [], childrenKey = 'children') => {
  const res = [];
  const stack = Array.isArray(tree) ? [...tree] : [];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue;
    const { [childrenKey]: children, ...rest } = node;
    res.push(rest);
    if (Array.isArray(children) && children.length) {
      stack.unshift(...children);
    }
  }
  return res;
};
const flattenedRouters = [flattenTree(permissionStore.sidebarRouters)];

// 路由权限映射配置（每个功能对应的路由标识）
const routePermissionMap = {
  工单报工: { name: 'WorkOrderReport' },
  工序报工: { name: 'IntegratedMachine/processLeveReport/index' },
  工位报工: { name: 'WorkstationReport' },
  异常安灯: { name: 'ExceptionHandling' },
  质量检测: { name: 'QualityInspectionPlan/index', fuzzy: true },
  精度检测: { name: 'QualityInspectionPlan/index', fuzzy: true },
  探伤检测: { name: 'QualityInspectionPlan/index', fuzzy: true },
  集配合盘: { name: 'CompositeOrder' },
  质检填报: { name: 'QualityInspectionFill' },
};

// 检查路由权限
const checkRoutePermission = (label) => {
  const config = routePermissionMap[label];
  if (!config) return false;

  // ReportManage
  return flattenedRouters.some((route) => {
    if (config.name) {
      if (config.fuzzy) {
        // 模糊匹配
        return route?.includes(config.name);
      }
      // 精确匹配
      return route.some((r) => r.name === config.name);
    }
    return false;
  });
};

// 动态计算带权限的列表
const commonList = computed(() => [
  { label: '工单报工', icon: iconWorkOrder, hasPermission: checkRoutePermission('工单报工') },
  { label: '工序报工', icon: iconProcessReport, hasPermission: checkRoutePermission('工序报工') },
  { label: '集配合盘', icon: iconFeedGrey, hasPermission: checkRoutePermission('集配合盘') },
  { label: '异常安灯', icon: iconAbnormalGrey, hasPermission: checkRoutePermission('异常安灯') },
  { label: '质量检测', icon: iconQualityGrey, hasPermission: checkRoutePermission('质量检测') },
  { label: '精度检测', icon: iconPrecisionGrey, hasPermission: checkRoutePermission('精度检测') },
  { label: '探伤检测', icon: iconFlawGrey, hasPermission: checkRoutePermission('探伤检测') },
]);

const entryList = computed(() => [
  { label: '工单报工', icon: iconWorkOrder, hasPermission: checkRoutePermission('工单报工') },
  { label: '工序报工', icon: iconProcessReport, hasPermission: checkRoutePermission('工序报工') },
  { label: '工位报工', icon: iconTimeReport, hasPermission: checkRoutePermission('工位报工') },
  { label: '集配合盘', icon: iconFeed, hasPermission: checkRoutePermission('集配合盘') },
  { label: '质检填报', icon: iconQualityFill, hasPermission: checkRoutePermission('质检填报') },
  { label: '异常安灯', icon: iconAbnormal, hasPermission: checkRoutePermission('异常安灯') },
  { label: '考勤打卡', icon: iconAttendance, status: 'todo', hasPermission: false },
]);

function goToWorkOrderReport() {
  router.push({
    name: 'WorkOrderReport',
  });
}

function resolveQualityPlanPath() {
  const routes = router.getRoutes();
  const includeRe = /(qualityInspectionPlan|质检计划|质量检测计划)/i;
  const excludeRe = /(qualityInspectionFill|质检填报|qualityInspectionRules|质检规则)/i;

  for (const route of routes) {
    const name = route.name ? String(route.name) : '';
    const path = route.path || '';
    const title = route.meta?.title ? String(route.meta.title) : '';
    const haystack = `${name} ${path} ${title}`;
    if (includeRe.test(haystack) && !excludeRe.test(haystack)) {
      return path;
    }
  }

  return '';
}

// 路由映射配置
const routeMap = {
  工单报工: () => goToWorkOrderReport(),
  工序报工: () => router.push({ name: 'IntegratedMachine/processLeveReport/index' }),
  工位报工: () => router.push({ name: 'WorkstationReport' }),
  异常安灯: () => router.push({ name: 'ExceptionHandling' }),
  质量检测: () =>
    router.push({
      path: resolveQualityPlanPath() || '/qualityInspection/qualityInspectionPlan/index',
      query: { tab: 'quality' },
    }),
  精度检测: () =>
    router.push({
      path: resolveQualityPlanPath() || '/qualityInspection/qualityInspectionPlan/index',
      query: { tab: 'precision' },
    }),
  探伤检测: () =>
    router.push({
      path: resolveQualityPlanPath() || '/qualityInspection/qualityInspectionPlan/index',
      query: { tab: 'flaw' },
    }),
  集配合盘: () => router.push({ name: 'CompositeOrder' }),
  质检填报: () => router.push({ name: 'QualityInspectionFill' }),
};

function handleShortcutClick(item) {
  if (!item.hasPermission) {
    return;
  }
  routeMap[item.label]?.();
}

function handleEntryClick(item) {
  if (!item.hasPermission || item.status === 'todo') {
    return;
  }
  routeMap[item.label]?.();
}

function updateTime() {
  const now = new Date();
  const hours = now
    .getHours()
    .toString()
    .padStart(2, '0');
  const minutes = now
    .getMinutes()
    .toString()
    .padStart(2, '0');
  timeText.value = `${hours}:${minutes}`;

  const weekMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const week = weekMap[now.getDay()];
  dateText.value = `${month}月${date}日 ${week}`;
}

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 60 * 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

const cardBgUrl = cardBg;
</script>

<style lang="scss" scoped>
.app-container {
  padding: 0 20px 20px 20px !important;
}
.aio-home {
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background: url('../../assets/images/aioHome/bg@2x.png') no-repeat center/cover;
  .aio-home__wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0 32px 20px 32px;
    color: #fff;
  }

  .aio-home__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .aio-home__header-left {
      display: flex;
      align-items: center;
    }

    .aio-home__logo {
      height: 100px !important;
      display: block;
    }

    .aio-home__header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 14px;

      .aio-home__time-block {
        text-align: right;
      }

      .aio-home__time {
        font-size: 26px;
        font-weight: 600;
      }

      .aio-home__date {
        font-size: 14px;
      }

      .aio-home__weather-icon {
        font-size: 24px;
      }
    }
  }

  .aio-home__top {
    display: grid;
    grid-template-columns: 2fr 1.5fr;
    gap: 18px;
    margin-bottom: 16px;
    min-height: 230px;
  }

  .aio-home__banner {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);

    .aio-home__banner-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .aio-home__banner-mask {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.2), transparent 40%);
    }

    .aio-home__banner-text {
      position: absolute;
      left: 40px;
      bottom: 40px;
      font-size: 24px;
      font-weight: 600;
      line-height: 1.5;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    }
  }

  .aio-home__panel {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 16px 20px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
    color: #333;
    display: flex;
    flex-direction: column;
  }

  .aio-home__panel-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .aio-home__panel-bar {
      width: 4px;
      height: 18px;
      border-radius: 4px;
      background: #246dff;
      margin-right: 8px;
    }

    .aio-home__panel-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .aio-home__panel-body {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px 10px;
    flex: 1;
  }

  .aio-home__shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: opacity 0.3s;

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  .aio-home__shortcut-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
      display: block;
    }
  }

  .aio-home__shortcut-label {
    font-size: 13px;
    color: #333;
  }

  .aio-home__bottom {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    grid-auto-rows: minmax(96px, 1fr);
  }

  .aio-home__card {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    color: #333;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: opacity 0.3s;

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  .aio-home__card-bg {
    position: absolute;
    inset: 0;
    background: url('../../assets/images/aioHome/icon-卡片@2x.png') no-repeat right bottom;
    background-size: 55% auto;
    opacity: 0.8;
    pointer-events: none;
  }

  .aio-home__card-main {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .aio-home__card-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
      display: block;
    }
  }

  .aio-home__card-label {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .aio-home__card-tag {
    position: absolute;
    top: 10px;
    right: 18px;
    padding: 4px 10px;
    border-radius: 20px;
    background: linear-gradient(90deg, #f5f5f5, #ffffff);
    font-size: 12px;
    color: #b3b3b3;
    border: 1px solid #e1e1e1;
  }

  .aio-home__card--todo {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

@media (max-width: 1920px) and (max-height: 1080px) {
  .aio-home {
    .aio-home__wrapper {
      padding: 0px 28px;
    }

    .aio-home__header {
      margin-bottom: 12px;

      .aio-home__logo {
        height: 100px !important;
      }

      .aio-home__time {
        font-size: 24px;
      }
    }

    .aio-home__top {
      gap: 16px;
      margin-bottom: 12px;
      min-height: 220px;
    }

    .aio-home__panel {
      padding: 14px 18px;
    }

    .aio-home__panel-title {
      font-size: 15px;
    }

    .aio-home__panel-body {
      gap: 10px 8px;
    }

    .aio-home__shortcut-icon {
      width: 38px;
      height: 38px;
    }

    .aio-home__shortcut-label {
      font-size: 12px;
    }

    .aio-home__bottom {
      gap: 12px;
      grid-auto-rows: minmax(88px, 1fr);
    }

    .aio-home__card {
      padding: 16px 20px;
    }

    .aio-home__card-icon {
      width: 44px;
      height: 44px;
    }

    .aio-home__card-label {
      font-size: 15px;
    }
  }
}

@media (orientation: portrait), (max-aspect-ratio: 3/4) {
  .aio-home {
    .aio-home__bottom {
      flex: 0;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      grid-auto-rows: auto;
      justify-content: center;
      align-content: start;
    }

    .aio-home__card {
      aspect-ratio: 1 / 1;
      min-height: 220px;
      padding: 0 20px;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow:
        0 14px 28px rgba(24, 60, 140, 0.16),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .aio-home__card-main {
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .aio-home__card-icon {
      width: 72px;
      height: 72px;
    }

    .aio-home__card-label {
      font-size: 18px;
      letter-spacing: 1px;
    }

    .aio-home__card-bg {
      background-size: 30% auto;
      opacity: 0.25;
    }
  }
}
</style>
