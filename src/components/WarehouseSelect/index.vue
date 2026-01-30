<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-07 10:47:41
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-10-16 11:12:42
 * @Description: 仓库
-->
<template>
  <div class="w-full">
    <el-select
      v-model="localValue"
      placeholder="请选择"
      class="w-full"
      filterable
      clearable
      :disabled="props.disabled"
      @change="change"
    >
      <el-option
        v-for="dict in warehouseList"
        :key="dict.id"
        :label="dict.warehouseName"
        :value="dict.warehouseCode"
      />
    </el-select>
  </div>
</template>

<script setup lang="jsx" name="WarehouseSelect">
import { loadList } from './services';
import { mapValueToLabel } from '@/utils/utils';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  linkageCode: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  requestAuto: {
    type: Boolean,
    default: false,
  },
});
const warehouseList = ref([]);
const getList = async (factoryCode) => {
  try {
    warehouseList.value = [];
    const { data } = await loadList({ factoryCode });
    warehouseList.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(error);
  }
};
props.requestAuto && getList();

// 本地数据
const localValue = ref('');

watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
  { immediate: true },
);

watch(
  () => props.linkageCode,
  (nV) => {
    getList(nV);
  },
  { immediate: true, deep: true },
);

const emit = defineEmits();

function change(value) {
  const label = mapValueToLabel(value, warehouseList.value, 'warehouseCode', 'warehouseName');
  emit('update:modelValue', value);
  emit('change', value, { label, value });
}
</script>
