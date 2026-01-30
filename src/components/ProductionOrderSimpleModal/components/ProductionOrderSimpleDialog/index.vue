<template>
  <el-dialog append-to-body title="选择加工单" v-model="visible" width="60vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="120px"
        :toolButton="false"
        rowKey="productWorkOrderCode"
        height="40vh"
        :initParam="initParams"
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

<script setup lang="jsx" name="ProductionOrderSimpleDialog">
import { loadList } from './services';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  checkType: {
    type: String,
    default: 'selection',
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
const initParams = ref({});
const statusOptions = [
  { label: '待开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已取消', value: 3 },
  { label: '待下发', value: 4 },
];
const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    label: '产线总工单编号',
    width: 180,
    prop: 'masterWorkOrder',
    search: { el: 'input' },
  },
  {
    label: '工单编号',
    width: 180,
    prop: 'productWorkOrderCode',
    search: { el: 'input' },
  },
  {
    label: '产线编号',
    width: 160,
    prop: 'productionLineCode',
    search: { el: 'input' },
  },
  {
    label: '产品编码',
    width: 160,
    prop: 'productCode',
    search: { el: 'input' },
  },
  {
    label: '产品名称',
    width: 160,
    prop: 'productName',
    search: { el: 'input' },
  },
  {
    label: '计划数量',
    width: 120,
    prop: 'planQuantity',
  },
  {
    label: '船号',
    width: 120,
    prop: 'shipCode',
    search: { el: 'input' },
  },
  {
    label: '状态',
    width: 120,
    prop: 'isCollect',
    enum: statusOptions,
    search: { el: 'select' },
  },
  {
    label: '计划开始时间',
    width: 160,
    prop: 'planStartTime',
  },
  {
    label: '计划结束时间',
    width: 160,
    prop: 'planEndTime',
  },
  // {
  //   label: '站点编号',
  //   width: 120,
  //   prop: 'siteNum',
  // },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParams.value = props.params;
      wsllTable.value?.refresh();
      wsllTable.value?.clearSelection();
    }
  },
  { deep: true, immediate: true },
);

const tableRadioChange = (value, row) => {
  emit('submit', row);
  close();
};

const confirm = () => {
  const list = wsllTable.value?.selectedList || [];
  if (list.length) {
    emit('submit', list);
    close();
  } else {
    proxy.showWarning('请选择工单');
  }
};

const close = () => {
  wsllTable.value?.clearRadio?.();
  wsllTable.value?.clearSelection?.();
  emit('update:modelValue', false);
};
</script>
