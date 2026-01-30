<template>
  <header class="topbar">
    <div class="topbar__left">
      <span class="topbar__dot" aria-hidden="true"></span>
      <div class="topbar__title topbar__title--hero pl5 fs22 fw">{{ title }}</div>
    </div>

    <div class="topbar__center">
      <div class="topbar__title">船号</div>
      <el-select
        :model-value="selectedShip"
        class="topbar__select flex1"
        placeholder="请选择"
        size="large"
        @update:model-value="(v) => emit('update:selected-ship', v)"
      >
        <el-option v-for="o in shipOptions" :key="o" :label="o" :value="o" />
      </el-select>

      <div class="topbar__title">分段号</div>
      <el-select
        :model-value="selectedPart"
        class="topbar__select flex1"
        placeholder="请选择"
        size="large"
        @update:model-value="(v) => emit('update:selected-part', v)"
      >
        <el-option
          v-for="o in bomList"
          :key="o.materials_code"
          :label="o.materials_code"
          :value="o.materials_code"
        />
      </el-select>

      <div class="topbar__title">流向</div>
      <div class="topbar__flow-tabs">
        <button
          v-for="o in flowOptions"
          :key="o"
          class="flow-tab"
          :class="{ 'is-active': selectedFlow === o }"
          type="button"
          @click="emit('flow-toggle', o)"
        >
          {{ o }}
        </button>
      </div>
    </div>

    <div class="topbar__right">
      <el-button type="primary" size="large" :disabled="!canSaveMarks" @click="emit('save')">
        保存组立标注信息
      </el-button>
      <el-button
        class="topbar__btn--danger"
        type="primary"
        size="large"
        @click="goBack"
      >
        返回
      </el-button>
    </div>
  </header>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  shipOptions: { type: Array, default: () => [] },
  bomList: { type: Array, default: () => [] },
  flowOptions: { type: Array, default: () => [] },
  selectedShip: { type: String, default: '' },
  selectedPart: { type: String, default: '' },
  selectedFlow: { type: String, default: '' },
  canSaveMarks: { type: Boolean, default: false },
});

import { useRouter } from 'vue-router';

const emit = defineEmits(['update:selected-ship', 'update:selected-part', 'flow-toggle', 'save']);

const router = useRouter();
const goBack = () => {
  router.back();
};
</script>

<style scoped>
/* =========================
   顶部栏（更亮、更整洁、颜色更克制：蓝 + 一点青；无粉；少渐变）
   ========================= */
.topbar {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr 370px;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 1);
  border-bottom: 1px solid rgba(37, 99, 235, 0.14);
  backdrop-filter: blur(10px);
  border-radius: 20px 20px 0px 0px;
}

/* 顶部底部强调线（细、克制） */
.topbar::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 3px;
  background-image: linear-gradient(
    90deg,
    rgb(13, 124, 255),
    rgb(0, 194, 255),
    rgb(124, 77, 255),
    rgb(255, 45, 142),
    rgb(255, 176, 0)
  );
  opacity: 0.9;
}

/* 左侧标题 */
.topbar__left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}
.topbar__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #0b5cff;
  box-shadow: 0 0 0 3px rgba(11, 92, 255, 0.18);
}
.topbar__title {
  font-weight: 800;
  color: #0b1324;
  white-space: nowrap;
}
.topbar__title--hero {
  font-weight: 950;
  letter-spacing: 1px;
  color: #000;
}

/* 中间筛选区：做成一个“胶囊容器”，更规整 */
.topbar__center {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  /* padding: 8px 10px; */
  border-radius: 16px;
  /* border: 1px solid rgba(37, 99, 235, 0.14);
  background: rgba(13, 124, 255, 0.05); */
}

/* 字段标题：更小更稳 */
.topbar__center .topbar__title {
  font-size: 14px;
  font-weight: 900;
  color: rgba(15, 23, 42, 1);
}

/* el-select：让它看起来更像卡片输入框 */
.topbar__select {
  min-width: 180px;
}

/* 右侧按钮区 */
.topbar__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

/* ========== 流向 tabs：更“实”的 pill，无杂色 ========== */
.topbar__flow-tabs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  background: rgba(255, 255, 255, 0.7);
}

.flow-tab {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(11, 92, 255, 0.18);
  background: rgba(11, 92, 255, 0.08);
  color: rgba(15, 23, 42, 0.88);
  font-weight: 900;
  cursor: pointer;
  transition:
    transform 0.08s ease,
    filter 0.12s ease,
    background 0.12s ease,
    border-color 0.12s ease;
}
.flow-tab:active {
  transform: translateY(1px);
}
.flow-tab:hover {
  filter: brightness(1.02);
}
.flow-tab.is-active {
  background: #0b5cff;
  color: #ffffff;
  border-color: #0b5cff;
  box-shadow: 0 12px 22px rgba(11, 92, 255, 0.18);
}

/* ========== Element Plus 深度样式（不引入新组件，直接提升质感） ========== */
.topbar :deep(.el-select) {
  width: 100%;
}

/* selector 外壳 */
.topbar :deep(.el-input__wrapper) {
  border-radius: 14px;
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: none;
  border: 1px solid rgba(37, 99, 235, 0.16);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}
.topbar :deep(.el-input__wrapper:hover) {
  border-color: rgba(11, 92, 255, 0.3);
}
.topbar :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(11, 92, 255, 0.55);
  box-shadow: 0 0 0 4px rgba(11, 92, 255, 0.12);
  background: #ffffff;
}

/* input text */
.topbar :deep(.el-input__inner) {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.92);
}

/* placeholder */
.topbar :deep(.el-input__inner::placeholder) {
  color: rgba(15, 23, 42, 0.4);
  font-weight: 800;
}

/* 下拉箭头颜色 */
.topbar :deep(.el-select .el-input .el-select__caret) {
  color: rgba(11, 92, 255, 0.65);
}

/* primary button 更“实” */
.topbar :deep(.el-button--primary) {
  border-radius: 20px;
  font-weight: 950;
  background: #0b5cff;
  border-color: #0b5cff;
  box-shadow: 0 14px 28px rgba(11, 92, 255, 0.18);
}
.topbar :deep(.el-button--primary:hover) {
  filter: brightness(1.03);
}
.topbar :deep(.el-button--primary.is-disabled) {
  box-shadow: none;
}

/* 返回按钮：同款样式，红色 */
.topbar :deep(.topbar__btn--danger.el-button--primary) {
  background: #dc2626;
  border-color: #dc2626;
  box-shadow: 0 14px 28px rgba(220, 38, 38, 0.18);
}
.topbar :deep(.topbar__btn--danger.el-button--primary:hover) {
  filter: brightness(1.03);
}

/* 响应式：窄屏下自动换行更舒服 */
@media (max-width: 1280px) {
  .topbar {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .topbar__right {
    justify-content: flex-start;
  }
  .topbar__center {
    flex-wrap: wrap;
  }
  .topbar__select {
    min-width: 240px;
  }
}
</style>
