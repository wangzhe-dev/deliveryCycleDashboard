<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-09-25 13:05:20
 * @Description: 凭证清单弹窗
-->
<template>
  <el-dialog append-to-body title="凭证清单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="140px"
        :toolButton="false"
        :initParam="initParams"
        :pagination="false"
      >
        <template #operation="scope">
          <el-button link type="primary" icon="view" @click="handleView(scope.row)">
            查看详情
          </el-button>
        </template>
      </WsllTable>
    </div>
    <template #footer>
      <el-button @click="close">返回</el-button>
    </template>
    <VoucherDetails v-model="voucherVisible" :params="voucherParams" />
  </el-dialog>
</template>

<script setup lang="jsx" name="VoucherListDialog">
import VoucherDetails from '@/components/VoucherDetails';
import { loadList } from './services';
import moment from 'moment';
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
  //   {
  //     type: props.checkType,
  //     fixed: 'left',
  //     width: 40,
  //   },
  {
    prop: 'voucherNumber',
    label: '凭证编号',
    width: '200',
  },

  {
    prop: 'voucherDate',
    label: '凭证日期',
    width: '160',
    render: ({ row }) => {
      return row.voucherDate ? moment(row.voucherDate).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    label: '会计年度',
    prop: 'postingYear',
    width: '100',
  },
  {
    label: '期间',
    prop: 'postingPeriod',
    width: '100',
  },
  {
    prop: 'voucherDocumentType',
    label: '凭证类型',
    width: '140',
    enum: () => proxy.useColumnsDict('document_type'),
  },
  {
    prop: 'createMethod',
    label: '来源类型',
    minWidth: '120',
    enum: [
      { value: 'CREATE', label: '新建' },
      { value: 'BUSINESS_PUSH', label: '业务单据推送' },
    ],
  },
  {
    label: '摘要',
    prop: 'summary',
    minWidth: '200',
  },
  {
    label: '币种',
    prop: 'currencyName',
    // enum: () => proxy.useColumnsDict('currency_code'),
    // fieldNames: { label: 'label', value: 'value' },
    width: '100',
  },

  {
    label: '借方金额',
    prop: 'totalDebitAmount',
    width: '100',
  },
  {
    label: '贷方金额',
    prop: 'totalCreditAmount',
    width: '100',
  },
  {
    label: '制单人',
    prop: 'preparedByName',
    width: '100',
  },
  {
    label: '审核人',
    prop: 'reviewerName',
    width: '100',
  },
  {
    label: '过账人',
    prop: 'postingPersonName',
    width: '100',
  },
  {
    label: '审核状态',
    prop: 'voucherStatusName',
    width: '140',
  },
  { prop: 'operation', label: '操作', fixed: 'right', width: 120 },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParams.value = props.params;
      wsllTable.value?.refresh();
    }
  },
  { deep: true, immediate: true },
);

const close = () => {
  emit('update:modelValue', false);
};
//查看
const voucherVisible = ref(false);
const voucherParams = ref({});
const handleView = (row) => {
  voucherVisible.value = true;
  voucherParams.value.id = row.id;
};
</script>
