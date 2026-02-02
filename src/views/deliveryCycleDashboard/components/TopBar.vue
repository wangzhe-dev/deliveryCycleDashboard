<template>
  <header class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2">
      <span
        class="w-12 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        船号
      </span>
      <NativeSelect
        class="h-9 min-w-[140px]"
        :value="selectedShip"
        @change="emit('update:selected-ship', $event.target.value)"
      >
        <NativeSelectOption v-for="o in shipOptions" :key="o" :value="o">
          {{ o }}
        </NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="flex items-center gap-2">
      <span
        class="w-14 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        分段号
      </span>
      <NativeSelect
        class="h-9 min-w-[180px]"
        :value="selectedPart"
        @change="emit('update:selected-part', $event.target.value)"
      >
        <NativeSelectOption v-for="o in bomList" :key="o.materials_code" :value="o.materials_code">
          {{ o.materials_code }}
        </NativeSelectOption>
      </NativeSelect>
    </div>

    <div class="flex flex-1 items-center gap-2">
      <span
        class="w-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        流向
      </span>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="o in flowOptions"
          :key="o"
          size="sm"
          :variant="selectedFlow === o ? 'default' : 'outline'"
          class="h-8 rounded-full px-3 text-xs"
          :class="
            selectedFlow === o
              ? '!bg-primary !text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-primary/30'
              : ''
          "
          type="button"
          @click="emit('flow-toggle', o)"
        >
          {{ o }}
        </Button>
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
