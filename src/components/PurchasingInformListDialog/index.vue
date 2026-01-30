<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-09-10 16:05:43
 * @Description: 采购通知单弹窗
-->
<template>
  <el-dialog append-to-body :title="props.title" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
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
import { watch } from 'vue';
import { loadList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择收货通知单',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'radio',
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
    label: '单据编号',
    width: 200,
    prop: 'purchaseReceiveNotifyNumber',
    fixed: 'left',
    search: { el: 'input' },
  },
  {
    label: '单据类型',
    width: 150,
    prop: 'purchaseReceiveNotifyType',
    enum: () => proxy.useColumnsDict('purchase_receive_notify_type'),
  },
  {
    label: '行号',
    width: 101,
    prop: 'lineNumber',
  },
  {
    label: '采购订单号',
    width: 150,
    prop: 'purchaseOrderNumber',
  },
  {
    label: '物料编号',
    width: 150,
    prop: 'materialsCode',
    search: { el: 'input' },
  },
  {
    label: '物料名称',
    width: 150,
    prop: 'materialsName',
    search: { el: 'input' },
  },
  {
    label: '资产描述',
    width: 150,
    prop: 'assetsDesc',
  },
  {
    label: '服务描述',
    width: 150,
    prop: 'serviceDesc',
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
  {
    label: '物料分类',
    width: 150,
    prop: 'materialsGroupName',
  },
  {
    label: '交货数量',
    width: 150,
    prop: 'deliveryQuantity',
  },
  {
    label: '单位',
    width: 150,
    prop: 'unitOfMeasurementCode',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    label: '部门',
    width: 150,
    prop: 'needDepartmentName',
  },
  {
    label: '预计到货日期',
    width: 150,
    prop: 'expectedArrivalDate',
  },
  {
    label: '创建日期',
    width: 150,
    prop: 'createdTime',
  },
  {
    label: '工厂',
    width: 193,
    prop: 'factoryName',
  },
  {
    label: '仓库',
    width: 129,
    prop: 'stockLocationName',
  },
  {
    label: '库位',
    width: 150,
    prop: 'locationCode',
  },
  {
    label: '备注',
    width: 142,
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
  emit('submit', row);
  close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;

  if (list.length) {
    const purchaseReceiveNotifyNumber = list[0].purchaseReceiveNotifyNumber;
    const isSame = list.every(
      (item) => item.purchaseReceiveNotifyNumber == purchaseReceiveNotifyNumber,
    );
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
</script>
