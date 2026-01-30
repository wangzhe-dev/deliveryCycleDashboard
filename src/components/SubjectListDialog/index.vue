<!--
 * @Author: heqi
 * @Date: 2023-08-02 14:37:38
 * @LastEditTime: 2023-11-13 17:01:21
 * @Description: 财务科目信息主数据
-->
<template>
  <el-dialog append-to-body :title="props.title" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="treeSubject"
        label-width="80px"
        row-key="subjectId"
        :toolButton="false"
        :initParam="initParam"
        height="40vh"
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
<script setup lang="jsx" name="SubjectListDialog">
import { treeSubject } from './services';
import _ from 'lodash';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择科目',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'radio',
  },
  submitVerify: {
    type: Function,
    default: null,
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
    prop: 'subjectCode',
    label: '科目编码',
    align: 'left',
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-input vModel_trim={searchParam.subjectCodeStart} placeholder="请输入" />
            <span class="mr10 ml10">到</span>
            <el-input vModel_trim={searchParam.subjectCodeEnd} placeholder="请输入" />
          </div>
        );
      },
    },
  },
  {
    prop: 'fullNameSubject',
    label: '科目全称',
    width: '250px',
  },
  {
    prop: 'subjectAbbreviation',
    label: '科目简称',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'chartAccountsControl',
    label: '科目类型',
    enum: () => proxy.useColumnsDict('char_accounts_control'),
  },
  {
    prop: 'businessAccountingProject',
    label: '核算项目',
    enum: () => proxy.useColumnsDict('business_accounting_project'),
  },
  {
    prop: 'accountingDimension',
    label: '核算维度',
  },
  {
    prop: 'state',
    label: '状态',
    enum: () => proxy.useColumnsDict('use_status'),
    search: { el: 'select', props: { filterable: true } },
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
  if (props.submitVerify ? !props.submitVerify(row) : false) {
    return;
  }

  emit('submit', row);
  close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;
  if (list.length) {
    emit('submit', list);
    close();
  } else {
    proxy.showWarning('请选择订单');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
