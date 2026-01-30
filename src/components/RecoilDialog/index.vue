<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-18 11:53:32
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-25 13:48:40
 * @Description: 冲销弹窗
-->
<template>
  <el-dialog
    title="冲销信息"
    v-model="open"
    width="600px"
    append-to-body
    @close="cancel"
    :close-on-click-modal="false"
  >
    <WsllForm
      :formData="formData"
      :formColumns="formColumns"
      :formRules="formRules"
      label-width="120px"
      ref="wsllFormRef"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">冲 销</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup name="RecoilDialog">
import _ from 'lodash';
import moment from 'moment';
const props = defineProps({
  handler: {
    type: Function,
  },
});
const { proxy } = getCurrentInstance();
const emit = defineEmits(['refresh']);
const open = ref(false);
let cloneData = {};
const wsllFormRef = ref(null);
const formData = reactive({
  year: '2023',
  voucherDate: moment().format('YYYY-MM-DD'),
  postingDate: '',
  remarks: '',
});
const formRules = reactive({
  postingDate: [{ required: true, message: '必填字段' }],
});
const formColumns = reactive([
  {
    xType: 'DatePicker',
    type: 'year',
    label: '会计年度',
    prop: 'year',
    span: 24,
  },
  {
    xType: 'DatePicker',
    label: '凭证日期',
    prop: 'voucherDate',
    span: 24,
    type: 'date',
    'value-format': 'YYYY-MM-DD',
  },
  {
    xType: 'DatePicker',
    label: '过账日期',
    prop: 'postingDate',
    span: 24,
    type: 'date',
    'value-format': 'YYYY-MM-DD',
  },
  {
    xType: 'Input',
    type: 'textarea',
    label: '备注',
    prop: 'remarks',
    span: 24,
  },
]);
const openDialog = (row) => {
  open.value = true;
  cloneData = _.cloneDeep(row);
  nextTick(() => {
    formData.postingDate = row.postingDate || '';
  });
};
/** 表单重置 */
const reset = () => {
  cloneData = {};
  wsllFormRef.value?.formRef?.resetFields();
};
/** 取消按钮 */
const cancel = () => {
  reset();
  open.value = false;
};
/** 提交按钮 */
const submitForm = () => {
  wsllFormRef.value?.formRef?.validate(async (valid) => {
    if (valid) {
      const params = {
        ...cloneData,
        ...formData,
        number: cloneData.number,
        pickingHeaderId: cloneData.headerPickingId,
      };
      const res = await props.handler(params);
      proxy.responseMsg(res).then(() => {
        cancel();
        emit('refresh', 'edit');
      });
    }
  });
};

defineExpose({
  openDialog,
});
</script>
