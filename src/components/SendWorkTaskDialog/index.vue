<!--
 * @Author: zhaijinsong
 * @Date: 2023-10-16 09:47:31
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-10-16 10:38:58
 * @Description: 派工任务列表弹窗
-->
<template>
  <el-dialog append-to-body title="选择派工任务" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="120px"
        :toolButton="false"
        rowKey="planCode"
        max-height="40vh"
        :initParam="initParam"
        @radioChange="tableRadioChange"
      />
    </div>
    <template #footer>
      <el-button @click="close" v-if="props.checkType === 'selection'">取消</el-button>
      <el-button type="primary" @click="confirm" v-if="props.checkType === 'selection'">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="SendWorkTaskDialog">
import { loadList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'selection',
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const initParam = ref({});
const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    label: '设备编码',
    prop: 'planEquipmentCode',
    width: 150,
    search: { el: 'input', props: { filterable: true } },
  },
  {
    label: '生产订单号',
    prop: 'productionOrderNo',
    width: 150,
    search: { el: 'input', props: { filterable: true } },
  },
  {
    label: '加工单号',
    prop: 'workOrder',
    width: 150,
    search: { el: 'input', props: { filterable: true } },
  },
  {
    label: '计划数量',
    prop: 'planQty',
    width: 120,
  },
  {
    label: '执行人',
    width: 150,
    prop: 'planUserName',
  },
  {
    label: '创建日期',
    prop: 'createdTime',
    width: 160,
    render: ({ row: r }) =>
      r.createdTime ? moment(r.createdTime).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    label: '工序编码',
    prop: 'processNumber',
    width: 160,
  },
  {
    label: '工序名称',
    prop: 'processName',
    width: 160,
  },
  {
    label: '物料名称',
    prop: 'mesMainMaterialName',
    width: 160,
  },
  {
    label: '物料编码',
    prop: 'mesMainMaterialCode',
    width: 160,
  },
  {
    label: '项目编号',
    prop: 'projectCode',
    width: 160,
  },
  {
    label: '销售订单号',
    prop: 'salesOrder',
    width: 160,
  },
  {
    label: '完工数量',
    prop: 'finishedQty',
    width: 160,
  },
  {
    label: '图号',
    prop: 'drawingNo',
    width: 160,
  },
  {
    label: '规格型号',
    prop: 'specificationAndModel',
    width: 160,
  },
  {
    label: '材质',
    prop: 'textureOfMaterial',
    width: 160,
  },
  {
    label: '状态',
    prop: 'state',
    width: '160px',
    enum: [
      {
        value: '0',
        label: '未开始',
      },
      {
        value: '1',
        label: '暂停生产',
      },
      {
        value: '2',
        label: '生产中',
      },
      {
        value: '3',
        label: '待完成',
      },
      {
        value: '4',
        label: '完成',
      },
    ],
  },
  {
    label: '类型',
    prop: 'type',
    width: 120,
    enum: [
      {
        value: '1',
        label: '正常',
      },
      {
        value: '2',
        label: '返修单',
      },
      {
        value: '3',
        label: '报废单',
      },
    ],
  },
  {
    prop: 'type',
    label: '工序类型',
    width: 120,
    enum: () => proxy.useColumnsDict('step_type'),
    // search: { el: 'select', props: { filterable: true } },
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParam.value = props.params;
      // wsllTable.value?.refresh();
      wsllTable.value?.clearSelection();
    }
  },
  { deep: true, immediate: true },
);

const tableRadioChange = (v, row) => {
  emit('submit', row);
  close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;
  if (list.length) {
    emit('submit', list);
    close();
  } else {
    proxy.showWarning('请选择数据');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
