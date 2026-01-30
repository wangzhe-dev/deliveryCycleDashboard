<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-07 10:47:41
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-10-16 11:14:05
 * @Description: 库位
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
      :allowCreate="props.allowCreate"
      @change="change"
    >
      <el-option
        v-for="dict in listOpt"
        :key="dict.locationCode"
        :label="dict.locationName"
        :value="dict.locationCode"
      />
    </el-select>
  </div>
</template>

<script setup lang="jsx" name="LocationSelect">
import { loadList } from './services';
import { mapValueToLabel } from '@/utils/utils';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  linkage: {
    type: Object,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  requestAuto: {
    type: Boolean,
    default: false,
  },
  allowCreate: {
    type: Boolean,
    default: false,
  }
});
const listOpt = ref([]);
const getList = async (params) => {
  try {
    listOpt.value = []
    const { data } = await loadList(params);
    listOpt.value = Array.isArray(data) ? data : [];
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
);

watch(
  () => props.linkage,
  (nV) => {
    if (nV.factoryCode && nV.warehouseCode) {
      getList(nV);
    } else {
      listOpt.value = []
    }
    
  },
);

const emit = defineEmits();

function change(value) {
  const label = mapValueToLabel(value, listOpt.value, 'locationCode', 'locationName');
  emit('update:modelValue', value);
  emit('change', value, { label, value });
}
</script>
