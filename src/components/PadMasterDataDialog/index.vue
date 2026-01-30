<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-18 13:52:40
 * @Description: 核算维度弹窗
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
        rowKey="projectCode"
        :toolButton="false"
        :init-param="initParam"
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

<script setup lang="jsx" name="PadMasterDataDialog">
import { watch } from 'vue';
import { loadList, getPdaTypeList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择核算维度',
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
    prop: 'projectCode',
    label: '项目号',
    search: {
      el: 'input',
    },
    width: 140,
  },
  {
    prop: 'projectName',
    label: '项目描述',
    width: 180,
  },
  {
    prop: 'projectType',
    label: '类型',
    enum: getPdaTypeList,
    fieldNames: { label: 'typeDesc', value: 'typeNo' },
    search: { el: 'select', props: { filterable: true } },
  },
  {
    prop: 'freezeFlag',
    label: '标识',
    width: 180,
    enum: () => proxy.useColumnsDict('use_status'),
    search: { el: 'select', props: { filterable: true } },
  },
  {
    prop: 'status',
    label: '状态',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
    search: { el: 'select', props: { filterable: true } },
    width: 100,
  },
  {
    prop: 'createdNameBy',
    label: '创建人',
  },
  {
    prop: 'createdTime',
    label: '创建时间',
    width: 180,
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-date-picker
              type="date"
              vModel_trim={searchParam.createdStartTime}
              value-format="YYYY-MM-DD"
              placeholder="请输入"
            />
            <span class="mr10 ml10">到</span>
            <el-date-picker
              type="date"
              value-format="YYYY-MM-DD"
              vModel_trim={searchParam.createdEndTime}
              placeholder="请输入"
            />
          </div>
        );
      },
    },
  },
  {
    prop: 'updatedNameBy',
    label: '修改人',
  },
  {
    prop: 'updatedTime',
    label: '修改时间',
    width: 180,
  },
  {
    prop: 'remarks',
    label: '备注',
    width: 200,
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParam.value = props.params;
      wsllTable.value?.loadData();
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
    proxy.showWarning('请选择数据');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();

  emit('update:modelValue', false);
};
</script>
