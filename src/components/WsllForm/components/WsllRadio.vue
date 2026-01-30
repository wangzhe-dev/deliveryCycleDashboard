<!--
 * @Author: zhaijs
 * @Date: 2022-06-14 16:56:11
 * @LastEditTime: 2023-11-30 13:11:33
 * @Description: 请填写简介
-->
<template>
  <el-radio-group
    v-model="Val"
    v-bind="$attrs"
    @change="props.change ? props.change($event) : false"
  >
    <template v-if="props.type === 'button'">
      <el-radio-button v-for="item in options" :key="item[valueFiled]" :label="item[valueFiled]">
        {{ item[labelText] || item[labelFiled] }}
      </el-radio-button>
    </template>
    <template v-else>
      <el-radio
        v-for="item in options"
        :key="item[valueFiled]"
        :label="item[valueFiled]"
        :border="props.type === 'border'"
        :class="props.type === 'border' ? 'mb10' : ''"
      >
        {{ item[labelText] || item[labelFiled] }}
      </el-radio>
    </template>
  </el-radio-group>
</template>
<script name="WsllRadio" setup>
import { ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [Number, String, Boolean],
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
  labelText: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: '',
  },
  change: {
    type: Function,
    default: () => () => {},
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
