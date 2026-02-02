<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: string
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const percentage = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})

function onInput(event: Event) {
  emit('update:modelValue', Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider-thumb"
      :style="{
        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--secondary)) ${percentage}%, hsl(var(--secondary)) 100%)`
      }"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.slider-thumb::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: hsl(var(--primary));
  cursor: pointer;
  box-shadow: 0 0 10px hsl(var(--primary) / 0.5);
  transition: all 0.2s;
}

.slider-thumb::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px hsl(var(--primary) / 0.7);
}

.slider-thumb::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: hsl(var(--primary));
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px hsl(var(--primary) / 0.5);
}
</style>
