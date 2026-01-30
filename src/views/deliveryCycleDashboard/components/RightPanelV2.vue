<template>
  <aside
    class="right"
    :class="{ 'right--collapsed': rightCollapsed, 'right--simple': !showDetailPanels }"
  >
    <!-- ① 组立/零件树：50% -->
    <section class="right__tree right-card">
      <div class="tree-col tree-col--zl">
        <div
          class="tree-col__title"
          style="background: linear-gradient(90deg, rgb(12 92 255), rgb(40 143 255))"
        >
          <span>组立清单</span>
          <span class="tree-col__badge">{{ rightTreeLeft.length }}</span>
        </div>

        <el-scrollbar height="100%" style="background: #409eff14">
          <div
            class="tree-item tree-item--zl"
            v-for="x in rightTreeLeft"
            :key="x.groupName || x.materials_code"
            :class="{ 'is-active': (x.groupName || x.materials_code) === selectedLeftCode }"
            @click="onLeftNodeClick(x.groupName || x.materials_code)"
          >
            <span class="tree-item__icon">
              <svg-icon icon-class="3D-ZL" style="font-size: 30px; font-weight: 900" />
            </span>
            <span class="tree-item__text">{{ x.groupName || x.name || x.materials_code }}</span>
          </div>
          <div v-if="!rightTreeLeft.length" class="placeholder">占位</div>
        </el-scrollbar>
      </div>

      <div class="tree-col tree-col--part">
        <div class="tree-col__title">
          <span>零件清单</span>
          <span class="tree-col__badge">{{ rightTreeRight.length }}</span>
        </div>

        <el-scrollbar height="100%" style="background: #ffff006b">
          <div
            class="tree-item tree-item--part"
            v-for="x in rightTreeRight"
            :key="x.materials_code + '_' + (x.name || '')"
            :class="{ 'is-active': x.materials_code === selectedLeafCode }"
            @click="onRightNodeClick(x.materials_code)"
          >
            <span class="tree-item__icon">
              <svg-icon icon-class="3D-LJL" style="font-size: 30px; font-weight: 900" />
            </span>
            <span class="tree-item__text">{{ trimPartCode(x.name || x.materials_code) }}</span>
          </div>
          <div v-if="!rightTreeRight.length" class="placeholder">占位</div>
        </el-scrollbar>
      </div>
    </section>

    <!-- ② 信息：25% -->
    <section class="right__info right-card" style="background: #f1f7ff">
      <div
        class="tree-col__title"
        style="background: linear-gradient(90deg, rgb(12 92 255), rgb(40 143 255))"
      >
        <span>组立详情</span>
        <span class="tree-col__badge" style="padding: 0">
          <span
            class="hud-pill__tab"
            :class="{ 'is-active': hudTab === 'MEASURE' }"
            @click="onHudTabChange('MEASURE')"
          >
            装配标注信息{{ measureList.length }}
          </span>
          <span
            class="hud-pill__tab ml10"
            :class="{ 'is-active': hudTab === 'NOTE' }"
            @click="onHudTabChange('NOTE')"
          >
            工艺标注信息{{ noteList.length }}
          </span>
        </span>
      </div>
      <div class="info-grid h60px">
        <div class="info-row info-row--span">
          <span class="k pl10">{{ selectedLeafCode ? '零件编码' : '组立编码' }}</span>
          <span class="v">
            {{
              selectedLeafCode
                ? trimPartCode(selectedLeafCode)
                : selectedNode?.materials_code || '-'
            }}
          </span>
        </div>

        <div class="info-row info-row--span">
          <span class="k mr10" style="text-align: right;">{{ selectedLeafCode ? '零件重量' : '组立重量' }}</span>
          <span class="v">{{ fmt(selectedNode?.weight) }} kg</span>
        </div>

        <div v-if="selectedLeafCode" class="info-row info-row--span">
          <span class="k pl10">零件长度</span>
          <span class="v">{{ fmt(selectedNode?.part_length) }} mm</span>
        </div>
        <div v-if="selectedLeafCode" class="info-row info-row--span">
          <span class="k mr10" style="text-align: right;">零件宽度</span>
          <span class="v">{{ fmt(selectedNode?.part_width) }} mm</span>
        </div>
      </div>
      <!-- ③ 测量 / 标注：25%（序号 + 输入框 + 定位放大） -->
      <section v-if="showDetailPanels" class="right__hud">
        <!-- <div class="hud-toggle">
          <button
            class="hud-toggle__btn hud-toggle__btn--measure"
            :class="{ 'is-active': hudTab === 'MEASURE' }"
            type="button"
            @click="onHudTabChange('MEASURE')"
          >
            <span>装配信息</span>
            <span class="hud-toggle__badge">{{ measureList.length }}</span>
          </button>
          <button
            class="hud-toggle__btn hud-toggle__btn--note"
            :class="{ 'is-active': hudTab === 'NOTE' }"
            type="button"
            @click="onHudTabChange('NOTE')"
          >
            <span>工艺信息</span>
            <span class="hud-toggle__badge">{{ noteList.length }}</span>
          </button>
        </div> -->

        <div class="hud-body">
          <div v-show="hudTab === 'MEASURE'" class="hud-pane">
            <el-scrollbar height="100%">
              <div v-if="!measureList.length" class="placeholder">暂无装配信息</div>

              <div v-for="m in measureList" :key="m.id" class="hud-item">
                <div class="hud-meta">
                  <div class="hud-xyz__item">
                    <span class="lab">测量值：</span>
                    <el-input
                      :model-value="getMeasureDisplayText(m)"
                      clearable
                      @update:model-value="(v) => onMeasureTextChange(m.id, v)"
                    />
                  </div>
                  <div class="hud-xyz">
                    <div class="hud-xyz__item">
                      <span class="lab">A点-X：</span>
                      <el-input-number
                        :model-value="getDeltaVal(m.aDelta, 0)"
                        :precision="3"
                        :step="0.001"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 0, v)"
                      />
                    </div>
                    <div class="hud-xyz__item">
                      <span class="lab">A点-Y：</span>
                      <el-input-number
                        :model-value="getDeltaVal(m.aDelta, 1)"
                        :precision="3"
                        :step="0.001"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 1, v)"
                      />
                    </div>
                    <div class="hud-xyz__item">
                      <span class="lab">A点-Z：</span>
                      <el-input-number
                        :model-value="getDeltaVal(m.aDelta, 2)"
                        :precision="3"
                        :step="0.001"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 2, v)"
                      />
                    </div>
                  </div>
                </div>

                <div class="hud-meta">
                  <div class="hud-xyz">
                    <div class="hud-xyz__item">
                      <span class="lab">B点-X：</span>
                      <el-input-number
                        :model-value="getDeltaVal(m.bDelta, 0)"
                        :precision="3"
                        :step="0.001"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 0, v)"
                      />
                    </div>
                    <div class="hud-xyz__item">
                      <span class="lab">B点-Y：</span>
                      <el-input-number
                        :model-value="getDeltaVal(m.bDelta, 1)"
                        :precision="3"
                        :step="0.001"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 1, v)"
                      />
                    </div>
                    <div class="hud-xyz__item">
                      <span class="lab">B点-Z：</span>
                      <el-input-number
                        :model-value="getDeltaVal(m.bDelta, 2)"
                        :precision="3"
                        :step="0.001"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 2, v)"
                      />
                    </div>
                  </div>
                </div>

                <div class="hud-actions">
                  <button class="hud-btn hud-btn--b" @click="onLocateMeasure(m)">
                    <el-icon class="hud-btn__icon"><Location /></el-icon>
                    定位
                  </button>
                  <button class="hud-btn hud-btn--danger" @click="onRemoveMeasure(m.id)">
                    <el-icon class="hud-btn__icon"><Delete /></el-icon>
                    删除
                  </button>
                </div>
              </div>
            </el-scrollbar>
          </div>

          <div v-show="hudTab === 'NOTE'" class="hud-pane">
            <el-scrollbar height="100%">
              <div v-if="!noteList.length" class="placeholder">暂无工艺信息</div>

              <div v-for="n in noteList" :key="n.id" class="hud-item hud-item--n">
                <div class="hud-meta">
                  <div class="hud-xyz">
                    <div class="hud-xyz__item">
                      <span class="lab">标注信息：</span>
                      <el-input
                        :model-value="n.text"
                        placeholder="输入标注信息…"
                        clearable
                        @update:model-value="(v) => onNoteTextChange(n.id, v)"
                      />
                    </div>
                    <div class="hud-xyz__item">
                      <span class="lab">X：</span>
                      <el-input-number
                        :model-value="getDeltaVal(n.bboxDelta, 0)"
                        :precision="3"
                        :step="1"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onNoteDeltaChange(n.id, 0, v)"
                      />
                    </div>
                    <div class="hud-xyz__item">
                      <span class="lab">Y：</span>
                      <el-input-number
                        :model-value="getDeltaVal(n.bboxDelta, 1)"
                        :precision="3"
                        :step="1"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onNoteDeltaChange(n.id, 1, v)"
                      />
                    </div>
                    <div class="hud-xyz__item">
                      <span class="lab">Z：</span>
                      <el-input-number
                        :model-value="getDeltaVal(n.bboxDelta, 2)"
                        :precision="3"
                        :step="1"
                        class="hud-xyz__input"
                        @update:model-value="(v) => onNoteDeltaChange(n.id, 2, v)"
                      />
                    </div>
                  </div>
                </div>

                <div class="hud-actions">
                  <button class="hud-btn hud-btn--b" @click="onLocateNote(n)">
                    <el-icon class="hud-btn__icon"><Location /></el-icon>
                    定位
                  </button>
                  <button class="hud-btn hud-btn--danger" @click="onRemoveNote(n.id)">
                    <el-icon class="hud-btn__icon"><Delete /></el-icon>
                    删除
                  </button>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </section>
    </section>
  </aside>
</template>

<script setup>
import { watch } from 'vue';
import { Delete, Location } from '@element-plus/icons-vue';

const props = defineProps({
  rightCollapsed: { type: Boolean, default: false },
  rightTreeLeft: { type: Array, default: () => [] },
  rightTreeRight: { type: Array, default: () => [] },
  selectedLeftCode: { type: String, default: '' },
  selectedLeafCode: { type: String, default: '' },
  selectedNode: { type: Object, default: null },
  hudTab: { type: String, default: 'MEASURE' },
  measureList: { type: Array, default: () => [] },
  noteList: { type: Array, default: () => [] },
  fmt: { type: Function, default: (v) => (typeof v === 'number' ? String(v) : '-') },
  fmtText: { type: Function, default: (v) => (v == null || v === '' ? '-' : String(v)) },
  getMeasureDisplayText: { type: Function, default: () => '' },
  getDeltaVal: { type: Function, default: () => 0 },
  showDetailPanels: { type: Boolean, default: true },
  onToggleCollapse: { type: Function, default: () => {} },
  onLeftNodeClick: { type: Function, default: () => {} },
  onRightNodeClick: { type: Function, default: () => {} },
  onHudTabChange: { type: Function, default: () => {} },
  onMeasureTextChange: { type: Function, default: () => {} },
  onMeasurePointDeltaChange: { type: Function, default: () => {} },
  onLocateMeasure: { type: Function, default: () => {} },
  onRemoveMeasure: { type: Function, default: () => {} },
  onNoteTextChange: { type: Function, default: () => {} },
  onNoteDeltaChange: { type: Function, default: () => {} },
  onLocateNote: { type: Function, default: () => {} },
  onRemoveNote: { type: Function, default: () => {} },
});

function trimPartCode(code) {
  const s = String(code || '').trim();
  const idx = s.indexOf('-');
  return idx > 0 ? s.slice(idx + 1) : s;
}

watch(
  () => [props.measureList?.length || 0, props.noteList?.length || 0, props.hudTab],
  ([mLen, nLen, cur]) => {
    if (mLen > 0 && nLen === 0 && cur !== 'MEASURE') props.onHudTabChange?.('MEASURE');
    if (nLen > 0 && mLen === 0 && cur !== 'NOTE') props.onHudTabChange?.('NOTE');
  },
  { immediate: true },
);
</script>

<style scoped>
.right {
  /* ===== Token（右侧统一） ===== */
  --bg: #ffffff;
  --border: rgba(230, 234, 242, 1);
  --divider: rgba(238, 242, 247, 1);

  --text: #111827;
  --muted: #6b7280;

  --primary: #2563eb;
  --primary-weak: #eaf2ff;
  --primary-hover: rgba(37, 99, 235, 0.08);
  --primary-active: rgba(37, 99, 235, 0.12);
  --focus: rgba(37, 99, 235, 0.25);

  --gold: #f59e0b;
  --gold-weak: #fff7e6;

  --danger: #dc2626;
  --danger-weak: rgba(220, 38, 38, 0.1);

  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  overflow: hidden;
  padding: 0;
  margin: 0;
  transition: all 0.28s ease;
  position: relative;
}

.right--collapsed {
  grid-template-rows: 1fr;
}
.right--collapsed .right__tree,
.right--collapsed .right__hud {
  opacity: 0;
  pointer-events: none;
}
.right--collapsed .right__info {
  opacity: 0;
  pointer-events: none;
}
.right--collapsed .right__info {
  padding: 0;
}
.right--collapsed .info-grid {
  display: none;
}

.right--simple {
  grid-template-rows: 1fr 182px;
}

.right-card {
  background: var(--bg);
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 12px;
  overflow: hidden;
}

/* ===== 树区域 ===== */
.right__tree {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.tree-col {
  display: grid;
  grid-template-rows: 44px 1fr;
  overflow: hidden;
}

.tree-col + .tree-col {
  border-left: 1px solid rgba(37, 99, 235, 0.1);
}

/* 标题：取消大色块，改成浅底 + 左色条 */
.tree-col__title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  padding: 0 10px;
  height: 44px;
  font-weight: 900;
  font-size: 14px;
  background: #1d4ed8;
  color: #ffffff;
  border-bottom: 1px solid var(--divider);
}
/* 
.tree-col__title::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.9);
} */

/* 组立：蓝条 */
/* .tree-col--zl .tree-col__title::before {
  background: var(--primary);
} */

/* 零件：黄条（点缀） */
/* .tree-col--part .tree-col__title::before {
  background: var(--gold);
} */

/* badge：统一胶囊风格 */
.tree-col__badge {
  min-width: 26px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 1000;
  font-size: 12px;

  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  /* border: 1px solid rgba(255, 255, 255, 0.35); */
}

.tree-col--zl .tree-col__badge {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.35);
}

.tree-col--part .tree-col__badge {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.35);
}

.tree-col--part .tree-col__title {
  background: #f59e0b;
  color: #ffffff;
}

.hud-pill__tab {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.hud-pill__tab.is-active {
  background: #ffffff;
  color: #0b5cff;
}
.hud-pill__sep {
  margin: 0 4px;
  color: rgba(255, 255, 255, 0.45);
}

.tree-item {
  padding: 9px 10px;
  border-bottom: 1px solid rgba(37, 99, 235, 0.08);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.12s ease;
}

.tree-item__icon {
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

.tree-item__text {
  color: var(--text);
  font-weight: 800;
}

/* hover：统一走浅蓝体系（别一会儿黄一会儿蓝） */
.tree-item:hover {
  background: var(--primary-hover);
}

/* active：浅蓝底 + 左蓝条（统一“选中=蓝”逻辑） */
.tree-item.is-active {
  background: var(--primary-active);
  font-weight: 950;
  position: relative;
}

.tree-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 4px;
  border-radius: 999px;
  background: var(--primary);
}

/* 让零件列也不要跳到黄色选中，只在 icon 上做一点点黄提示即可（可选） */
.tree-item--part.is-active .tree-item__icon {
  color: var(--primary);
}

/* 空态 */
.placeholder {
  padding: 14px;
  color: #94a3b8;
  font-size: 12px;
}

/* ===== 信息面板 ===== */
.right__info {
  /* padding: 10px 9px; */
  overflow: hidden;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* gap: 6px 3px; */
}

.info-row {
  display: grid;
  grid-template-columns: 70px 1fr;
  font-size: 13px;
  align-items: center;
  border: 1px solid #9cb8de29;
  /* border-radius: 8px; */
  /* overflow: hidden; */
  /* background: #ffffff; */
}

.info-row--span2 {
  grid-column: 1 / span 2;
}

.info-row .k {
  color: rgba(15, 23, 42, 0.7);
  font-weight: 900;
  /* padding: 6px 8px; */
  /* background: #f8fafc; */
  /* border-right: 1px solid var(--divider); */
}

.info-row .v {
  color: var(--text);
  font-weight: 900;
  word-break: break-all;
  /* padding: 6px 8px; */
}

/* ===== 右下 HUD：改成“中性 tabs + 蓝下划线” ===== */
.right__hud {
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.right :deep(.hud-toggle) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 8px 10px 0;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.35) !important;
  background: rgba(37, 99, 235, 0.1) !important;
}

/* tabs：不再整块色 */
.right :deep(.hud-toggle__btn) {
  position: relative;
  height: 34px;
  border: 0;
  border-radius: 999px;
  padding: 0 10px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1 1 0;

  font-weight: 700;
  cursor: pointer !important;

  background: transparent !important;
  color: rgba(15, 23, 42, 0.78);
  transition:
    color 0.12s ease,
    background 0.12s ease,
    box-shadow 0.12s ease;
}

.hud-toggle__btn:hover {
  color: #0f172a;
}

.hud-toggle__btn:not(.is-active) {
  opacity: 0.85;
}

.right :deep(.hud-toggle__btn.is-active) {
  color: #ffffff !important;
  background: #0b5cff !important;
  box-shadow: 0 10px 18px rgba(11, 92, 255, 0.22);
}

.hud-toggle__btn--measure,
.hud-toggle__btn--note {
  background: transparent;
}

/* badge：统一胶囊 */
.hud-toggle__badge {
  min-width: 24px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 11px;

  color: rgba(15, 23, 42, 0.75);
  background: rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.hud-toggle__btn.is-active .hud-toggle__badge {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.4);
}

/* 内容区 */
.hud-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.hud-pane {
  padding: 10px;
  height: calc(100% - 100px);
}

.hud-pane :deep(.el-scrollbar) {
  height: 100%;
}
.hud-pane :deep(.el-scrollbar__bar) {
  display: none !important;
}
.hud-pane :deep(.el-scrollbar__wrap) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.hud-pane :deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  width: 0;
  height: 0;
}

/* 高对比输入控件 */
.hud-item :deep(.el-input__wrapper),
.hud-item :deep(.el-input-number__input),
.hud-item :deep(.el-input__inner) {
  background: #ffffff;
  color: #0b1324;
  border-color: transparent;
}
.hud-item :deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.hud-item :deep(.el-input__wrapper.is-focus) {
  border-color: #0b5cff;
  box-shadow: 0 0 0 3px rgba(11, 92, 255, 0.25);
}

/* HUD 卡片：统一浅蓝底；NOTE 卡只做很淡黄边提示 */
.hud-item {
  border-radius: 10px;
  padding: 10px 10px;
  margin-bottom: 10px;
  background: #f5f9ff;
  border: 2px solid #0b5cff;
  box-shadow: 0 6px 14px rgba(11, 92, 255, 0.25);
}

.hud-item--n {
  background: #fff6e5;
  border: 1px solid #ff7a00;
  box-shadow: 0 6px 14px rgba(255, 122, 0, 0.25);
}

/* 表单区域排版保持你原来的，只调文本色一致 */
.hud-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.hud-xyz {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.hud-xyz__item {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
}

.lab {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.85);
  text-align: right;
  width: 80px;
  font-size: 14px;
}

.hud-xyz__input {
  width: 100%;
}
.hud-xyz__value {
  display: inline-block;
  color: #0b1324;
  font-weight: 700;
  padding: 0;
  border: 0;
  background: transparent;
}

/* 按钮：定位=蓝，删除=红（语义色） */
.hud-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.hud-btn {
  height: 30px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 900;
  border: 1px solid transparent;
  padding: 0 10px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  transition:
    background-color 0.12s ease,
    transform 0.06s ease,
    border-color 0.12s ease;
}

.hud-btn:active {
  transform: translateY(1px);
}

.hud-btn__icon {
  font-size: 14px;
}

/* 定位：主蓝 */
.hud-btn--b {
  background: #0b5cff;
  color: #ffffff;
  border-color: rgba(11, 92, 255, 0.6);
}
.hud-btn--b:hover {
  background: #1d4ed8;
}

/* 删除：语义红 */
.hud-btn--danger {
  background: #ff3b30;
  color: #ffffff;
  border-color: #ff3b30;
}
.hud-btn--danger:hover {
  background: #e3342f;
}

/* 其它小类保持 */
.w100 {
  width: 100%;
}
aside {
  background-color: #ffffff;
}
</style>
