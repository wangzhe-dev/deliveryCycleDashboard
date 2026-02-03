<template>
  <aside
    class="leftbar flex flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-background/90 via-background/80 to-muted/60 p-2.5 text-slate-900 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur"
  >
    <section class="flex flex-col gap-2">
      <div class="section-title text-center text-[12px] font-semibold text-muted-foreground">
        视图
      </div>
      <div class="grid gap-2">
        <button
          type="button"
          class="tool-btn"
          :class="mode === 'normal' ? 'tool-btn--active' : 'tool-btn--inactive'"
          :aria-pressed="mode === 'normal'"
          @click="$emit('set-mode', 'normal')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.model" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">原始模型</span>
        </button>

        <button
          type="button"
          class="tool-btn"
          :class="mode === 'wire' ? 'tool-btn--active' : 'tool-btn--inactive'"
          :aria-pressed="mode === 'wire'"
          @click="$emit('set-mode', 'wire')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.wire" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">透明框线</span>
        </button>
      </div>
    </section>

    <div class="h-px bg-border/70"></div>

    <section class="flex flex-col gap-2">
      <div class="section-title text-center text-[12px] font-semibold text-muted-foreground">
        工具
      </div>
      <div class="grid gap-2">
        <button
          type="button"
          class="tool-btn"
          :class="explodeOn ? 'tool-btn--active' : 'tool-btn--inactive'"
          :aria-pressed="explodeOn"
          @click="$emit('toggle-explode')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.explode" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">爆炸图</span>
        </button>

        <button
          type="button"
          class="tool-btn"
          :class="colorIsolated ? 'tool-btn--active' : 'tool-btn--inactive'"
          :aria-pressed="colorIsolated"
          @click="$emit('toggle-color-isolation')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.isolate" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">颜色隔离</span>
        </button>

        <button
          type="button"
          class="tool-btn"
          :class="toolMode === 'pick' ? 'tool-btn--active' : 'tool-btn--inactive'"
          :aria-pressed="toolMode === 'pick'"
          @click="$emit('set-tool', 'pick')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.pick" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">选择工具</span>
        </button>

        <button
          type="button"
          class="tool-btn"
          :class="toolMode === 'measure' ? 'tool-btn--active' : 'tool-btn--inactive'"
          :aria-pressed="toolMode === 'measure'"
          @click="$emit('set-tool', 'measure')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.measure" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">标距工具</span>
        </button>

        <button
          type="button"
          class="tool-btn"
          :class="toolMode === 'note' ? 'tool-btn--active' : 'tool-btn--inactive'"
          :aria-pressed="toolMode === 'note'"
          @click="$emit('set-tool', 'note')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.note" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">标注工具</span>
        </button>

        <button
          type="button"
          class="tool-btn tool-btn--inactive"
          @click="$emit('fit-view')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.fit" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">自适应</span>
        </button>

        <button
          type="button"
          class="tool-btn tool-btn--inactive"
          @click="$emit('clear-marks')"
        >
          <span class="tool-btn__icon">
            <img :src="icons.clear" alt="" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="tool-btn__label">清除标注</span>
        </button>
      </div>
    </section>
  </aside>
</template>

<script setup>
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

<style scoped>
/* 分组标题 */
.section-title {
  letter-spacing: 0.1em;
  color: #64748b;
}

/* 工具按钮基础样式 */
.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 2.5rem;
  padding: 0 0.5rem;
  border-radius: 0.75rem;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* 图标容器 */
.tool-btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

/* 文字标签 */
.tool-btn__label {
  flex: 1;
  text-align: left;
}

/* 激活状态 - 主题色 #e76f51 */
.tool-btn--active {
  background: #e76f51;
  color: #fff;
  border-color: #e76f51;
  box-shadow:
    0 4px 12px rgba(231, 111, 81, 0.3),
    0 2px 4px rgba(231, 111, 81, 0.15);
}

.tool-btn--active .tool-btn__icon {
  background: rgba(255, 255, 255, 0.2);
}

.tool-btn--active:hover {
  background: #d95f43;
  border-color: #d95f43;
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(231, 111, 81, 0.35),
    0 3px 6px rgba(231, 111, 81, 0.2);
}

/* 未激活状态 */
.tool-btn--inactive {
  background: rgba(255, 255, 255, 0.6);
  color: #475569;
  border-color: #e2e8f0;
}

.tool-btn--inactive .tool-btn__icon {
  background: rgba(231, 111, 81, 0.08);
}

.tool-btn--inactive:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #e76f51;
  border-color: rgba(231, 111, 81, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 111, 81, 0.1);
}

.tool-btn--inactive:hover .tool-btn__icon {
  background: rgba(231, 111, 81, 0.15);
}
</style>
