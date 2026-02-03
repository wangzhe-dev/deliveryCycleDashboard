<template>
  <header class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2">
      <span class="w-12 text-[13px] font-semibold text-muted-foreground">
        船号
      </span>
      <NativeSelect
        class="h-9 min-w-[140px] text-[13px]"
        :value="selectedShip"
        @change="emit('update:selected-ship', $event.target.value)"
      >
        <NativeSelectOption v-for="o in shipOptions" :key="o" :value="o">
          {{ o }}
        </NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="flex items-center gap-2">
      <span class="w-14 text-[13px] font-semibold text-muted-foreground">
        分段号
      </span>
      <NativeSelect
        class="h-9 min-w-[180px] text-[13px]"
        :value="selectedPart"
        @change="emit('update:selected-part', $event.target.value)"
      >
        <NativeSelectOption v-for="o in bomList" :key="o.materials_code" :value="o.materials_code">
          {{ o.materials_code }}
        </NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="flex flex-1 items-center gap-2">
      <span class="w-10 text-[13px] font-semibold text-muted-foreground">
        流向
      </span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="o in flowOptions"
          :key="o"
          type="button"
          class="flow-btn h-8 rounded-full px-4 text-[13px] font-medium transition-all"
          :class="selectedFlow === o ? 'flow-btn--active' : 'flow-btn--inactive'"
          @click="emit('flow-toggle', o)"
        >
          {{ o }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { NativeSelect, NativeSelectOption } from '@/components/ui';

const props = defineProps({
  shipOptions: { type: Array, default: () => [] },
  bomList: { type: Array, default: () => [] },
  flowOptions: { type: Array, default: () => [] },
  selectedShip: { type: String, default: '' },
  selectedPart: { type: String, default: '' },
  selectedFlow: { type: String, default: '' },
});

const emit = defineEmits(['update:selected-ship', 'update:selected-part', 'flow-toggle']);
</script>

<style scoped>
.flow-btn {
  cursor: pointer;
  border: 1px solid transparent;
}

/* 选中状态 - 主题色 #e76f51 */
.flow-btn--active {
  background: #e76f51;
  color: #fff;
  border-color: #e76f51;
  box-shadow:
    0 4px 12px rgba(231, 111, 81, 0.35),
    0 2px 4px rgba(231, 111, 81, 0.2);
}

.flow-btn--active:hover {
  background: #d95f43;
  border-color: #d95f43;
}

/* 未选中状态 */
.flow-btn--inactive {
  background: transparent;
  color: #64748b;
  border-color: #e2e8f0;
}

.flow-btn--inactive:hover {
  background: rgba(231, 111, 81, 0.08);
  color: #e76f51;
  border-color: rgba(231, 111, 81, 0.4);
}
</style>
