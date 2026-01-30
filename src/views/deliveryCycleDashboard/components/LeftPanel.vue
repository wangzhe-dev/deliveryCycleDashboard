<template>
  <aside class="leftpanel">
    <el-tabs v-model="leftTab" class="leftpanel__tabs" type="border-card" stretch>
      <el-tab-pane label="工艺图纸" name="PART">
        <div v-if="partFiles.length" class="file-list">
          <div v-for="file in partFiles" :key="fileKey(file)" class="file-row">
            <span class="file-ico" :class="fileTypeClass(file.name)" aria-hidden="true">
              {{ fileExt(file.name) }}
            </span>
            <span class="file-name">{{ file.name }}</span>
            <div class="file-actions">
              <button class="file-eye" type="button" @click.stop="openPdf(file.url)">
                <el-icon><View /></el-icon>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="file-empty">暂无数据</div>
      </el-tab-pane>

      <el-tab-pane label="BOM清单" name="BOM">
        <div v-if="bomFiles.length" class="file-list">
          <div v-for="file in bomFiles" :key="fileKey(file)" class="file-row">
            <span class="file-ico" :class="fileTypeClass(file.name)" aria-hidden="true">
              {{ fileExt(file.name) }}
            </span>
            <span class="file-name">{{ file.name }}</span>
            <div class="file-actions">
              <button class="file-eye" type="button" @click.stop="openExcel(file.url)">
                <el-icon><Download /></el-icon>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="file-empty">暂无数据</div>
      </el-tab-pane>

      <el-tab-pane label="全部" name="ALL">
        <div v-if="allFiles.length" class="file-list">
          <div v-for="file in allFiles" :key="fileKey(file)" class="file-row">
            <span class="file-ico" :class="fileTypeClass(file.name)" aria-hidden="true">
              {{ fileExt(file.name) }}
            </span>
            <span class="file-name">{{ file.name }}</span>
            <div class="file-actions">
              <button
                v-if="fileExt(file.name).toLowerCase() === 'pdf' && file.url"
                class="file-eye"
                type="button"
                @click.stop="openPdf(file.url)"
              >
                <el-icon><View /></el-icon>
              </button>
              <button
                v-else-if="file.url"
                class="file-eye"
                type="button"
                @click.stop="openExcel(file.url)"
              >
                <el-icon><Download /></el-icon>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="file-empty">暂无数据</div>
      </el-tab-pane>
    </el-tabs>

    <div class="leftpanel__files"></div>

    <!-- ✅ 标注/测量/爆炸：按你原来，不动 -->
    <div class="leftpanel__bottom-tools">
      <div v-if="explodeOn" class="explode-panel">
        <div class="row row--slider">
          <span class="k">爆炸系数</span>
          <el-slider v-model="explodeFactorValue" :min="0" :max="0.8" :step="0.02" class="row__slider" />
          <span class="v">{{ explodeFactorValue.toFixed(2) }}</span>
        </div>
      </div>

      <div v-if="toolMode === 'note'" class="param-panel">
        <div class="param-title">标注参数</div>
        <div class="row row--slider">
          <span class="k">标点大小</span>
          <el-slider v-model="notePointScaleValue" :min="0.1" :max="3" :step="0.1" class="row__slider" />
          <span class="v">{{ notePointScaleValue.toFixed(2) }}x</span>
        </div>

        <div class="row row--slider">
          <span class="k">文案距离</span>
          <el-slider v-model="noteLabelOffsetValue" :min="0.5" :max="3" :step="0.1" class="row__slider" />
          <span class="v">{{ noteLabelOffsetValue.toFixed(2) }}x</span>
        </div>

        <div class="row row--slider">
          <span class="k">标线粗细</span>
          <el-slider v-model="noteLineWidthValue" :min="1" :max="6" :step="0.5" class="row__slider" />
          <span class="v">{{ noteLineWidthValue.toFixed(1) }}px</span>
        </div>

        <div class="row row--color">
          <span class="k">标点颜色</span>
          <span class="v">
            <el-color-picker v-model="notePointColorValue" size="small" />
          </span>
        </div>
        <div class="row row--color">
          <span class="k">文案颜色</span>
          <span class="v">
            <el-color-picker v-model="noteLabelColorValue" size="small" />
          </span>
        </div>
      </div>

      <div v-if="toolMode === 'measure'" class="param-panel">
        <div class="param-title">测量参数</div>
        <div class="row row--slider">
          <span class="k">标线粗细</span>
          <el-slider v-model="measureLineWidthValue" :min="1" :max="6" :step="0.5" class="row__slider" />
          <span class="v">{{ measureLineWidthValue.toFixed(1) }}px</span>
        </div>

        <div class="row row--slider">
          <span class="k">标点大小</span>
          <el-slider v-model="measurePointScaleValue" :min="0.1" :max="3" :step="0.1" class="row__slider" />
          <span class="v">{{ measurePointScaleValue.toFixed(2) }}x</span>
        </div>

        <div class="row row--color">
          <span class="k">标点颜色</span>
          <span class="v">
            <el-color-picker v-model="measurePointColorValue" size="small" />
          </span>
        </div>
        <div class="row row--color">
          <span class="k">标线颜色</span>
          <span class="v">
            <el-color-picker v-model="measureLineColorValue" size="small" />
          </span>
        </div>
        <div class="row row--color">
          <span class="k">文案颜色</span>
          <span class="v">
            <el-color-picker v-model="measureLabelColorValue" size="small" />
          </span>
        </div>
      </div>

      <!-- <div class="param-panel">
        <div class="param-title">坐标中心</div>
        <div class="row">
          <span class="k">显示</span>
          <span class="v">
            <el-switch v-model="centerVisibleValue" size="small" />
          </span>
        </div>
        <div class="row row--color">
          <span class="k">颜色</span>
          <span class="v">
            <el-color-picker v-model="centerColorValue" size="small" />
          </span>
        </div>
        <div class="row row--slider">
          <span class="k">粗细</span>
          <el-slider v-model="centerAxisWidthValue" :min="0.5" :max="3" :step="0.1" class="row__slider" />
          <span class="v">{{ centerAxisWidthValue.toFixed(2) }}x</span>
        </div>
      </div> -->

      <!-- 原始模型透明度（组立/分段各自独立） -->
      <!-- <div v-if="mode === 'normal' && !colorIsolated" class="param-panel">
        <div class="param-title">原始模型</div>
        <div class="row row--slider">
          <span class="k">组立透明度</span>
          <el-slider v-model="baseOpacityValue" :min="0.2" :max="1" :step="0.05" class="row__slider" />
          <span class="v">{{ baseOpacityValue.toFixed(2) }}</span>
        </div>
        <div class="row row--slider">
          <span class="k">分段透明度</span>
          <el-slider v-model="partOpacityValue" :min="0.2" :max="1" :step="0.05" class="row__slider" />
          <span class="v">{{ partOpacityValue.toFixed(2) }}</span>
        </div>
      </div> -->

      <!-- 颜色隔离透明度（仅隔离模式生效） -->
      <!-- <div v-if="colorIsolated" class="param-panel">
        <div class="param-title">颜色隔离</div>
        <div class="row row--slider">
          <span class="k">组立透明度</span>
          <el-slider v-model="colorIsolatedOpacityValue" :min="0.2" :max="1" :step="0.05" class="row__slider" />
          <span class="v">{{ colorIsolatedOpacityValue.toFixed(2) }}</span>
        </div>
        <div class="row row--slider">
          <span class="k">分段透明度</span>
          <el-slider v-model="colorIsolatedPartOpacityValue" :min="0.2" :max="1" :step="0.05" class="row__slider" />
          <span class="v">{{ colorIsolatedPartOpacityValue.toFixed(2) }}</span>
        </div>
      </div> -->
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { Download, View } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: String, default: 'PART' },
  mode: { type: String, default: 'normal' },
  explodeOn: { type: Boolean, default: false },
  toolMode: { type: String, default: 'pick' },
  explodeFactor: { type: Number, default: 0.18 },
  colorIsolated: { type: Boolean, default: false },
  colorIsolatedOpacity: { type: Number, default: 0.8 },
  colorIsolatedPartOpacity: { type: Number, default: 0.8 },
  baseOpacity: { type: Number, default: 1 },
  partOpacity: { type: Number, default: 1 },
  notePointColor: { type: String, default: '#2563eb' },
  noteLabelColor: { type: String, default: '#1d4ed8' },
  notePointScale: { type: Number, default: 1.5 },
  noteLabelOffset: { type: Number, default: 1 },
  noteLineWidth: { type: Number, default: 1.5 },
  measurePointColor: { type: String, default: '#2563eb' },
  measureLineColor: { type: String, default: '#2563eb' },
  measureLabelColor: { type: String, default: '#1d4ed8' },
  measurePointScale: { type: Number, default: 0.3 },
  measureLineWidth: { type: Number, default: 1.5 },
  showCenterMarks: { type: Boolean, default: true },
  centerColor: { type: String, default: '#ef4444' },
  centerAxisWidth: { type: Number, default: 1 },
  partPdfFiles: { type: Array, default: () => [] },
  excelList: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'update:modelValue',
  'set-color-isolated-opacity',
  'set-color-isolated-part-opacity',
  'set-base-opacity',
  'set-part-opacity',
  'set-explode-factor',
  'set-note-point-color',
  'set-note-label-color',
  'set-note-point-scale',
  'set-note-label-offset',
  'set-note-line-width',
  'set-measure-point-color',
  'set-measure-line-color',
  'set-measure-label-color',
  'set-measure-point-scale',
  'set-measure-line-width',
  'set-center-visible',
  'set-center-color',
  'set-center-axis-width',
]);

const leftTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const partFiles = computed(() =>
  (props.partPdfFiles || []).map((it) => ({
    name: String(it?.name || it?.url || 'PDF'),
    url: it?.url || '',
  })),
);

const bomFiles = computed(() =>
  (props.excelList || []).map((it) => ({
    name: String(it?.name || it?.url || 'EXCEL'),
    url: it?.url || '',
  })),
);

const allFiles = computed(() => [...bomFiles.value, ...partFiles.value]);

function fileExt(name) {
  const idx = String(name || '').lastIndexOf('.');
  if (idx < 0) return 'FILE';
  return String(name).slice(idx + 1).toUpperCase();
}

function fileTypeClass(name) {
  const ext = fileExt(name).toLowerCase();
  if (ext === 'pdf') return 'file-ico--pdf';
  if (ext === 'xls' || ext === 'xlsx') return 'file-ico--excel';
  return 'file-ico--other';
}
function fileKey(file) {
  return `${file?.name || 'file'}:${file?.url || ''}`;
}

const explodeFactorValue = computed({
  get: () => props.explodeFactor,
  set: (value) => emit('set-explode-factor', value),
});

const colorIsolatedOpacityValue = computed({
  get: () => props.colorIsolatedOpacity,
  set: (value) => emit('set-color-isolated-opacity', value),
});

const colorIsolatedPartOpacityValue = computed({
  get: () => props.colorIsolatedPartOpacity,
  set: (value) => emit('set-color-isolated-part-opacity', value),
});

const baseOpacityValue = computed({
  get: () => props.baseOpacity,
  set: (value) => emit('set-base-opacity', value),
});

const partOpacityValue = computed({
  get: () => props.partOpacity,
  set: (value) => emit('set-part-opacity', value),
});

const notePointScaleValue = computed({
  get: () => props.notePointScale,
  set: (value) => emit('set-note-point-scale', value),
});

const noteLabelOffsetValue = computed({
  get: () => props.noteLabelOffset,
  set: (value) => emit('set-note-label-offset', value),
});
const noteLineWidthValue = computed({
  get: () => props.noteLineWidth,
  set: (value) => emit('set-note-line-width', value),
});

const notePointColorValue = computed({
  get: () => props.notePointColor,
  set: (value) => emit('set-note-point-color', value),
});

const noteLabelColorValue = computed({
  get: () => props.noteLabelColor,
  set: (value) => emit('set-note-label-color', value),
});

const measurePointColorValue = computed({
  get: () => props.measurePointColor,
  set: (value) => emit('set-measure-point-color', value),
});

const measureLineColorValue = computed({
  get: () => props.measureLineColor,
  set: (value) => emit('set-measure-line-color', value),
});

const measureLabelColorValue = computed({
  get: () => props.measureLabelColor,
  set: (value) => emit('set-measure-label-color', value),
});

const measurePointScaleValue = computed({
  get: () => props.measurePointScale,
  set: (value) => emit('set-measure-point-scale', value),
});

const measureLineWidthValue = computed({
  get: () => props.measureLineWidth,
  set: (value) => emit('set-measure-line-width', value),
});

const centerVisibleValue = computed({
  get: () => props.showCenterMarks,
  set: (value) => emit('set-center-visible', value),
});

const centerColorValue = computed({
  get: () => props.centerColor,
  set: (value) => emit('set-center-color', value),
});

const centerAxisWidthValue = computed({
  get: () => props.centerAxisWidth,
  set: (value) => emit('set-center-axis-width', value),
});

function openPdf(url) {
  const target = String(url || '').trim();
  if (!target) return;
  window.open(target, '_blank', 'noopener');
}
function openExcel(url) {
  const target = String(url || '').trim();
  if (!target) return;
  window.open(target, '_blank', 'noopener');
}
</script>

<style scoped>
/* ======================
   LeftPanel：Blue Ultra（大屏更耐看：背景略深 + 玻璃感）
   ✅ 只改样式，不改任何逻辑
====================== */
.leftpanel {
  /* 主题变量 */
  --lp-bg-1: var(--left-shell-bg, #eef3ff);
  --lp-bg-2: var(--left-shell-bg, #e8efff);
  --lp-border: transparent;

  --lp-text: #0b1220;
  --lp-text-2: #8b6464;
  --lp-title: #ff7a00;

  --lp-divider: rgba(59, 130, 246, 0.20);

  --lp-mark: #fde68a;
  --lp-mark-rgb: 253, 230, 138;

  --lp-card-1: rgba(247, 251, 255, 0.92);
  --lp-card-2: rgba(236, 244, 255, 0.92);
  --lp-card-h-1: rgba(241, 247, 255, 0.96);
  --lp-card-h-2: rgba(227, 239, 255, 0.96);

  --lp-hover-border: rgba(59, 130, 246, 0.22);
  --lp-focus: rgba(59, 130, 246, 0.26);

  --lp-active-1: #6aa3ff;
  --lp-active-2: #2563eb;

  --lp-accent-1: #c4b5fd;
  --lp-accent-2: #7c3aed;

  --lp-shadow: none;
  --lp-inner: inset 0 1px 0 rgba(255, 255, 255, 0.55);

  background: var(--left-shell-bg, linear-gradient(180deg, #eef3ff 0%, #e8efff 100%));
  border: 0;
  border-radius: 0px 14px 14px 0px;
  box-shadow: var(--lp-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0px;
  border-left: none;
  position: relative;
}

.leftpanel::before {
  opacity: 0;
}

/* Tabs 容器：结构不变 */
.leftpanel__tabs {
  border: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}

/* 强制 el-tabs 布局 */
.leftpanel__tabs :deep(.el-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.leftpanel__tabs :deep(.el-tabs__header) {
  order: 0;
  margin: 0;
  padding: 10px 10px 8px;
  border-bottom: 0;
  background: transparent;
  box-shadow: none;
}
.leftpanel__tabs :deep(.el-tabs__content) {
  order: 1;
}

/* border-card 外壳去掉默认厚边 */
:deep(.el-tabs--border-card) {
  border: 0;
  background: none !important;
  box-shadow: none;
}

/* tabs nav：3 等分胶囊按钮感 */
.leftpanel__tabs :deep(.el-tabs__nav) {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  border: 0 !important;
}
.leftpanel__tabs :deep(.el-tabs__item) {
  height: 38px;
  line-height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.35) 100%);
  color: rgba(15, 23, 42, 0.72);
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.2px;
  justify-content: center;
  padding: 0 !important;
  margin: 0 !important;
  transition: transform 0.06s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

/* 去掉 ElementPlus 自带的左右边框/分割线 */
.leftpanel__tabs :deep(.el-tabs__item),
.leftpanel__tabs :deep(.el-tabs__item.is-active) {
  border-left: 1px solid rgba(15, 23, 42, 0.10) !important;
  border-right: 1px solid rgba(15, 23, 42, 0.10) !important;
}

.leftpanel__tabs :deep(.el-tabs__item:hover) {
  border-color: var(--lp-hover-border) !important;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.leftpanel__tabs :deep(.el-tabs__item:active) {
  transform: translateY(1px);
}

/* active：蓝渐变 + 底部金光带 */
.leftpanel__tabs :deep(.el-tabs__item.is-active) {
  color: #ffffff !important;
  border-color: rgba(37, 99, 235, 0.45) !important;
  background: linear-gradient(180deg, var(--lp-active-1) 0%, var(--lp-active-2) 100%) !important;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.22);
  position: relative;
}
.leftpanel__tabs :deep(.el-tabs__item.is-active)::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 7px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(var(--lp-mark-rgb), 0) 0%,
    rgba(var(--lp-mark-rgb), 0.85) 50%,
    rgba(var(--lp-mark-rgb), 0) 100%
  );
  opacity: 0.95;
  pointer-events: none;
}

/* 去掉 element-plus 的 active bar */
.leftpanel__tabs :deep(.el-tabs__active-bar) {
  display: none !important;
}

/* 内容区 */
.leftpanel__tabs :deep(.el-tabs__content) {
  padding: 10px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: transparent;
}
.leftpanel__tabs :deep(.el-tabs__content)::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 文件列表 */
.file-list {
  display: grid;
  gap: 8px;
}
.file-empty {
  padding: 18px 12px;
  text-align: center;
  color: var(--lp-text-2);
  font-size: 14px;
  font-weight: 800;
  opacity: 0.9;
}

.file-row {
  position: relative;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: #fff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  transition: transform 0.06s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease;
  user-select: none;
}

.file-row:hover {
  border-color: var(--lp-hover-border);
  background: linear-gradient(180deg, var(--lp-card-h-1) 0%, var(--lp-card-h-2) 100%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.10);
}

.file-row:active {
  transform: translateY(1px);
}

.file-ico {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 1000;
  color: #ffffff;
  letter-spacing: 0.25px;
  text-transform: uppercase;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  box-sizing: border-box;
}

.file-ico--pdf {
  background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
}
.file-ico--excel {
  background: linear-gradient(180deg, #22c55e 0%, #15803d 100%);
}
.file-ico--other {
  background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%);
}

.file-name {
  color: var(--lp-text);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* action btn：玻璃小方块 */
.file-eye {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: rgba(255, 255, 255, 0.70);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(15, 23, 42, 0.70);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.10);
  transition: transform 0.06s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.file-eye:hover {
  border-color: var(--lp-hover-border);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
}

.file-eye:active {
  transform: translateY(1px);
}

.file-eye :deep(svg) {
  width: 16px;
  height: 16px;
}

/* 底部工具区：玻璃感 */
.leftpanel__files {
  overflow: hidden;
  padding: 8px;
  flex: 0 0 auto;
}

.leftpanel__bottom-tools {
  border-top: 1px solid rgba(15, 23, 42, 0.10);
  padding: 10px;
  overflow: auto;
  display: grid;
  gap: 10px;
  flex: 0 0 auto;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.10) 100%);
  box-shadow: var(--lp-inner);
}

/* 爆炸/参数面板统一玻璃卡片 */
.explode-panel,
.param-panel {
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.52) 100%);
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.10);
  padding: 10px 10px 8px;
}

.param-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 1000;
  color: var(--lp-title);
  font-size: 14px;
  letter-spacing: 0.2px;
  font-weight: 900;
}

/* 行布局 */
.row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 900;
}
.row--slider {
  align-items: center;
}
.row .k {
  color: var(--lp-text-2);
  min-width: 88px;
}
.row .v {
  color: rgba(15, 23, 42,1);
  min-width: 56px;
  text-align: right;
}

/* slider（ElementPlus） */
.row__slider {
  flex: 1;
  min-width: 140px;
}
.row__slider :deep(.el-slider__runway) {
  height: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.14);
}
.row__slider :deep(.el-slider__bar) {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--lp-active-1) 0%, var(--lp-active-2) 100%);
}
.row__slider :deep(.el-slider__button) {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.65);
  background: linear-gradient(180deg, var(--lp-active-1) 0%, var(--lp-active-2) 100%);
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.22);
}

/* color picker（ElementPlus） */
.leftpanel__bottom-tools :deep(.el-color-picker__trigger) {
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: rgba(255, 255, 255, 0.60);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.10);
}

/* 滚动条隐藏 */
.leftpanel__bottom-tools::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.leftpanel__bottom-tools {
  scrollbar-width: none;
  scrollbar-color: transparent transparent;
}
</style>
