<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-18 11:31:17
 * @Description: 退换货订单
-->
<template>
  <el-dialog append-to-body title="选择退换货订单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="140px"
        :toolButton="false"
        rowKey="marketOrderCode"
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

<script setup lang="jsx" name="ReturnOrderDialog">
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
const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    label: '退换货订单编号',
    width: 160,
    prop: 'marketOrderCode',
    search: { el: 'input' },
    fixed: 'left',
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
    label: '销售订单类型',
    width: 120,
    prop: 'marketOrderType',
    enum: () => proxy.useColumnsDict('list_return_market_order_type'),
  },
  {
    label: '销售组织名称',
    width: 232,
    prop: 'marketOrgName',
  },
  {
    label: '销售部门编码',
    width: 183,
    prop: 'marketOfficeCode',
  },
  {
    label: '销售部门',
    width: 154,
    prop: 'marketOfficeName',
  },
  {
    label: '创建时间',
    width: 120,
    prop: 'createdTime',
  },
  {
    label: '修改时间',
    width: 120,
    prop: 'updatedTime',
  },
  {
    label: '定价日期',
    width: 120,
    prop: 'pricingDate',
  },
  {
    label: '拒绝原因',
    width: 120,
    prop: 'reasonForRejection',
    enum: () => proxy.useColumnsDict('denial_reason'),
  },
  {
    label: '含税价格',
    width: 120,
    prop: 'includingTaxAmount',
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
    width: 152,
    prop: 'marketPersonCode',
  },
  {
    label: '销售人员名称',
    width: 173,
    prop: 'marketPersonName',
  },
  {
    label: '计划交货日期',
    width: 180,
    prop: 'requestedDeliveryDate',
  },
  {
    label: '退换货订单状态',
    width: 196,
    prop: 'marketOrderStatus',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
  },
  {
    label: '交货状态',
    width: 120,
    prop: 'deliveryStatusCode',
    enum: () => proxy.useColumnsDict('market_delivery_order_status'),
  },
  {
    label: '开票状态',
    width: 131,
    prop: 'invStatusCode',
    enum: () => proxy.useColumnsDict('market_inv_order_status'),
  },
  {
    label: '生产订单状态',
    width: 207,
    prop: 'produceStatusCode',
    enum: () => proxy.useColumnsDict('market_produce_order_status'),
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      // wsllTable.value?.refresh();
      initParams.value = props.params;
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
    proxy.showWarning('请选择销售订单');
  }
  console.log(list, 'list');
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
