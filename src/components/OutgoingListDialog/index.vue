<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-04-28 11:08:13
 * @Description: 外向交货单弹窗
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
        rowKey="deliveryOrderCode"
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

<script setup lang="jsx" name="OutgoingListDialog">
import { watch } from 'vue';
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择外向交货单',
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
    label: '交货单号',
    width: 150,
    prop: 'deliveryOrderCode',
    search: { el: 'input' },
  },
  {
    label: '客户编号',
    width: 120,
    prop: 'soldToPartyCode',
  },
  {
    label: '客户名称',
    width: 120,
    prop: 'soldToPartyName',
  },
  {
    label: '销售订单号',
    width: 150,
    prop: 'referOrderCode',
  },
  {
    label: '计划交货日期',
    width: 120,
    prop: 'plannedDeliveryDate',
  },
  {
    label: '实际交货日期',
    width: 120,
    prop: 'actualDeliveryDate',
  },
  {
    label: '净价值',
    width: 120,
    prop: 'netAmount',
  },
  {
    label: '税额',
    width: 120,
    prop: 'payAble',
  },
  {
    label: '销售人员编码',
    width: 120,
    prop: 'marketPersonCode',
  },
  {
    label: '销售人员名称',
    width: 120,
    prop: 'marketPersonName',
  },
  {
    label: '销售订单状态',
    width: 120,
    prop: 'marketOrderStatus',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
  },
  {
    label: '交货单状态',
    width: 120,
    prop: 'deliveryOrderStatus',
    enum: () => proxy.useColumnsDict('market_delivery_order_status_of_delivery'),
  },
  {
    label: '作废',
    width: 120,
    prop: 'invalidStatus',
    enum: [
      { label: '未作废', value: '0' },
      { label: '已作废', value: '1' },
    ],
  },
  {
    label: '过账',
    width: 120,
    prop: 'postingFlag',
    enum: () => proxy.useColumnsDict('market_posting_flag'),
  },
  {
    label: '冲销',
    width: 120,
    prop: 'chargeAgainstFlag',
    enum: [
      { label: '未冲销', value: '0' },
      { label: '已冲销', value: '1' },
    ],
  },
  {
    label: '开票状态',
    width: 120,
    prop: 'invStatusCode',
    enum: () => proxy.useColumnsDict('market_inv_order_status'),
  },
  {
    label: '生产订单状态',
    width: 120,
    prop: 'produceStatusCode',
    enum: () => proxy.useColumnsDict('market_produce_order_status'),
  },
  {
    label: '创建日期',
    width: 180,
    prop: 'createdTime',
  },
  {
    label: '修改日期',
    width: 180,
    prop: 'updatedTime',
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
    const deliveryOrderCode = list[0].deliveryOrderCode;
    const isSame = list.every((item) => item.deliveryOrderCode == deliveryOrderCode);
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
