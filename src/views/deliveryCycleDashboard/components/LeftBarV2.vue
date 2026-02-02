<template>
  <aside
    class="flex flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-background/90 via-background/80 to-muted/60 p-2.5 text-slate-900 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur"
  >
    <section class="flex flex-col gap-2">
      <div class="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        视图
      </div>
      <div class="grid gap-2">
        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          :variant="mode === 'normal' ? 'default' : 'outline'"
          :aria-pressed="mode === 'normal'"
          @click="$emit('set-mode', 'normal')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.model" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>原始模型</span>
        </Button>

        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          :variant="mode === 'wire' ? 'default' : 'outline'"
          :aria-pressed="mode === 'wire'"
          @click="$emit('set-mode', 'wire')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.wire" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>透明框线</span>
        </Button>
      </div>
    </section>

    <div class="h-px bg-border/70"></div>

    <section class="flex flex-col gap-2">
      <div class="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        工具
      </div>
      <div class="grid gap-2">
        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          :variant="explodeOn ? 'default' : 'outline'"
          :aria-pressed="explodeOn"
          @click="$emit('toggle-explode')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.explode" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>爆炸图</span>
        </Button>

        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          :variant="colorIsolated ? 'default' : 'outline'"
          :aria-pressed="colorIsolated"
          @click="$emit('toggle-color-isolation')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.isolate" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>颜色隔离</span>
        </Button>

        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          :variant="toolMode === 'pick' ? 'default' : 'outline'"
          :aria-pressed="toolMode === 'pick'"
          @click="$emit('set-tool', 'pick')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.pick" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>选择工具</span>
        </Button>

        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          :variant="toolMode === 'measure' ? 'default' : 'outline'"
          :aria-pressed="toolMode === 'measure'"
          @click="$emit('set-tool', 'measure')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.measure" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>标距工具</span>
        </Button>

        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          :variant="toolMode === 'note' ? 'default' : 'outline'"
          :aria-pressed="toolMode === 'note'"
          @click="$emit('set-tool', 'note')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.note" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>标注工具</span>
        </Button>

        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          variant="outline"
          @click="$emit('fit-view')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.fit" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>自适应</span>
        </Button>

        <Button
          size="sm"
          class="h-10 w-full justify-start gap-2 rounded-xl text-xs"
          variant="outline"
          @click="$emit('clear-marks')"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <img :src="icons.clear" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span>清除标注</span>
        </Button>
      </div>
    </section>
  </aside>
</template>

<script setup>
import { Button } from '@/components/ui';
import iconModel from '@/assets/icons/svg/3D-ys.svg';
import iconWire from '@/assets/icons/svg/3D-ts.svg';
import iconExplode from '@/assets/icons/svg/3D-bz.svg';
import iconIsolate from '@/assets/icons/svg/3D-xg.svg';
import iconPick from '@/assets/icons/svg/3D-xq.svg';
import iconMeasure from '@/assets/icons/svg/3D-jl.svg';
import iconNote from '@/assets/icons/svg/3D-dbz.svg';
import iconFit from '@/assets/icons/svg/3D-auto.svg';
import iconClear from '@/assets/icons/svg/3D-qk.svg';

defineProps({
  mode: { type: String, default: 'normal' }, // normal | wire
  explodeOn: { type: Boolean, default: false },
  toolMode: { type: String, default: 'pick' }, // pick | measure | note
  colorIsolated: { type: Boolean, default: false },
});

defineEmits([
  'set-mode',
  'set-tool',
  'toggle-explode',
  'clear-marks',
  'fit-view',
  'toggle-color-isolation',
]);

const icons = {
  model: iconModel,
  wire: iconWire,
  explode: iconExplode,
  isolate: iconIsolate,
  pick: iconPick,
  measure: iconMeasure,
  note: iconNote,
  fit: iconFit,
  clear: iconClear,
};
</script>
