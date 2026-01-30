<!--
 * @Author: zhaijs
 * @Date: 2023-08-10 16:05:50
 * @LastEditTime: 2025-03-26 13:46:14
 * @Description: el-image组件
-->
<template>
  <el-image
    :class="props.class"
    :src="props.src"
    :preview-src-list="props.previewSrcList"
    show-progress
    :initial-index="props.initialIndex"
    fit="cover"
    :preview-teleported="props.previewTeleported"
  >
    <template #toolbar="{ actions, reset, activeIndex, setActiveItem }">
      <el-icon @click="actions('zoomOut')"><ZoomOut /></el-icon>
      <el-icon @click="actions('zoomIn', { enableTransition: false, zoomRate: 2 })">
        <ZoomIn />
      </el-icon>
      <el-icon @click="actions('clockwise', { rotateDeg: 180, enableTransition: false })">
        <RefreshRight />
      </el-icon>
      <el-icon @click="actions('anticlockwise')"><RefreshLeft /></el-icon>
      <el-icon @click="reset"><Refresh /></el-icon>
      <el-icon @click="download(activeIndex)"><Download /></el-icon>
    </template>
  </el-image>
</template>
<script name="WsllInput" setup>
import { ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  class: {
    type: String,
    default: () => 'w-full cursor-pointer',
  },
  previewSrcList: {
    type: Array,
    default: () => [],
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
  previewTeleported: {
    type: Boolean,
    default: false,
  },
});

const download = (index) => {
  const url = props.previewSrcList[index]
  const suffix = url.slice(url.lastIndexOf('.'))
  const filename = Date.now() + suffix

  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(blobUrl)
      link.remove()
    })
}
</script>
