<template>
  <aside class="leftbar">
    <!-- 视图 -->
    <section class="group">
      <div class="ghead">
        <div class="rule" />
        <div class="title">视图</div>
        <div class="rule" />
      </div>

      <div class="stack">
        <button
          class="btn"
          :class="{ active: mode === 'normal' }"
          @click="$emit('set-mode', 'normal')"
          type="button"
        >
          <span class="ico ico--lg" aria-hidden="true">
            <svg-icon icon-class="3D-ys" />
          </span>
          <span class="txt">原始模型</span>
        </button>

        <button
          class="btn"
          :class="{ active: mode === 'wire' }"
          @click="$emit('set-mode', 'wire')"
          type="button"
        >
          <span class="ico ico--lg" aria-hidden="true">
            <svg-icon icon-class="3D-ts" />
          </span>
          <span class="txt">透明框线</span>
        </button>
      </div>
    </section>

    <!-- 工具 -->
    <section class="group">
      <div class="ghead">
        <div class="rule" />
        <div class="title">工具</div>
        <div class="rule" />
      </div>

      <div class="stack">

        <button
          class="btn btn--accent"
          :class="{ active: explodeOn }"
          @click="$emit('toggle-explode')"
          type="button"
        >
          <span class="ico ico--lg" aria-hidden="true">
            <svg-icon icon-class="3D-bz" />
          </span>
          <span class="txt">爆炸图</span>
        </button>

        <button
          class="btn btn--accent"
          :class="{ active: colorIsolated }"
          @click="$emit('toggle-color-isolation')"
          type="button"
        >
          <span class="ico ico--md" aria-hidden="true">
            <svg-icon icon-class="3D-ys" />
          </span>
          <span class="txt">颜色隔离</span>
        </button>
        <button
          class="btn btn--accent"
          :class="{ active: toolMode === 'pick' }"
          @click="$emit('set-tool', 'pick')"
          type="button"
        >
          <span class="ico ico--md" aria-hidden="true">
            <svg-icon icon-class="3D-xq" />
          </span>
          <span class="txt">选择工具</span>
        </button>

        <button
          class="btn btn--accent"
          :class="{ active: toolMode === 'measure' }"
          @click="$emit('set-tool', 'measure')"
          type="button"
        >
          <span class="ico ico--md" aria-hidden="true">
            <svg-icon icon-class="3D-jl" />
          </span>
          <span class="txt">标距工具</span>
        </button>

        <button
          class="btn btn--accent"
          :class="{ active: toolMode === 'note' }"
          @click="$emit('set-tool', 'note')"
          type="button"
        >
          <span class="ico ico--md" aria-hidden="true">
            <svg-icon icon-class="3D-dbz" />
          </span>
          <span class="txt">标注工具</span>
        </button>


        <button class="btn" @click="$emit('fit-view')" type="button">
          <span class="ico ico--md" aria-hidden="true">
            <svg-icon icon-class="3D-auto" />
          </span>
          <span class="txt">自适应</span>
        </button>

        <button class="btn" @click="$emit('clear-marks')" type="button">
          <span class="ico ico--md" aria-hidden="true">
            <svg-icon icon-class="3D-qk" />
          </span>
          <span class="txt">清除标注</span>
        </button>
      </div>
    </section>
  </aside>
</template>

<script setup>
defineProps({
  mode: { type: String, default: 'normal' }, // normal | wire
  explodeOn: { type: Boolean, default: false },
  toolMode: { type: String, default: 'pick' }, // pick | measure | note
  isolateSelected: { type: Boolean, default: false },
  colorIsolated: { type: Boolean, default: false },
});

defineEmits([
  'set-mode',
  'set-tool',
  'toggle-explode',
  'toggle-param',
  'clear-marks',
  'toggle-isolate',
  'fit-view',
  'toggle-color-isolation',
]);
</script>

<style scoped>
/* ====== Blue Ultra（更亮更通透）+ 大屏：背景稍微深一点（降眩光） ====== */
.leftbar {
  /* ✅ 背景稍深：从纯白改为“淡蓝灰渐变”，大屏更舒服 */
  --lb-bg: var(--left-shell-bg, linear-gradient(180deg, #f6f2eb 0%, #eee7df 100%));
  --lb-border: transparent;

  /* 分隔线 & 点缀色 */
  --lb-divider: #d3d8de;
  --lb-mark: #d1b27c;
  --lb-mark-rgb: 209, 178, 124;

  /* 文本 */
  --lb-text: #1f2933;
  --lb-text-2: #6b7280;
  --lb-title: #2b3440;
  --lb-ico-fg: #2f3a44;

  /* ✅ 卡片也跟着压一点亮度，但仍然通透 */
  --lb-card-1: #fbf7f1;
  --lb-card-2: #f1ebe4;
  --lb-card-h-1: #f6f1ea;
  --lb-card-h-2: #ebe5dd;

  /* hover / focus */
  --lb-hover-border: rgba(71, 85, 105, 0.18);
  --lb-focus: rgba(71, 85, 105, 0.25);

  /* Active：主色 */
  --lb-active-1: #6d8aa3;
  --lb-active-2: #3b5164;
  --lb-active-border: rgba(59, 81, 100, 0.55);
  --lb-active-shadow: rgba(59, 81, 100, 0.22);
  --lb-active-inset: rgba(59, 81, 100, 0.12);

  /* Active：工具组强调色 */
  --lb-accent-1: #7a8a95;
  --lb-accent-2: #3f4d58;
  --lb-accent-border: rgba(63, 77, 88, 0.55);
  --lb-accent-shadow: rgba(63, 77, 88, 0.22);
  --lb-accent-inset: rgba(63, 77, 88, 0.12);

  /* icon 渐变 */
  --lb-ico-g1: rgba(227, 218, 206, 0.6);
  --lb-ico-g2: rgba(205, 216, 228, 0.35);
  --lb-ico-g3: rgba(255, 255, 255, 0.85);
  --lb-ico-stroke: rgba(148, 163, 184, 0.2);

  height: 100%;
  background: var(--lb-bg);
  border: 0;
  border-radius: 12px 0px 0px 12px;
  padding: 10px;
  overflow: auto;
  display: grid;
  gap: 12px;
}

.leftbar::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.leftbar {
  scrollbar-width: none;
  scrollbar-color: transparent transparent;
}

/* 分组头 */
.group {
  display: grid;
  gap: 10px;
}

.ghead {
  display: grid;
  grid-template-columns: 15px 1fr 15px;
  align-items: center;
  gap: 4px;
}

.title {
  font-size: 13px;
  font-weight: 800;
  color: var(--lb-title);
  letter-spacing: 0.5px;
  text-align: center;
}

.rule {
  height: 1px;
  background: var(--lb-divider);
}

.stack {
  display: grid;
  gap: 8px;
}

/* 按钮 */
.btn {
  position: relative;
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: linear-gradient(180deg, var(--lb-card-1) 0%, var(--lb-card-2) 100%);
  border-radius: 12px;
  cursor: pointer;

  padding: 10px 4px;
  display: grid;
  grid-template-rows: 1fr auto;
  justify-items: center;
  align-items: center;
  gap: 6px;

  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  transition: background 0.12s ease, transform 0.06s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}

.btn:hover {
  background: linear-gradient(180deg, var(--lb-card-h-1) 0%, var(--lb-card-h-2) 100%);
  border-color: var(--lb-hover-border);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.btn:active {
  transform: translateY(1px);
}

.btn:focus-visible {
  outline: 2px solid var(--lb-focus);
  outline-offset: 2px;
}

/* icon */
.ico {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--lb-ico-fg);
  border-radius: 10px;

  background: linear-gradient(
    135deg,
    var(--lb-ico-g1) 0%,
    var(--lb-ico-g2) 55%,
    var(--lb-ico-g3) 100%
  );
  box-shadow: inset 0 0 0 1px var(--lb-ico-stroke);
}

.ico--lg {
  font-size: 30px;
}
.ico--md {
  font-size: 25px;
}

.ico :deep(.svg-icon) {
  font-size: inherit;
}

/* 文案 */
.txt {
  font-size: 12px;
  font-weight: 800;
  color: var(--lb-text);
  line-height: 1;
}

/* Active：主色 */
.btn.active {
  background: var(--lb-active-2);
  border-color: var(--lb-active-border);
  box-shadow:
    0 14px 28px var(--lb-active-shadow),
    0 0 0 2px var(--lb-active-inset) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

/* active 底部淡金光带 */
.btn.active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 8px;
  height: 2px;
  border-radius: 999px;
  opacity: 0.9;
  /* background: linear-gradient(
    90deg,
    rgba(var(--lb-mark-rgb), 0) 0%,
    rgba(var(--lb-mark-rgb), 0.85) 50%,
    rgba(var(--lb-mark-rgb), 0) 100%
  ); */
  pointer-events: none;
}

/* active 右上角淡金点 */
.btn.active::before {
  content: '';
  position: absolute;
  right: 10px;
  top: 10px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--lb-mark);
  box-shadow: 0 0 0 3px rgba(var(--lb-mark-rgb), 0.18), 0 0 14px rgba(var(--lb-mark-rgb), 0.25);
  pointer-events: none;
}

.btn.active .txt {
  color: #ffffff;
}
.btn.active .ico {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
}

/* Active：工具组紫色 */
.btn--accent.active {
  background: var(--lb-accent-2);
  border-color: var(--lb-accent-border);
  box-shadow:
    0 14px 28px var(--lb-accent-shadow),
    0 0 0 2px var(--lb-accent-inset) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.btn--accent.active .txt {
  color: #ffffff;
}
.btn--accent.active .ico {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
}
</style>
