<!--
 * @Author: zhaijinsong
 * @Date: 2023-11-10 09:51:56
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-06-17 13:36:11
 * @Description: 
-->
<template>
  <div class="gantt-leftbar">
    <div
      class="gantt-leftbar-item gantt-block-top-space"
      :style="{ height: topSpace + 'px' }"
    ></div>
    <div class="gantt-leftbar-item" v-if="isChecked">
      <el-checkbox-group v-model="checkList">
        <el-checkbox
          v-for="(data, index) in showDatas"
          :key="dataKey ? data[dataKey] : index"
          :style="isCellHeightStyle"
          :label="data.planUnid"
        >
          <slot :data="data">
            <div class="gantt-leftbar-defalutItem">need slot</div>
          </slot>
        </el-checkbox>
      </el-checkbox-group>
    </div>
    <div v-if="!isChecked" class="gantt-leftbar-item">
      <div
        class="gantt-leftbar-item"
        :style="cellHeightStyle"
        v-for="(data, index) in showDatas"
        :key="dataKey ? data[dataKey] : index"
      >
        <slot :data="data">
          <div class="gantt-leftbar-defalutItem">need slot</div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import dr from '../dynamic-render.js';
export default {
  name: 'LeftBar',
  mixins: [dr],
  data: {
    checkList: [],
  },
  props: {
    dataKey: String,
    datas: {
      type: Array,
      required: true,
    },
    isChecked: Boolean,
  },
  watch: {
    checkList(val) {
      this.$emit('getCheckedList', val);
    },
  },
  computed: {
    cellHeightStyle() {
      return {
        height: `${this.cellHeight}px`,
        marginLeft: 20 + 'px',
      };
    },
    isCellHeightStyle() {
      return {
        height: `${this.cellHeight}px`,
        marginLeft: 20 + 'px',
      };
    },
  },
};
</script>
<style scoped>
:deep(.el-checkbox) {
  width: 100%;
  border-bottom: 1px solid #e6e6e6;
}
</style>
