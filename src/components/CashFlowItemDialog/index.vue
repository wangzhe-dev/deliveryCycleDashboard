<!--
 * @Author: heqi
 * @Date: 2023-08-02 14:37:38
 * @LastEditTime: 2025-11-25 11:08:05
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
        row-key="cashCode"
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
<script setup lang="jsx" name="CashFlowItemDialog">
import { treeSubject } from './services';
import _ from 'lodash';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择现金流项',
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
    prop: 'cashCode',
    label: '编号',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'cashName',
    label: '名称',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'cashFullName',
    label: '现金流量项全名',
    search: { el: 'input', props: { filterable: true } },
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
