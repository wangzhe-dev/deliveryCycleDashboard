<!--
 * @Author: zhaijs
 * @Date: 2023-08-09 09:40:19
 * @LastEditTime: 2023-08-10 16:18:41
 * @Description: 请填写简介
-->
<template>
  <el-checkbox-group
    v-model="Val"
    v-bind="$attrs"
    @change="props.change ? props.change($event) : false">
    <template v-if="props.type === 'button'">
      <el-checkbox-button v-for="item in options" :key="item[valueFiled]" :label="item[valueFiled]">
        {{ item[labelFiled] }}
      </el-checkbox-button>
    </template>
    <template v-else>
      <el-checkbox
        v-for="item in options"
        :key="item[valueFiled]"
        :label="item[valueFiled]"
        :border="props.type === 'border'">
        {{ item[labelFiled] }}
      </el-checkbox>
    </template>
  </el-checkbox-group>
</template>
<script setup name="WsllCheckboxGroup">
import { ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [Array, String],
    default: () => []
  },
  options: {
    type: Array,
    default: () => []
  },
  valueFiled: {
    type: String,
    default: 'value'
  },
  labelFiled: {
    type: String,
    default: 'label'
  },
  type: {
    type: String,
    default: ''
  },
  change: {
    type: Function,
    default: () => () => {}
  }
});
const oVal = !Array.isArray(props.modelValue)
  ? props.modelValue?.split(',') || []
  : props.modelValue;
const Val = ref(oVal);
//监听父组件的值
watch(
  () => props.modelValue,
  () => {
    Val.value = !Array.isArray(props.modelValue)
      ? props.modelValue?.split(',') || []
      : props.modelValue;
  }
);

// 通过emit将值传递给父组件
emit('update:modelValue', Val);
</script>
