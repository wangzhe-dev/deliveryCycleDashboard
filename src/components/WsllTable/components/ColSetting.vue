<!--
 * @Author: zhaijinsong
 * @Date: 2023-10-24 16:52:44
 * @LastEditors: liangjia
 * @LastEditTime: 2025-07-12 10:40:57
 * @Description: 
-->
<template>
  <!-- 列设置 -->
  <el-drawer v-model="drawerVisible" title="列设置" size="450px">
    <div class="table-main">
      <el-table
        :data="cloneColSetting"
        :border="true"
        row-key="prop"
        default-expand-all
        :tree-props="{ children: '_children' }"
      >
        <el-table-column prop="label" align="center" label="列名" />
        <el-table-column v-slot="scope" prop="isShow" align="center" label="显示">
          <el-switch
            @change="(value) => handleSwitchChange(scope.row, value)"
            v-model="scope.row.isShow"
          ></el-switch>
        </el-table-column>
        <!-- TODO: 暂不支持 -->
        <!-- <el-table-column v-slot="scope" prop="sortable" align="center" label="排序">
          <el-switch v-model="scope.row.sortable"></el-switch>
        </el-table-column> -->
        <template #empty>
          <div class="table-empty">
            <!-- <img src="@/assets/images/notData.png" alt="notData" />
            <div>暂无可配置列</div> -->
            <el-empty description="暂无可配置列" />
          </div>
        </template>
      </el-table>
    </div>
  </el-drawer>
</template>

<script setup name="ColSetting">
import { ref, watch } from 'vue';
let cloneColSetting = [];
const props = defineProps({
  colSetting: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['switchChange']);
watch(
  () => props.colSetting,
  (newVal) => {
    cloneColSetting = JSON.parse(JSON.stringify(newVal));
  },
  { immediate: true },
);
const drawerVisible = ref(false);
function handleSwitchChange(row, value) {
  emit('switchChange', row);
}
const openColSetting = () => {
  drawerVisible.value = true;
};

defineExpose({
  openColSetting,
});
</script>

<style scoped lang="scss">
.cursor-move {
  cursor: move;
}
</style>
