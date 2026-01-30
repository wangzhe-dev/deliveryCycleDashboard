<!--
 * @Author: zhaijs
 * @Date: 2023-08-10 16:05:50
 * @LastEditTime: 2023-08-22 17:59:20
 * @Description: 请填写简介
-->
<template>
  <el-checkbox
    v-bind="$attrs"
    v-model="Val"
    :placeholder="props.placeholder"
    :clearable="props.clearable"
    class="w-full"
    @change="props.change ? props.change($event) : false">
    <span>{{ $attrs?.labelText || '' }}</span>
  </el-checkbox>
</template>
<script name="WsllCheckbox" setup>
import { ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: () => ''
  },
  change: {
    type: Function,
    default: () => () => {}
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
