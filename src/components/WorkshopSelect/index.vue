<template>
  <div class="w-full">
    <el-select
      v-model="localValue"
      placeholder="请选择"
      class="w-full"
      filterable
      :disabled="props.disabled"
      @change="change"
    >
      <el-option
        v-for="dict in test_workshop"
        :key="dict.value"
        :label="dict.label"
        :value="dict.value"
      />
    </el-select>
  </div>
</template>

<script setup lang="jsx" name="WorkshopSelect">
import { loadList } from './services';
import { mapValueToLabel } from '@/utils/utils';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// 本地数据
const localValue = ref('');

watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
);

const emit = defineEmits();
const { proxy } = getCurrentInstance();

const { test_workshop } = proxy.useDictList(['test_workshop']);

function change(value) {
  const label = mapValueToLabel(value, test_workshop);
  emit('update:modelValue', value);
  emit('change', value, { label, value });
}
</script>
