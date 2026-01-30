<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-18 15:00:01
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-09-30 11:21:37
 * @Description: 过账弹窗
-->
<template>
  <el-dialog
    title="编辑过账信息"
    v-model="open"
    width="500px"
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
        <el-button type="primary" @click="submitForm" :disabled="btnDisabled">过账</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup name="PostingDialog">
import _ from 'lodash';
import moment from 'moment';
const props = defineProps({
  handler: {
    type: Function,
  },
});
const emit = defineEmits(['refresh']);
const { proxy } = getCurrentInstance();
const open = ref(false);
let cloneData = {};
const wsllFormRef = ref(null);

const formData = reactive({
  year: moment().format('YYYY'),
  postingDate: moment().format('YYYY-MM-DD'),
  postingPeriod: moment().format('M'),
  voucherDate: moment().format('YYYY-MM-DD'),
});

const formRules = reactive({
  postingDate: [{ required: true, message: '必填字段' }],
  voucherDate: [{ required: true, message: '必填字段' }],
});

const formColumns = reactive([
  {
    xType: 'DatePicker',
    label: '会计年度',
    prop: 'year',
    'value-format': 'YYYY',
    type: 'year',
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
    'value-format': 'YYYY-MM-DD',
    span: 24,
    change: postDateChange,
  },
  {
    xType: 'DatePicker',
    label: '记账期间',
    prop: 'postingPeriod',
    type: 'month',
    'value-format': 'M',
    format: 'M',
    span: 24,
  },
]);
function postDateChange(val) {
  formData.postingPeriod = val ? moment(val).format('M') : '';
}
const btnDisabled = ref(false);
const openDialog = (row) => {
  open.value = true;
  cloneData = _.cloneDeep(row);
  btnDisabled.value = false;
  if (cloneData.echoPostingDate) {
    nextTick(() => {
      formData.postingDate = cloneData.echoPostingDate;
    });
  }
};

/** 表单重置 */
const reset = () => {
  btnDisabled.value = false;
  wsllFormRef.value?.formRef?.resetFields();
};
/** 取消按钮 */
const cancel = () => {
  cloneData = {};
  reset();
  open.value = false;
};
/** 提交按钮 */
const submitForm = () => {
  wsllFormRef.value?.formRef?.validate(async (valid) => {
    if (valid) {
      btnDisabled.value = true;
      props.handler({ ...cloneData, ...formData }).then((res) => {
        proxy.responseMsg(res).then(() => {
          emit('refresh', 'edit');
          cancel();
        });
      });
    }
  });
};
defineExpose({
  openDialog,
});
</script>
