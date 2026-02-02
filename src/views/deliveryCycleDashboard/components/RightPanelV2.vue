<template>
  <aside
    class="flex h-full min-h-0 flex-col gap-4 transition-all duration-300"
    :class="rightCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'"
  >
    <Card class="flex min-h-0 flex-1 flex-col shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
      <CardHeader class="flex-row items-center justify-between px-4 py-3">
        <CardTitle class="text-base">结构清单</CardTitle>
        <span class="text-xs text-muted-foreground">
          {{ rightTreeLeft.length + rightTreeRight.length }} 项
        </span>
      </CardHeader>
      <CardContent class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-0">
        <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
          <div class="flex min-h-0 flex-col rounded-xl border border-border/70 bg-background/60">
            <div class="flex items-center justify-between border-b border-border/70 px-3 py-2">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                组立清单
              </span>
              <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {{ rightTreeLeft.length }}
              </span>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <button
                v-for="x in rightTreeLeft"
                :key="x.groupName || x.materials_code"
                type="button"
                class="group flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition"
                :class="
                  (x.groupName || x.materials_code) === selectedLeftCode
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                "
                @click="onLeftNodeClick(x.groupName || x.materials_code)"
              >
                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground">
                  <svg-icon icon-class="3D-ZL" class="text-lg" />
                </span>
                <span class="truncate">{{ x.groupName || x.name || x.materials_code }}</span>
              </button>
              <div v-if="!rightTreeLeft.length" class="px-3 py-4 text-xs text-muted-foreground">
                占位
              </div>
            </div>
          </div>

          <div class="flex min-h-0 flex-col rounded-xl border border-border/70 bg-background/60">
            <div class="flex items-center justify-between border-b border-border/70 px-3 py-2">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                零件清单
              </span>
              <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {{ rightTreeRight.length }}
              </span>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <button
                v-for="x in rightTreeRight"
                :key="x.materials_code + '_' + (x.name || '')"
                type="button"
                class="group flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition"
                :class="
                  x.materials_code === selectedLeafCode
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                "
                @click="onRightNodeClick(x.materials_code)"
              >
                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground">
                  <svg-icon icon-class="3D-LJL" class="text-lg" />
                </span>
                <span class="truncate">{{ trimPartCode(x.name || x.materials_code) }}</span>
              </button>
              <div v-if="!rightTreeRight.length" class="px-3 py-4 text-xs text-muted-foreground">
                占位
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="flex min-h-0 flex-col shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
      <CardHeader class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div class="flex-1 text-center">
          <CardTitle class="text-base">组立详情</CardTitle>
          <div class="text-xs text-muted-foreground">实时查看测量与工艺标注</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button size="sm" class="h-8 rounded-full px-3 text-xs" :disabled="!canSaveMarks" @click="onSave">
            保存标注
          </Button>
          <Button
            size="sm"
            :variant="hudTab === 'MEASURE' ? 'default' : 'outline'"
            class="h-8 rounded-full px-3 text-xs"
            @click="onHudTabChange('MEASURE')"
          >
            装配标注 {{ measureList.length }}
          </Button>
          <Button
            size="sm"
            :variant="hudTab === 'NOTE' ? 'default' : 'outline'"
            class="h-8 rounded-full px-3 text-xs"
            @click="onHudTabChange('NOTE')"
          >
            工艺标注 {{ noteList.length }}
          </Button>
        </div>
      </CardHeader>

      <CardContent class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-0">
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="col-span-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2">
            <div class="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {{ selectedLeafCode ? '零件编码' : '组立编码' }}
            </div>
            <div class="mt-1 text-sm font-semibold text-foreground">
              {{
                selectedLeafCode
                  ? trimPartCode(selectedLeafCode)
                  : selectedNode?.materials_code || '-'
              }}
            </div>
          </div>
          <div
            class="rounded-xl border border-border/70 bg-background/70 px-3 py-2"
            :class="selectedLeafCode ? '' : 'col-span-2'"
          >
            <div class="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {{ selectedLeafCode ? '零件重量' : '组立重量' }}
            </div>
            <div class="mt-1 text-sm font-semibold text-foreground">{{ fmt(selectedNode?.weight) }} kg</div>
          </div>
          <div v-if="selectedLeafCode" class="rounded-xl border border-border/70 bg-background/70 px-3 py-2">
            <div class="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">零件宽度</div>
            <div class="mt-1 text-sm font-semibold text-foreground">{{ fmt(selectedNode?.part_width) }} mm</div>
          </div>
          <div
            v-if="selectedLeafCode"
            class="col-span-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2"
          >
            <div class="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">零件长度</div>
            <div class="mt-1 text-sm font-semibold text-foreground">{{ fmt(selectedNode?.part_length) }} mm</div>
          </div>
        </div>

        <section v-if="showDetailPanels" class="flex min-h-0 flex-1 flex-col gap-3">
          <div v-show="hudTab === 'MEASURE'" class="min-h-0 flex-1 overflow-y-auto pr-1">
            <div v-if="!measureList.length" class="px-2 py-3 text-xs text-muted-foreground">
              暂无装配信息
            </div>

            <div
              v-for="m in measureList"
              :key="m.id"
              class="mb-3 rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm"
            >
              <div class="grid gap-3 text-xs">
                <div class="grid grid-cols-[72px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">测量值</span>
                  <Input
                    :model-value="getMeasureDisplayText(m)"
                    class="h-9"
                    @update:model-value="(v) => onMeasureTextChange(m.id, v)"
                  />
                </div>
                <div class="grid gap-2">
                  <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                    <span class="text-[11px] font-semibold text-muted-foreground">A点-X</span>
                    <Input
                      type="number"
                      step="0.001"
                      :model-value="getDeltaVal(m.aDelta, 0)"
                      class="h-9"
                      @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 0, toNumber(v))"
                    />
                  </div>
                  <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                    <span class="text-[11px] font-semibold text-muted-foreground">A点-Y</span>
                    <Input
                      type="number"
                      step="0.001"
                      :model-value="getDeltaVal(m.aDelta, 1)"
                      class="h-9"
                      @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 1, toNumber(v))"
                    />
                  </div>
                  <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                    <span class="text-[11px] font-semibold text-muted-foreground">A点-Z</span>
                    <Input
                      type="number"
                      step="0.001"
                      :model-value="getDeltaVal(m.aDelta, 2)"
                      class="h-9"
                      @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'a', 2, toNumber(v))"
                    />
                  </div>
                </div>
              </div>

              <div class="mt-3 grid gap-2 text-xs">
                <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">B点-X</span>
                  <Input
                    type="number"
                    step="0.001"
                    :model-value="getDeltaVal(m.bDelta, 0)"
                    class="h-9"
                    @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 0, toNumber(v))"
                  />
                </div>
                <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">B点-Y</span>
                  <Input
                    type="number"
                    step="0.001"
                    :model-value="getDeltaVal(m.bDelta, 1)"
                    class="h-9"
                    @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 1, toNumber(v))"
                  />
                </div>
                <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">B点-Z</span>
                  <Input
                    type="number"
                    step="0.001"
                    :model-value="getDeltaVal(m.bDelta, 2)"
                    class="h-9"
                    @update:model-value="(v) => onMeasurePointDeltaChange(m.id, 'b', 2, toNumber(v))"
                  />
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" class="gap-2" @click="onLocateMeasure(m)">
                  <Locate class="h-4 w-4" />
                  定位
                </Button>
                <Button size="sm" variant="destructive" class="gap-2" @click="onRemoveMeasure(m.id)">
                  <Delete class="h-4 w-4" />
                  删除
                </Button>
              </div>
            </div>
          </div>

          <div v-show="hudTab === 'NOTE'" class="min-h-0 flex-1 overflow-y-auto pr-1">
            <div v-if="!noteList.length" class="px-2 py-3 text-xs text-muted-foreground">
              暂无工艺信息
            </div>

            <div
              v-for="n in noteList"
              :key="n.id"
              class="mb-3 rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm"
            >
              <div class="grid gap-3 text-xs">
                <div class="grid grid-cols-[72px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">标注信息</span>
                  <Input
                    :model-value="n.text"
                    placeholder="输入标注信息..."
                    class="h-9"
                    @update:model-value="(v) => onNoteTextChange(n.id, v)"
                  />
                </div>
                <div class="grid grid-cols-[40px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">X</span>
                  <Input
                    type="number"
                    step="1"
                    :model-value="getDeltaVal(n.bboxDelta, 0)"
                    class="h-9"
                    @update:model-value="(v) => onNoteDeltaChange(n.id, 0, toNumber(v))"
                  />
                </div>
                <div class="grid grid-cols-[40px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">Y</span>
                  <Input
                    type="number"
                    step="1"
                    :model-value="getDeltaVal(n.bboxDelta, 1)"
                    class="h-9"
                    @update:model-value="(v) => onNoteDeltaChange(n.id, 1, toNumber(v))"
                  />
                </div>
                <div class="grid grid-cols-[40px_1fr] items-center gap-2">
                  <span class="text-[11px] font-semibold text-muted-foreground">Z</span>
                  <Input
                    type="number"
                    step="1"
                    :model-value="getDeltaVal(n.bboxDelta, 2)"
                    class="h-9"
                    @update:model-value="(v) => onNoteDeltaChange(n.id, 2, toNumber(v))"
                  />
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" class="gap-2" @click="onLocateNote(n)">
                  <Locate class="h-4 w-4" />
                  定位
                </Button>
                <Button size="sm" variant="destructive" class="gap-2" @click="onRemoveNote(n.id)">
                  <Delete class="h-4 w-4" />
                  删除
                </Button>
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
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
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
