<!--
 * @Author: zhaijs
 * @Date: 2022-06-14 16:56:11
 * @LastEditTime: 2024-09-05 13:36:44
 * @Description: 请填写简介
-->
<template>
  <el-select
    v-model="Val"
    v-bind="$attrs"
    style="width: 100%"
    :filterable="props.filterable"
    :clearable="props.clearable"
    @change="props.change ? props.change($event, wOptions) : false"
    @visible-change="props.visibleChange ? props.visibleChange($event) : false"
    @remove-tag="props.removeTag ? props.removeTag($event) : false"
    @clear="props.clear ? props.clear() : false"
    @blur="props.blur ? props.blur($event) : false"
    @focus="props.focus ? props.focus($event) : false"
  >
    <el-option
      v-for="item in wOptions"
      :key="item[valueFiled]"
      :label="item[labelFiled]"
      :value="item[valueFiled]"
    ></el-option>
  </el-select>
</template>

<script name="WsllSelect" setup>
import { ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [String, Array, Number],
    default: () => '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  valueFiled: {
    type: String,
    default: 'value',
  },
  labelFiled: {
    type: String,
    default: 'label',
  },
  change: {
    type: Function,
    default: () => () => {},
  },
  visibleChange: {
    type: Function,
    default: () => () => {},
  },
  removeTag: {
    type: Function,
    default: () => () => {},
  },
  clear: {
    type: Function,
    default: () => () => {},
  },
  blur: {
    type: Function,
    default: () => () => {},
  },
  focus: {
    type: Function,
    default: () => () => {},
  },
  filterable: {
    type: Boolean,
    default: true,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
});
const wOptions = computed(() => {
  return Array.isArray(props.options) ? props.options : [];
});
const Val = ref(props.modelValue);
//监听父组件的值
watch(
  () => props.modelValue,
  () => {
    Val.value = props.modelValue;
    emit('update:modelValue', Val);
  },
  { deep: true, immediate: true },
);

// 通过emit将值传递给父组件
emit('update:modelValue', Val);
</script>
