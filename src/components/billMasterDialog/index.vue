<!--
 * @Author: heqi
 * @Date: 2023-09-22 14:37:38
 * @LastEditTime: 2023-08-18 16:32:10
 * @Description: 票据主数据列表
-->
<template>
  <el-dialog
    append-to-body
    title="参考票据"
    v-model="open"
    width="80vw"
    @close="cancel"
    :close-on-click-modal="false"
  >
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="listFBillInformation"
        label-width="80px"
        rowKey="id"
        :toolButton="false"
        @radioChange="tableRadioChange"
      />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="BillMasterDialog">
import { listFBillInformation } from './services';

//     console.log(wsllTable.value?.selectedList?.length);
//   if (!wsllTable.value?.selectedListIds?.length) {
//     proxy.showError('请勾选数据');
//     return;
//   }

const emit = defineEmits();
const { proxy } = getCurrentInstance();
import _ from 'lodash';
const rowData = ref(null);
const wsllTable = ref(null);
const open = ref(false);
const columns = reactive([
  { type: 'radio', fixed: 'left', width: 40 },
  {
    prop: 'billNumber',
    label: '票据号码',
  },
  {
    prop: 'billType',
    label: '票据类型',
    width: '250px',
    enum: () => proxy.useColumnsDict('bill_category_type'),
  },
  {
    prop: 'dateOfIssue',
    label: '出票日期',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'dueDate',
    label: '到期日',
  },
  {
    prop: 'endorsorName',
    label: '背书人名称',
  },
  {
    prop: 'endorseeName',
    label: '被背书人名称',
  },
  {
    prop: 'faceAmount',
    label: '票面金额',
  },
  {
    prop: 'purpose',
    label: '用途',
  },
  {
    prop: 'paymentDate',
    label: '付款日期',
  },
]);

const tableRadioChange = (v, row) => {
  rowData.value = _.cloneDeep(row);
  console.log(row);
};

const openDialog = (key, row) => {
  open.value = true;
  // type.value = key;
  // if (key === 'edit') {
  //   cloneData = _.cloneDeep(row);
  //   assignFormData(formData, row);
  // }
  // ['taxCode'].forEach((it) => {
  //   formColumns.find((el) => el.prop === it).disabled = type.value === 'edit';
  // });
};
/** 表单重置 */
const reset = () => {
  wsllFormRef.value?.formRef?.resetFields();
};
/** 取消按钮 */
const cancel = () => {
  rowData.value = null;
  open.value = false;
  wsllTable.value?.clearRadio();
  // reset();
};
/** 提交按钮 */
const submitForm = () => {
  // if (rowData.value === null) {
  //     if (rowData.value === null) {
  //         proxy.showWarning('请先选择数据')
  //         return
  //     }
  // }
  // emit('submit', rowData.value);
  emit('submit', {
    billNumber: '12345678',
    billSerialNumber: 'YSPJ100000024',
    billType: '2',
    clearedAmount: 100,
    companyNumber: '1000',
    createdNameBy: null,
    createdTime: '2022-10-11T00:00:00.000+08:00',
    dateOfIssue: '2022-10-11T00:00:00.000+08:00',
    deleteFlag: 0,
    dueDate: '2022-10-11T00:00:00.000+08:00',
    endorseeName: '2222',
    endorsorName: '222',
    faceAmount: 100,
    financialVoucherLineId: null,
    id: '1',
    operator: '11',
    paymentDate: '2022-10-11T00:00:00.000+08:00',
    purpose: '小李',
    referenceTicketNumber: '12345678',
    remarks: null,
    settlementStatus: '1',
    updatedNameBy: null,
    updatedTime: null,
    whetherCleared: 1,
  });
  cancel();
};

defineExpose({
  openDialog,
});
</script>
