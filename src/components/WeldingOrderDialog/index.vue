<template>
  <el-dialog append-to-body title="选择加工单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        :initParam="initParam"
        ref="wsllTable"
        rowKey="taskNumber"
        @radioChange="tableRadioChange"
      ></WsllTable>
    </div>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="WeldingOrderDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const initParam = ref({});
const columns = reactive([
  {
    type: 'radio',
    fixed: 'left',
    width: 40,
  },
  {
    type: 'index',
    label: '序号',
    width: 70,
  },
  {
    label: '任务号',
    width: 200,
    prop: 'taskNumber',
  },
  {
    label: '项目号',
    width: 140,
    prop: 'shipNumber',
    search: {
      el: 'input',
    },
  },
  {
    label: '批次号',
    width: 140,
    prop: 'productBatch',
    search: {
      el: 'input',
    },
  },
  {
    label: '分段号',
    width: 140,
    prop: 'block',
    search: {
      el: 'input',
    },
  },
  {
    label: '状态',
    width: 100,
    prop: 'status',
    enum: () => proxy.useColumnsDict('process_order_state_ode'),
    search: { el: 'select', props: { filterable: true, multiple: true } },
    tag: true,
  },
  {
    label: '流向车间',
    width: 100,
    prop: 'blockArea',
    enum: () => proxy.useColumnsDict('block_area'),
    search: { el: 'select', props: { filterable: true } },
    // render: ({ row }) => (row.blockArea ? row.blockArea : '-'),
  },
  {
    label: '批次内执行顺序',
    width: 140,
    prop: 'serialNumber',
  },
  {
    label: '计划开始',
    minWidth: 160,
    prop: 'preStartTime',
  },
  {
    label: '计划结束',
    minWidth: 160,
    prop: 'preEndTime',
  },
  {
    label: '实际开始',
    minWidth: 160,
    prop: 'preActualStartTime',
  },
  {
    label: '实际结束',
    minWidth: 160,
    prop: 'preActualEndTime',
  },
  {
    label: '下发时间',
    minWidth: 160,
    prop: 'pushTime',
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
let current = ref({});
const tableRadioChange = (v, row) => {
  current.value = row;
  console.log(current.value);
};

const confirm = () => {
  if (current.value.taskNumber) {
    emit('submit', current.value);
    close();
  } else {
    proxy.showWarning('请选择单据!');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
