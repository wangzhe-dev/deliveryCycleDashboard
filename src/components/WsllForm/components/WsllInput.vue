<!--
 * @Author: zhaijs
 * @Date: 2023-08-10 16:05:50
 * @LastEditTime: 2023-08-11 12:01:12
 * @Description: 请填写简介
-->
<template>
  <el-input
    v-bind="$attrs"
    v-model="Val"
    :placeholder="props.placeholder"
    :clearable="props.clearable"
    style="width: 100%"
    @blur="props.blur ? props.blur($event) : false"
    @focus="props.focus ? props.focus($event) : false"
    @change="props.change ? props.change($event) : false"
    @input="props.input ? props.input($event) : false"
    @clear="props.clear ? props.clear() : false" />
</template>
<script name="WsllInput" setup>
import { ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: () => ''
  },
  blur: {
    type: Function,
    default: () => () => {}
  },
  focus: {
    type: Function,
    default: () => () => {}
  },
  change: {
    type: Function,
    default: () => () => {}
  },
  input: {
    type: Function,
    default: () => () => {}
  },
  clear: {
    type: Function,
    default: () => () => {}
  },
  clearable: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '请输入'
  }
});
const Val = ref(props.modelValue);
//监听父组件的值
watch(
  () => props.modelValue,
  () => {
    Val.value = props.modelValue;
  }
);

// 通过emit将值传递给父组件
emit('update:modelValue', Val);
</script>
