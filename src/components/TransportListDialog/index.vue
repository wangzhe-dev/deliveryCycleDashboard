<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-02-27 15:34:34
 * @Description: 采购运单弹窗
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
        rowKey="transportOrderNumber"
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

<script setup lang="jsx" name="TransportListDialog">
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
    default: '选择采购运单',
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
    label: '运单号',
    prop: 'transportOrderNumber',
    search: { el: 'input' },
    fixed: 'left',
    minWidth: 150,
  },
  {
    label: '采购订单号',
    prop: 'purchaseOrderNumber',
    minWidth: 150,
  },
  {
    label: '供应商名称',
    prop: 'supplierName',
    minWidth: 120,
  },
  {
    label: '项目名称',
    prop: 'projectName',
    minWidth: 120,
  },
  {
    label: '状态',
    prop: 'status',
    enum: () => proxy.useColumnsDict('purchase_transport_status'),
    search: { el: 'select', props: { filterable: true } },
    width: 100,
  },
  {
    label: '托盘号',
    prop: 'palletCode',
    minWidth: 120,
  },
  {
    label: '托盘名称',
    prop: 'palletName',
    minWidth: 120,
  },
  {
    label: '物料编号',
    prop: 'materialsCode',
    minWidth: 120,
  },
  {
    label: '物料名称',
    prop: 'materialsName',
    minWidth: 120,
  },
  {
    label: '交货数量',
    prop: 'canRefQuantity',
    minWidth: 120,
  },
  {
    label: '单位',
    prop: 'valuationUnitNumber',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
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
  emit('submit', row, () => close());
  !cbClose && close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;

  if (list.length) {
    const transportOrderNumber = list[0].transportOrderNumber;
    const isSame = list.every((item) => item.transportOrderNumber == transportOrderNumber);
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
</script>
