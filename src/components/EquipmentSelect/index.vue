<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-05 13:57:46
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-04-12 10:14:26
 * @Description: 设备-列表
-->
<template>
  <div class="w-full">
    <el-select
      v-model="localValue"
      v-bind="$props"
      placeholder="请选择"
      class="w-full"
      filterable
      @change="change"
    >
      <!-- 不敢用attrs -->
      <el-option
        v-for="dict in options"
        :key="dict.equipmentCode"
        :label="`${dict.equipmentName}(${dict.equipmentCode})`"
        :value="dict.equipmentCode"
      />
    </el-select>
  </div>
</template>

<script setup lang="jsx" name="EquipmentSelect">
import { loadList } from './services';
import { mapValueToLabel } from '@/utils/utils';
const props = defineProps({
  modelValue: {
    type: [Array, String],
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  'collapse-tags': {
    type: Boolean,
    default: false,
  },
  'collapse-tags-tooltip': {
    type: Boolean,
    default: false,
  },
  'max-collapse-tags': {
    type: Number,
    default: 1,
  },
});
const options = ref([]);
const getList = async () => {
  try {
    const { data } = await loadList();
    options.value = Array.isArray(data) ? data : [];
    emit('getOptions', options.value);
  } catch (error) {}
};
getList();
// 本地数据
const localValue = ref('');

watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
);

const emit = defineEmits(['update:modelValue', 'change', 'getOptions']);

function change(value) {
  let label = Array.isArray(value)
    ? value.map((it) => mapValueToLabel(it, options.value, 'equipmentCode', 'equipmentName'))
    : mapValueToLabel(value, options.value, 'equipmentCode', 'equipmentName');
  emit('update:modelValue', value);
  emit('change', value, { label, value, list: options.value }, Array.isArray(value) ? options.value.filter(it => value.includes(it.equipmentCode)) : options.value.find(it => it.equipmentCode === value));
}
</script>
