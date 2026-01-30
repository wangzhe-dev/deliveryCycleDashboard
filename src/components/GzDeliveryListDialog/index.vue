<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-15 11:40:15
 * @Description: 固资收货单弹窗
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
        rowKey="purchaseReceiptNumber"
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

<script setup lang="jsx" name="GzDeliveryListDialog">
import { watch } from 'vue';
import { loadList, refLoadList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择固资收货单',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'radio',
  },
  cbClose: {
    type: Boolean,
    default: false,
  },
  isRef: {
    type: Boolean,
    default: false,
  },
  checkRepeat: {
    type: Boolean,
    default: true,
  },
});
const initParam = ref({});
const { cbClose } = props;

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: props.checkType, fixed: 'left', width: 40 },
  {
    label: '单据编号',
    width: 150,
    prop: 'purchaseReceiptNumber',
    search: { el: 'input' },
  },
  {
    label: '单据类型',
    width: 150,
    prop: 'purchaseReceiptType',
    enum: () => proxy.useColumnsDict('purchase_receipt_type'),
  },
  {
    label: '单据状态',
    width: 120,
    prop: 'postingFlag',
    enum: [
      { label: '未过账', value: '0' },
      { label: '已过账', value: '1' },
    ],
  },
  {
    label: '供应商',
    width: 150,
    prop: 'supplierName',
  },
  {
    label: '项目编号',
    width: 150,
    prop: 'projectName',
  },
  {
    label: '采购订单行号',
    width: 150,
    prop: 'purchaseOrderLineNumber',
  },
  {
    label: '采购订单号',
    width: 204,
    prop: 'purchaseOrderNumber',
  },
  {
    label: '资产描述',
    width: 130,
    prop: 'assetsDesc',
  },
  {
    label: '规格型号',
    width: 130,
    prop: 'specifications',
  },
  {
    label: '材质',
    width: 130,
    prop: 'textureOfMaterial',
  },
  {
    label: '交货数量',
    width: 130,
    prop: 'deliveryQuantity',
  },
  {
    label: '单位',
    width: 130,
    prop: 'unitOfMeasurementCode',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    label: '到货日期',
    width: 130,
    prop: 'expectedArrivalDate',
  },
  {
    label: '工厂',
    width: 130,
    prop: 'factoryName',
  },
  {
    label: '仓库',
    width: 130,
    prop: 'stockLocationName',
  },
  {
    label: '库位',
    width: 130,
    prop: 'locationCode',
  },
  {
    label: '备注',
    width: 130,
    prop: 'remarks',
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
  emit('submit', row, () => close());
  !cbClose && close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;

  if (list.length) {
    if (!props.checkRepeat) {
      emit('submit', list, () => close());
      !cbClose && close();
      return;
    }
    const purchaseReceiptNumber = list[0].purchaseReceiptNumber;
    const isSame = list.every((item) => item.purchaseReceiptNumber == purchaseReceiptNumber);
    if (isSame) {
      emit('submit', list, () => close());
      !cbClose && close();
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
  return props.isRef ? refLoadList(params) : loadList(params);
}
</script>
