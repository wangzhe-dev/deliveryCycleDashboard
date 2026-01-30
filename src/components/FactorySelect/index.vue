<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-05 13:57:46
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-08-28 14:19:08
 * @Description: 工厂主数据-列表
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
        v-for="dict in factoryList"
        :key="dict.factoryCode"
        :label="dict.factoryName"
        :value="dict.factoryCode"
      />
    </el-select>
  </div>
</template>

<script setup lang="jsx" name="FactorySelect">
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
const factoryList = ref([]);
const getList = async () => {
  try {
    const { data } = await loadList();
    factoryList.value = Array.isArray(data) ? data : [];

    if (factoryList.value.length === 1 && !props.modelValue) {
      change(factoryList.value[0].factoryCode)
    }
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

const emit = defineEmits();

function change(value) {
  const label = mapValueToLabel(value, factoryList.value, 'factoryCode', 'factoryName');
  emit('update:modelValue', value);
  emit('change', value, { label, value });
}
</script>
