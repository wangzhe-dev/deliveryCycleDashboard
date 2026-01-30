<!--
 * @Author: heqi
 * @Date: 2023-09-07 14:20:50
 * @LastEditTime: 2023-09-07 17:29:11
 * @Description: 财务科目主数据弹窗
-->

<template>
  <el-dialog append-to-body :title="props.title" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        default-expand-all
        :columns="columns"
        :request-api="loadList"
        label-width="80px"
        rowKey="subjectCode"
        :toolButton="false"
        @radioChange="tableRadioChange"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="jsx" name="accountMasterDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '科目信息',
  },
});

//     console.log(wsllTable.value?.selectedList?.length);
//   if (!wsllTable.value?.selectedListIds?.length) {
//     proxy.showError('请勾选数据');
//     return;
//   }

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: 'radio', fixed: 'left', width: 40 },
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
      wsllTable.value?.refresh();
    }
  },
  { deep: true, immediate: true },
);

const tableRadioChange = (v, row) => {
  emit('submit', row);
  close();
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
