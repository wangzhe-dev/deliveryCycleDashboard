<template>
  <!-- 省略模式，未展开 -->
  <template v-if="ellipsis && !expanded">
    <!-- 非可展开：保持原有整行 tooltip 行为 -->
    <el-tooltip
      v-if="!expandable"
      :disabled="!needTooltip"
      :content="displayText"
      placement="top"
      effect="dark"
      popper-class="plain-text-tooltip"
    >
      <div class="plain-text__row">
        <div ref="textRef" :class="['plain-text', 'plain-text--ellipsis']">
          {{ displayText }}
        </div>
      </div>
    </el-tooltip>

    <!-- 可展开：只有“更多”悬停/点击才展示全部 -->
    <div v-else class="plain-text__row">
      <div ref="textRef" :class="['plain-text', 'plain-text--ellipsis']">
        {{ displayText }}
      </div>
      <el-tooltip
        v-if="needExpand"
        :content="displayText"
        placement="top"
        effect="dark"
        popper-class="plain-text-tooltip"
      >
        <span
          class="plain-text__action"
          role="button"
          tabindex="0"
          @click.stop="toggleExpand"
          @keydown.enter.stop="toggleExpand"
        >
          {{ moreText }}
        </span>
      </el-tooltip>
    </div>
  </template>

  <!-- 展开模式：直接展示全部文本 -->
  <div v-else-if="ellipsis && expanded" class="plain-text__expanded">
    <div class="plain-text__expanded-text">{{ displayText }}</div>
    <span
      v-if="needExpand"
      class="plain-text__action"
      role="button"
      tabindex="0"
      @click.stop="toggleExpand"
      @keydown.enter.stop="toggleExpand"
    >
      {{ collapseText }}
    </span>
  </div>

  <div v-else ref="textRef" class="plain-text">{{ displayText }}</div>
</template>
<script name="WsllplainText" setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  blur: {
    type: Function,
    default: () => () => {},
  },
  focus: {
    type: Function,
    default: () => () => {},
  },
  change: {
    type: Function,
    default: () => () => {},
  },
  placeholder: {
    type: String,
    default: '请输入',
  },
  ellipsis: {
    type: Boolean,
    default: false,
  },
  expandable: {
    type: Boolean,
    default: false,
  },
  moreText: {
    type: String,
    default: '更多',
  },
  collapseText: {
    type: String,
    default: '收起',
  },
});
const Val = ref(props.modelValue);
const textRef = ref(null);
const needTooltip = ref(false);
const expanded = ref(false);

const needExpand = computed(() => props.expandable && props.ellipsis && needTooltip.value);

const checkOverflow = () => {
  nextTick(() => {
    const el = textRef.value;
    if (!el) return (needTooltip.value = false);
    needTooltip.value = el.scrollWidth > el.clientWidth;
  });
};
const displayText = computed(() => {
  if (Val.value === null || Val.value === undefined) {
    return '';
  }
  return String(Val.value);
});
//监听父组件的值
watch(
  () => props.modelValue,
  () => {
    Val.value = props.modelValue;
  },
);

watch(
  () => displayText.value,
  () => {
    expanded.value = false;
    checkOverflow();
  },
);

onMounted(() => {
  checkOverflow();
  window.addEventListener('resize', checkOverflow);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOverflow);
});

const toggleExpand = () => {
  if (!needExpand.value) return;
  expanded.value = !expanded.value;
  if (!expanded.value) checkOverflow();
};

// 不主动更新父组件（只读展示）
</script>
<style scoped lang="scss">
.plain-text {
  display: inline-block;
  vertical-align: middle;
}
.plain-text__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}
.plain-text--ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  flex: 1 1 auto;
  min-width: 0;
}
.plain-text__expanded {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.plain-text__expanded-text {
  flex: 1 1 auto;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
}
.plain-text__action {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  cursor: pointer;
  user-select: none;
}
:global(.plain-text-tooltip) {
  /* Tooltip popper: allow wrapped, multi-line content and reasonable max width */
  white-space: pre-wrap !important;
  word-break: break-word !important;
  max-width: 60rem; /* ~576px */
  padding: 1rem;
}
</style>
