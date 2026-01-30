<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-09 10:48:45
 * @Description: 采购订单弹窗
-->
<template>
  <el-dialog append-to-body :title="props.title" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="apiFn"
        label-width="80px"
        rowKey="lineId"
        :toolButton="false"
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

<script setup lang="jsx" name="PurchaseOrderListDialog">
import { loadList, loadExchangeList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择采购订单',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'radio',
  },
  isRef: {
    type: Boolean,
    default: false,
  },
});
const initParam = ref({});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: props.checkType, fixed: 'left', width: 40 },
  {
    label: '采购编号',
    prop: 'purchaseOrderNumber',
    width: 120,
    search: {
      el: 'input',
    },
  },
  {
    label: '单据类型',
    prop: 'purchaseOrderType',
    enum: () => proxy.useColumnsDict('purchase_order_type'),
    width: 120,
  },
  {
    label: '采购类别',
    prop: 'purchaseCategoryNumber',
    enum: () => proxy.useColumnsDict('purchase_order_type'),
    width: 120,
  },
  {
    label: '单据状态',
    width: 100,
    prop: 'status',
    enum: () => proxy.useColumnsDict('purchase_demand_status'),
    // search: {
    //   el: 'select',
    // },
  },

  {
    label: '物料编号',
    prop: 'materialsCode',
    width: 150,
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '物料名称',
    prop: 'materialsName',
    width: 120,
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '资产描述',
    width: 140,
    prop: 'assetsDesc',
  },
  {
    label: '服务类型',
    width: 140,
    prop: 'serviceType',
    render: ({ row }) => row.serviceType || row.serviceTypeCode || '-',
  },
  {
    label: '服务描述',
    width: 140,
    prop: 'serviceDesc',
  },
  {
    label: '规格型号',
    prop: 'specifications',
    width: 120,
  },
  {
    label: '材质',
    prop: 'textureOfMaterial',
    width: 120,
  },
  {
    label: '图号',
    prop: 'drawingNo',
    width: 120,
  },

  {
    label: '采购数量',
    prop: 'purchaseQuantity',
    width: 120,
  },
  {
    label: '采购单位',
    prop: 'purchaseUnitNumber',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
    width: 120,
  },
  {
    label: '数量',
    prop: 'valuationQuantity',
    width: 120,
  },
  {
    label: '单位',
    prop: 'valuationUnitNumber',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
    width: 120,
  },

  {
    label: '含税单价',
    prop: 'includingTaxPrice',
    width: 120,
  },
  {
    label: '不含税单价',
    prop: 'netPriceOfUnit',
    width: 120,
  },
  {
    label: '税额',
    prop: 'payAble',
    width: 120,
  },
  {
    label: '含税总价',
    prop: 'includingTaxTotalAmount',
    width: 120,
  },
  {
    label: '不含税总价',
    prop: 'lineTotalAmount',
    width: 120,
  },
  {
    label: '交货日期',
    prop: 'deliveryDate',
    width: 180,
    render: ({ row }) =>
      row.deliveryDate ? moment(row.deliveryDate).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    label: '供应商',
    width: 200,
    prop: 'supplierName',
  },

  {
    label: '部门',
    width: 120,
    prop: 'fullNameCostCenter',
  },
  {
    label: '工厂',
    prop: 'factoryName', // factoryCode
    width: 120,
  },
  {
    label: '库存地',
    prop: 'stockLocationName',
    width: 120,
    enum: () => proxy.useColumnsDict('stock_location'),
  },
  {
    label: '库位',
    prop: 'locationCode',
    width: 120,
  },
  {
    label: '备注',
    prop: 'remarks',
    width: 120,
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParam.value = props.params;
      wsllTable.value?.refresh();
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
    const purchaseOrderNumber = list[0].purchaseOrderNumber;
    const isSame = list.every((item) => item.purchaseOrderNumber == purchaseOrderNumber);
    if (isSame) {
      emit('submit', list);
      close();
    } else {
      proxy.showWarning('请选相同的单号');
    }
  } else {
    proxy.showWarning('请选择订单');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();

  emit('update:modelValue', false);
};

function apiFn(params) {
  return props.isRef ? loadExchangeList(params) : loadList(params);
}
</script>
