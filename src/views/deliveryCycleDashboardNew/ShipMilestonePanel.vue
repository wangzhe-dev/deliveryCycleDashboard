<template>
  <div class="mt-panel">
    <!-- 标题 -->
    <div class="mt-header">
      <div class="mt-title">建造里程碑时间线</div>
    </div>

    <!-- 上面：大里程碑卡片（简化版，保持你之前喜欢的感觉） -->
    <div class="mt-ms-row">
      <div v-for="(m, idx) in msWithIcons" :key="m.key || idx" class="mt-ms-card" :class="m.status">
        <!-- 右上角小勾 -->
        <div class="mt-ms-status">
          <span v-if="m.status === 'done'">✓</span>
          <span v-else-if="m.status === 'current'">●</span>
          <span v-else>✓</span>
        </div>

        <!-- 插画区（先用 emoji 顶一下，后面你可以换成图片） -->
        <div class="mt-ms-illust">
          <div class="mt-ms-icon">{{ m.icon }}</div>
        </div>

        <!-- 文本 -->
        <div class="mt-ms-text">
          <div class="mt-ms-name">{{ m.name }}</div>
          <div class="mt-ms-date">{{ m.date }}</div>
        </div>

        <!-- 底部挂点 -->
        <div class="mt-ms-hanger"></div>
      </div>
    </div>

    <!-- 中间虚线时间轴 + 圆点 -->
    <div class="mt-timeline">
      <div class="mt-tl-line"></div>
      <div class="mt-tl-points">
        <div
          v-for="(m, idx) in msWithIcons"
          :key="m.key || idx"
          class="mt-tl-point"
          :class="m.status"
        ></div>
      </div>
    </div>

    <!-- 下面：4 个 KPI 卡片（重点仿你截图这块） -->
    <div class="mt-kpi-strip">
      <div v-for="k in kpiList" :key="k.key" class="mt-kpi-card" :class="`mt-kpi-${k.key}`">
        <!-- 上半：圆形图标 + 文本 -->
        <div class="mt-kpi-top">
          <div class="mt-kpi-icon-circle">
            <span class="mt-kpi-icon">{{ k.icon }}</span>
          </div>
          <div class="mt-kpi-title">{{ k.label }}</div>
        </div>

        <!-- 中间细分割线 -->
        <div class="mt-kpi-divider"></div>

        <!-- 下半：大号数字 + 单位 -->
        <div class="mt-kpi-bottom">
          <span class="mt-kpi-main">{{ k.main }}</span>
          <span class="mt-kpi-unit" v-if="k.unit">{{ k.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  milestones: {
    type: Array,
    default: () => [],
  },
  extraKpi: {
    type: Object,
    default: () => ({}),
  },
});

// 里程碑图标，顺着你的阶段来排个 emoji（后面可以换成真实插画）
const iconOrder = ['🚀', '🛠️', '⚓', '🏗️', '🚢', '🧪', '🛳️'];

const msWithIcons = computed(() =>
  props.milestones.map((m, idx) => ({
    ...m,
    icon: m.icon || iconOrder[idx] || '⛵',
  })),
);

// KPI 数据拆成“数值 + 单位”，方便做和原图一样的排版
const kpiList = computed(() => {
  const k = props.extraKpi || {};
  return [
    {
      key: 'install',
      icon: '🛠️',
      label: '总段安装效率',
      main: (k.installRate || '2.8个/天').replace(/个\/天|\/天|天/g, ''),
      unit: '个/天',
    },
    {
      key: 'weld',
      icon: '⚡',
      label: '焊接合格率',
      main: (k.weldPassRate || '98.5%').replace('%', ''),
      unit: '%',
    },
    {
      key: 'staff',
      icon: '👥',
      label: '在岗人员',
      main: (k.onDuty || '156人').replace(/人/g, ''),
      unit: '人',
    },
    {
      key: 'cycle',
      icon: '📅',
      label: '建造周期',
      main: (k.buildCycle || '532天').replace(/天/g, ''),
      unit: '天',
    },
  ];
});
</script>

<style scoped>
/* 整体面板：稍微收一点内边距和阴影 */
.mt-panel {
  padding: 14px 18px 18px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
}

/* 标题：比刚才小一号 */
.mt-header {
  margin-bottom: 10px;
}
.mt-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: #111827;
}

/* ==================== 里程碑卡片（上半部分，整体缩小） ==================== */
.mt-ms-row {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 14px;
}

.mt-ms-card {
  flex: 1;
  min-width: 0;
  border-radius: 18px;
  padding: 10px 10px 8px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #e6f3ff, #cfe5ff);
  box-shadow: 0 10px 20px rgba(148, 163, 184, 0.35);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mt-ms-card.done {
  background: linear-gradient(180deg, #e0f4ff, #c3e6ff);
}
.mt-ms-card.current {
  background:
    radial-gradient(circle at 0% 0%, #fff4df, transparent 55%),
    linear-gradient(180deg, #ffe8c2, #ffd18c);
}
.mt-ms-card.todo {
  background: linear-gradient(180deg, #edf1ff, #dde5ff);
}

/* 右上角状态 */
.mt-ms-status {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(148, 163, 184, 0.7);
}
.mt-ms-card.done .mt-ms-status {
  background: linear-gradient(135deg, #22c55e, #4ade80);
}
.mt-ms-card.current .mt-ms-status {
  background: linear-gradient(135deg, #f97316, #fbbf24);
}

/* 插画区（高度减小） */
.mt-ms-illust {
  height: 64px;
  border-radius: 14px;
  background:
    radial-gradient(circle at 50% 0%, #ffffffcc, transparent 65%),
    radial-gradient(circle at 0% 100%, #bef3ff, transparent 60%), rgba(255, 255, 255, 0.76);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
  margin-bottom: 8px;
}
.mt-ms-card.current .mt-ms-illust {
  background:
    radial-gradient(circle at 50% 0%, #ffffffdd, transparent 65%),
    radial-gradient(circle at 0% 100%, #ffe2b8, transparent 60%), rgba(255, 255, 255, 0.9);
}
.mt-ms-card.todo .mt-ms-illust {
  background:
    radial-gradient(circle at 50% 0%, #ffffffdd, transparent 65%),
    radial-gradient(circle at 0% 100%, #e0ebff, transparent 60%), rgba(255, 255, 255, 0.92);
}
.mt-ms-icon {
  font-size: 30px;
}

/* 文本 */
.mt-ms-text {
  text-align: center;
}
.mt-ms-name {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}
.mt-ms-date {
  margin-top: 2px;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: #4b5563;
}

/* 底部挂点 */
.mt-ms-hanger {
  width: 14px;
  height: 8px;
  border-radius: 0 0 14px 14px;
  background: rgba(255, 255, 255, 0.9);
  margin: 6px auto 0;
  box-shadow: 0 3px 5px rgba(148, 163, 184, 0.35);
}

/* ==================== 中间虚线时间轴 ==================== */
.mt-timeline {
  margin-bottom: 12px;
  position: relative;
  padding: 2px 16px 0;
}
.mt-tl-line {
  height: 2px;
  border-radius: 999px;
  background-image: linear-gradient(
    to right,
    rgba(148, 163, 184, 0.7) 25%,
    rgba(148, 163, 184, 0) 0
  );
  background-size: 10px 2px;
  background-repeat: repeat-x;
  opacity: 0.7;
}
.mt-tl-points {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mt-tl-point {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
  box-sizing: border-box;
}
.mt-tl-point.done {
  border-color: #22c55e;
  background: #dcfce7;
}
.mt-tl-point.current {
  border-color: #f97316;
  background: #ffedd5;
}

/* ==================== KPI 卡片（缩小版） ==================== */

.mt-kpi-strip {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

/* 单个 KPI 卡片：半径、内边距、最小高度都压缩一点 */
.mt-kpi-card {
  border-radius: 20px;
  padding: 10px 14px 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 10px 22px rgba(148, 163, 184, 0.3);
  position: relative;
  overflow: hidden;
  min-height: 88px;
}

/* 不同 KPI 的底部渐变 */
.mt-kpi-install {
  background: linear-gradient(180deg, #ffffff 0%, #e7fbf3 70%, #d7f8ec 100%);
}
.mt-kpi-weld {
  background: linear-gradient(180deg, #ffffff 0%, #e6f2ff 70%, #d9eaff 100%);
}
.mt-kpi-staff {
  background: linear-gradient(180deg, #ffffff 0%, #f2eaff 70%, #e7ddff 100%);
}
.mt-kpi-cycle {
  background: linear-gradient(180deg, #ffffff 0%, #ffeeda 70%, #ffe2bd 100%);
}

/* 上半：图标 + 文本 */
.mt-kpi-top {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #111827;
}

/* 圆形 icon 容器（整体缩小） */
.mt-kpi-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #f6f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.32),
    0 4px 10px rgba(148, 163, 184, 0.26);
}
.mt-kpi-icon {
  font-size: 16px;
}
.mt-kpi-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

/* 中间细线 */
.mt-kpi-divider {
  margin-top: 8px;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.35), rgba(148, 163, 184, 0.12));
}

/* 下半：大数字 + 单位，整体缩小一档 */
.mt-kpi-bottom {
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.mt-kpi-main {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.mt-kpi-install .mt-kpi-main {
  color: #16a085;
}
.mt-kpi-weld .mt-kpi-main {
  color: #2563eb;
}
.mt-kpi-staff .mt-kpi-main {
  color: #7c3aed;
}
.mt-kpi-cycle .mt-kpi-main {
  color: #ea580c;
}

.mt-kpi-unit {
  font-size: 13px;
  color: #6b7280;
}
</style>
