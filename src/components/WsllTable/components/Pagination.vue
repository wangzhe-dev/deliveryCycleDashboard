<!--
 * @Author: zhaijs
 * @Date: 2023-07-19 09:48:59
 * @LastEditTime: 2025-12-28 16:24:19
 * @Description: 请填写简介
-->
<template>
  <div class="flex flex-items-center flex-justify-end">
    <!-- 分页组件 -->
    <el-pagination
      :background="true"
      :current-page="pageable.current"
      :page-size="pageable.size"
      :page-sizes="pageSizes"
      :total="pageable.total || 0"
      :default-page-size="20"
      :layout="paginationLayout"
      :size="size"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
    <!-- 如果页码很小就不要这个附加功能了 -->
    <div v-if="!['small'].includes(size)" class="flex flex-items-center mt-10 ml-12">
      <el-input-number
        :min="1"
        v-model="pageable.size"
        style="width: 90px"
        @change="handleSizeInput"
        controls-position="right"
      />
      <span style="font-size: 14px; color: #000; margin-left: 8px">条/页</span>
    </div>
  </div>
</template>

<script setup name="Pagination">
import { reactive } from 'vue';

const props = defineProps({
  paginationLayout: {
    type: String,
    default: 'total, jumper, prev, pager, next, sizes',
  },
  pageable: {
    type: Object,
    default: () => ({}),
  },
  handleSizeChange: {
    type: Function,
    default: (size) => {},
  },
  size: {
    type: String,
    default: 'default',
  },
  handleCurrentChange: {
    type: Function,
    default: (currentPage) => {},
  },
});

const pageSizes = reactive([5, 10, 20, 25, 50, 100, 200]);

function handleSizeInput(size) {
  let newSize = parseInt(size);
  if (isNaN(newSize)) {
    newSize = 20;
  }
  props.pageable.size = newSize;
  if (!pageSizes.includes(newSize)) {
    pageSizes.push(newSize);
    pageSizes.sort((a, b) => a - b);
  }
  props.handleSizeChange(newSize);
}
</script>
