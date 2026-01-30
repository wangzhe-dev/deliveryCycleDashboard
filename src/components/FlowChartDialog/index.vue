<!--
 * @Author: zhaijinsong
 * @Date: 2024-09-19 13:56:13
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-09-19 17:50:48
 * @Description: 审批详情
-->
<template>
  <el-dialog
    title="审批详情"
    v-model="open"
    width="1100px"
    append-to-body
    @close="cancel"
    :close-on-click-modal="false"
  >
    <div class="flow-chart-dialog">
      <div class="title-container">
        <span class="title">已审</span>
        <span class="title title2">当前环节</span>
        <span class="title title3">未审</span>
      </div>
      <div v-loading="loading" class="chart-wrapper">
        <img v-if="imgUrl" :src="imgUrl" width="1058" height="500" style="margin: 0 auto" />
        <el-empty v-else description="暂无流程信息" />
      </div>
    </div>
    <WsllTable
      :columns="hisTaskColumns"
      :data="hisTaskList"
      :requestAuto="false"
      :pagination="false"
      :toolButton="false"
      :isHideCard="true"
    >
      <template #flowStatus="scope">
        <dict-tag :options="flow_status" :value="scope.row.flowStatus" />
      </template>
    </WsllTable>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">返 回</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup name="FlowChartDialog">
import { flowRecordList } from './services';
const { proxy } = getCurrentInstance();
const { flow_status } = proxy.useDictList(['flow_status']);

const open = ref(false);
const imgUrl = ref('');
const loading = ref(false);
const openDialog = (insId) => {
  open.value = true;
  getFlowRecordList(insId);
};

const hisTaskList = ref([]);
const hisTaskColumns = reactive([
  {
    type: 'index',
    label: '序号',
    width: 80,
    fixed: 'left',
  },
  {
    prop: 'nodeName',
    label: '环节',
    width: 140,
  },
  {
    prop: 'approver',
    label: '审批人',
    width: 120,
  },
  {
    prop: 'flowStatus',
    label: '流程状态',
    width: 160,
  },
  {
    prop: 'message',
    label: '审批意见',
    minWidth: 160,
  },
  {
    prop: 'createTime',
    label: '创建时间',
    width: 180,
  },
]);

/** 取消按钮 */
const cancel = () => {
  open.value = false;
  hisTaskList.value = [];
  imgUrl.value = '';
};

// 组织
const getFlowRecordList = async (insId) => {
  loading.value = true;
  try {
    const { data = {} } = await flowRecordList({ insId });
    hisTaskList.value = data?.hisTaskList || [];
    imgUrl.value = data?.flowChart ? 'data:image/gif;base64,' + data.flowChart : '';
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

defineExpose({
  openDialog,
});
</script>
<style lang="scss" scoped>
.title {
  margin: 0 10px;
  &::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    background: #87ca46;
    border-radius: 50%;
    margin-right: 5px;
  }
}
.title2 {
  &::before {
    background: #ec8994;
  }
}
.title3 {
  &::before {
    background: #d4d4d4;
  }
}
.flow-chart-dialog {
  border: 1px solid #dcdfe6;
  margin-bottom: 10px;
}
.chart-wrapper {
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title-container {
  border-bottom: 1px solid #dcdfe6;
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
