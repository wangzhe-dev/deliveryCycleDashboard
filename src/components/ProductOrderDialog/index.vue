<template>
  <el-dialog append-to-body title="选择计划订单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="80px"
        :toolButton="false"
        rowKey="id"
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

<script setup lang="jsx" name="ProductOrderDialog">
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
    label: '订单号',
    width: 150,
    prop: 'documentNumber',
    search: {
      el: 'input',
    },
  },
  {
    label: '单据类型',
    width: 150,
    prop: 'documentType',
    enum: () => proxy.useColumnsDict('production_order_type'),
    search: {
      el: 'select',
    },
  },
  {
    label: '单据日期',
    width: 180,
    prop: 'businessTime',
    render: ({ row }) =>
      row.businessTime ? moment(row.businessTime).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  // {
  //   label: '下推标识',
  //   width: 120,
  //   prop: 'pushDownState',
  // },
  {
    label: '单据状态',
    width: 150,
    prop: 'documentState',
    enum: () => proxy.useColumnsDict('produce_order_status'),
  },
  // {
  //   label: '单据来源',
  //   width: 150,
  //   prop: 'createdType',
  //   enum: () => proxy.useColumnsDict('production_order_create_type'),
  // },
  {
    label: '产品编号',
    width: 150,
    prop: 'materialsCode',
    search: {
      el: 'input',
    },
  },
  {
    label: '物料名称',
    width: 150,
    prop: 'materialsName',
    search: {
      el: 'input',
    },
  },
  {
    label: '规格型号',
    width: 150,
    prop: 'specifications',
  },
  {
    label: '材质',
    width: 150,
    prop: 'textureOfMaterial',
  },
  {
    label: '图号',
    width: 150,
    prop: 'drawingNo',
  },
  // {
  //   label: '销售订单明细行号',
  //   width: 170,
  //   prop: 'salesLineNumber',
  // },
  {
    label: '工厂',
    width: 150,
    prop: 'factoryName',
  },
  {
    label: '生产车间',
    width: 150,
    prop: 'productionWorkshop',
    // enum: () => proxy.useColumnsDict('test_workshop'),
  },
  // {
  //   label: '生产订单行号',
  //   width: 150,
  //   prop: 'lineNumber',
  // },
  {
    label: '加工单号',
    width: 150,
    prop: 'processingOrderNumber',
  },
  {
    label: '数量',
    width: 150,
    prop: 'pnumber',
  },
  {
    label: '已入库数量',
    width: 150,
    prop: 'warehousingQty',
  },
  {
    label: '未入库数量',
    width: 150,
    prop: 'allNotWarehousingQty',
  },
  {
    label: '库存单位',
    width: 150,
    prop: 'stockUnit',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    label: '领料状态',
    width: 150,
    prop: 'pickingState',
    enum: () => proxy.useColumnsDict('production_picking_status'),
  },
  {
    label: '业务状态',
    width: 150,
    prop: 'businessState',
    enum: () => proxy.useColumnsDict('produce_order_business_status'),
  },
  {
    label: '销售订单号',
    width: 150,
    prop: 'salesOrder',
  },
  {
    label: '强制关闭原因',
    width: 150,
    prop: 'mandatoryCloseReason',
  },

  {
    label: '创建人',
    width: 100,
    prop: 'createdNameBy',
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
    proxy.showWarning('请选择物料');
  }
  console.log(list, 'list');
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
