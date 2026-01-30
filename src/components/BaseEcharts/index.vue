<!--
 * @Author: zhaijinsong
 * @Date: 2023-10-10 16:22:11
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-05-24 09:23:45
 * @Description: echarts组件
-->
<template>
  <div class="base-echarts">
    <div :id="chartsId" :style="{ width: width, height: height }"></div>
  </div>
</template>

<script setup>
import useEcharts from '@/hooks/useEcharts';
const emit = defineEmits(['chartClick']);
// 定义props
const props = defineProps({
  options: {
    type: Object,
    default: () => ({}),
  },
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '100%',
  },
  chartsId: {
    type: String,
    default: 'echartsDivRef',
  },
});
const handleUpdateSize = ref(null);
onMounted(() => {
  const { setOptions, echartsInstance, updateSize } = useEcharts(
    document.getElementById(props.chartsId),
  );
  handleUpdateSize.value = updateSize;
  // option的data数据设为响应式，当data改变这里会重新设置option，即重新渲染
  echartsInstance &&
    echartsInstance.on('click', (params) => {
      emit('chartClick', params);
    });
  watch(
    () => props.options,
    (opt) => {
      if (!echartsInstance) return;
      echartsInstance.clear();
      setOptions(opt);
    },
    { deep: true, immediate: true },
  );
});
onActivated(() => {
  handleUpdateSize.value && handleUpdateSize.value();
});
</script>

<style scoped>
.base-echarts {
  width: 100%;
  height: 100%;
}
</style>
