<template>
  <aside
    class="right-panel flex h-full min-h-0 flex-col gap-3 transition-all duration-300"
    :class="rightCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'"
  >
    <!-- 结构清单 -->
    <Card class="flex min-h-0 flex-1 flex-col shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
      <CardHeader class="flex-row items-center justify-between px-4 py-3">
        <CardTitle class="text-[15px]">结构清单</CardTitle>
        <span class="panel-badge">
          {{ rightTreeLeft.length + rightTreeRight.length }} 项
        </span>
      </CardHeader>
      <CardContent class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-0">
        <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
          <!-- 组立清单 -->
          <div class="flex min-h-0 flex-col rounded-xl border border-border/70 bg-background/60">
            <div class="flex items-center justify-between border-b border-border/70 px-3 py-2">
              <span class="text-[12px] font-semibold text-muted-foreground">组立清单</span>
              <span class="panel-badge-sm">{{ rightTreeLeft.length }}</span>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <button
                v-for="x in rightTreeLeft"
                :key="x.groupName || x.materials_code"
                type="button"
                class="list-item"
                :class="(x.groupName || x.materials_code) === selectedLeftCode ? 'list-item--active' : ''"
                @click="onLeftNodeClick(x.groupName || x.materials_code)"
              >
                <span class="list-item__icon">
                  <svg-icon icon-class="3D-ZL" class="text-base" />
                </span>
                <span class="truncate">{{ x.groupName || x.name || x.materials_code }}</span>
              </button>
              <div v-if="!rightTreeLeft.length" class="px-3 py-4 text-[13px] text-muted-foreground">
                暂无数据
              </div>
            </div>
          </div>

          <!-- 零件清单 -->
          <div class="flex min-h-0 flex-col rounded-xl border border-border/70 bg-background/60">
            <div class="flex items-center justify-between border-b border-border/70 px-3 py-2">
              <span class="text-[12px] font-semibold text-muted-foreground">零件清单</span>
              <span class="panel-badge-sm">{{ rightTreeRight.length }}</span>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <button
                v-for="x in rightTreeRight"
                :key="x.materials_code + '_' + (x.name || '')"
                type="button"
                class="list-item"
                :class="x.materials_code === selectedLeafCode ? 'list-item--active' : ''"
                @click="onRightNodeClick(x.materials_code)"
              >
                <span class="list-item__icon">
                  <svg-icon icon-class="3D-LJL" class="text-base" />
                </span>
                <span class="truncate">{{ trimPartCode(x.name || x.materials_code) }}</span>
              </button>
              <div v-if="!rightTreeRight.length" class="px-3 py-4 text-[13px] text-muted-foreground">
                暂无数据
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 组立详情 -->
    <Card class="flex min-h-0 flex-col shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
      <CardHeader class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div class="flex-1 text-center">
          <CardTitle class="text-[15px] text-center">组立详情</CardTitle>
          <div class="text-[12px] text-center text-muted-foreground">实时查看测量与工艺标注</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="tab-btn tab-btn--save"
            :disabled="!canSaveMarks"
            @click="onSave"
          >
            保存标注
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="hudTab === 'MEASURE' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="onHudTabChange('MEASURE')"
          >
            装配标注 {{ measureList.length }}
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="hudTab === 'NOTE' ? 'tab-btn--active' : 'tab-btn--inactive'"
            @click="onHudTabChange('NOTE')"
          >
            工艺标注 {{ noteList.length }}
          </button>
        </div>
      </CardHeader>

      <CardContent class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-0">
        <!-- 信息卡片 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="info-card col-span-2">
            <div class="info-card__label">{{ selectedLeafCode ? '零件编码' : '组立编码' }}</div>
            <div class="info-card__value">
              {{ selectedLeafCode ? trimPartCode(selectedLeafCode) : selectedNode?.materials_code || '-' }}
            </div>
          </div>
          <div class="info-card" :class="selectedLeafCode ? '' : 'col-span-2'">
            <div class="info-card__label">{{ selectedLeafCode ? '零件重量' : '组立重量' }}</div>
            <div class="info-card__value">{{ fmt(selectedNode?.weight) }} kg</div>
          </div>
          <div v-if="selectedLeafCode" class="info-card">
            <div class="info-card__label">零件宽度</div>
            <div class="info-card__value">{{ fmt(selectedNode?.part_width) }} mm</div>
          </div>
          <div v-if="selectedLeafCode" class="info-card col-span-2">
            <div class="info-card__label">零件长度</div>
            <div class="info-card__value">{{ fmt(selectedNode?.part_length) }} mm</div>
          </div>
        </div>

        <!-- 标注列表 -->
        <section v-if="showDetailPanels" class="flex min-h-0 flex-1 flex-col gap-3">
          <!-- 装配标注 -->
          <div v-show="hudTab === 'MEASURE'" class="min-h-0 flex-1 overflow-y-auto pr-1">
            <div v-if="!measureList.length" class="px-2 py-3 text-[13px] text-muted-foreground">
              暂无装配信息
            </div>

            <div v-for="m in measureList" :key="m.id" class="mark-card">
              <div class="grid gap-2">
                <div class="mark-card__row">
                  <span class="mark-card__label">测量值</span>
                  <Input
                    :model-value="getMeasureDisplayText(m)"
                    class="mark-card__input"
                    @update:model-value="(v) => onMeasureTextChange(m.id, v)"
                  />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">A点-X</span>
                  <Input type="number" step="0.001" :model-value="getDeltaVal(m.aDelta, 0)" class="mark-card__input" @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 0, toNumber(v))" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">A点-Y</span>
                  <Input type="number" step="0.001" :model-value="getDeltaVal(m.aDelta, 1)" class="mark-card__input" @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 1, toNumber(v))" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">A点-Z</span>
                  <Input type="number" step="0.001" :model-value="getDeltaVal(m.aDelta, 2)" class="mark-card__input" @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 2, toNumber(v))" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">B点-X</span>
                  <Input type="number" step="0.001" :model-value="getDeltaVal(m.bDelta, 0)" class="mark-card__input" @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 0, toNumber(v))" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">B点-Y</span>
                  <Input type="number" step="0.001" :model-value="getDeltaVal(m.bDelta, 1)" class="mark-card__input" @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 1, toNumber(v))" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">B点-Z</span>
                  <Input type="number" step="0.001" :model-value="getDeltaVal(m.bDelta, 2)" class="mark-card__input" @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 2, toNumber(v))" />
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button type="button" class="action-btn action-btn--locate" @click="onLocateMeasure(m)">
                  <Locate class="h-4 w-4" /> 定位
                </button>
                <button type="button" class="action-btn action-btn--delete" @click="onRemoveMeasure(m.id)">
                  <Delete class="h-4 w-4" /> 删除
                </button>
              </div>
            </div>
          </div>

          <!-- 工艺标注 -->
          <div v-show="hudTab === 'NOTE'" class="min-h-0 flex-1 overflow-y-auto pr-1">
            <div v-if="!noteList.length" class="px-2 py-3 text-[13px] text-muted-foreground">
              暂无工艺信息
            </div>

            <div v-for="n in noteList" :key="n.id" class="mark-card">
              <div class="grid gap-2">
                <div class="mark-card__row">
                  <span class="mark-card__label">标注</span>
                  <Input :model-value="n.text" placeholder="输入标注信息..." class="mark-card__input" @update:model-value="(v) => onNoteTextChange(n.id, v)" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">X</span>
                  <Input type="number" step="1" :model-value="getDeltaVal(n.bboxDelta, 0)" class="mark-card__input" @update:model-value="(v) => onNoteDeltaChange(n.id, 0, toNumber(v))" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">Y</span>
                  <Input type="number" step="1" :model-value="getDeltaVal(n.bboxDelta, 1)" class="mark-card__input" @update:model-value="(v) => onNoteDeltaChange(n.id, 1, toNumber(v))" />
                </div>
                <div class="mark-card__row">
                  <span class="mark-card__label">Z</span>
                  <Input type="number" step="1" :model-value="getDeltaVal(n.bboxDelta, 2)" class="mark-card__input" @update:model-value="(v) => onNoteDeltaChange(n.id, 2, toNumber(v))" />
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button type="button" class="action-btn action-btn--locate" @click="onLocateNote(n)">
                  <Locate class="h-4 w-4" /> 定位
                </button>
                <button type="button" class="action-btn action-btn--delete" @click="onRemoveNote(n.id)">
                  <Delete class="h-4 w-4" /> 删除
                </button>
              </div>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  </aside>
</template>

<script setup>
import { Delete, Locate } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { watch } from 'vue';

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
  getMeasureDisplayText: { type: Function, default: () => '' },
  getDeltaVal: { type: Function, default: () => 0 },
  showDetailPanels: { type: Boolean, default: true },
  canSaveMarks: { type: Boolean, default: false },
  onSave: { type: Function, default: () => {} },
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

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

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
/* 徽章 */
.panel-badge {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: rgba(231, 111, 81, 0.1);
  padding: 2px 10px;
  border-radius: 999px;
}

.panel-badge-sm {
  font-size: 11px;
  font-weight: 600;
  color: #e76f51;
  background: rgba(231, 111, 81, 0.1);
  padding: 2px 8px;
  border-radius: 999px;
}

/* 列表项 */
.list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  background: transparent;
}

.list-item:hover {
  background: rgba(231, 111, 81, 0.06);
  color: #475569;
}

.list-item--active {
  background: rgba(231, 111, 81, 0.12);
  color: #e76f51;
}

.list-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  background: rgba(231, 111, 81, 0.08);
  color: #e76f51;
  flex-shrink: 0;
}

.list-item--active .list-item__icon {
  background: rgba(231, 111, 81, 0.2);
}

/* Tab 按钮 */
.tab-btn {
  height: 2rem;
  padding: 0 0.875rem;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.tab-btn--active {
  background: #e76f51;
  color: #fff;
  border-color: #e76f51;
  box-shadow: 0 2px 8px rgba(231, 111, 81, 0.25);
}

.tab-btn--active:hover {
  background: #d95f43;
}

.tab-btn--inactive {
  background: transparent;
  color: #64748b;
  border-color: #e2e8f0;
}

.tab-btn--inactive:hover {
  background: rgba(231, 111, 81, 0.08);
  color: #e76f51;
  border-color: rgba(231, 111, 81, 0.3);
}

.tab-btn--save {
  background: #e76f51;
  color: #fff;
  border-color: #e76f51;
  box-shadow: 0 2px 8px rgba(231, 111, 81, 0.25);
}

.tab-btn--save:hover:not(:disabled) {
  background: #d95f43;
}

.tab-btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 信息卡片 */
.info-card {
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(231, 111, 81, 0.15);
  background: rgba(255, 255, 255, 0.7);
}

.info-card__label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.info-card__value {
  margin-top: 0.25rem;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* 标注卡片 */
.mark-card {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(231, 111, 81, 0.15);
  background: rgba(255, 255, 255, 0.8);
}

.mark-card__row {
  display: grid;
  grid-template-columns: 52px 1fr;
  align-items: center;
  gap: 0.5rem;
}

.mark-card__label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.mark-card__input {
  height: 2rem;
  font-size: 13px;
}

/* 操作按钮 */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.action-btn--locate {
  background: rgba(231, 111, 81, 0.1);
  color: #e76f51;
  border-color: rgba(231, 111, 81, 0.2);
}

.action-btn--locate:hover {
  background: rgba(231, 111, 81, 0.18);
  border-color: rgba(231, 111, 81, 0.35);
}

.action-btn--delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.action-btn--delete:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.35);
}
</style>
