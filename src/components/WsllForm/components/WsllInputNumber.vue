<!--
 * @Author: zhaijs
 * @Date: 2023-08-09 09:40:19
 * @LastEditTime: 2024-05-14 11:42:30
 * @Description: 请填写简介
-->
<template>
  <el-input-number
    v-bind="$attrs"
    v-model="Val"
    :placeholder="props.placeholder"
    style="width: 100%"
    @blur="props.blur ? props.blur($event) : false"
    @focus="props.focus ? props.focus($event) : false"
    @change="(a, b) => (props.change ? props.change(a, b) : false)"
  />
</template>
<script name="WsllInputNumber" setup>
import { ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Number,
    default: undefined,
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
});
const Val = ref(props.modelValue);
//监听父组件的值
watch(
  () => props.modelValue,
  () => {
    Val.value = props.modelValue;
  },
);

// 通过emit将值传递给父组件
emit('update:modelValue', Val);
</script>
