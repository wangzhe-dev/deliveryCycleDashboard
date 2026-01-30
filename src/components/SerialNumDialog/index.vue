<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-12 10:05:28
 * @Description: 序列号主数据弹窗
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
        rowKey="id"
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

<script setup lang="jsx" name="SerialNumDialog">
import { ref } from 'vue';
import { loadList } from './services';
import _ from 'lodash';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择序列号主数据',
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
const columns = reactive([
  // { type: 'selection', fixed: 'left', width: 40 },
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    prop: 'serialNumber',
    label: '序列号',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'materialsCode',
    label: '物料名称',
    // search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'materialsName',
    label: '物料名称',
    // search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'workOrder',
    label: '加工单号',
  },
  {
    prop: 'factoryName',
    label: '工厂',
    // search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'stockLocationName',
    label: '仓库',
  },
  {
    prop: 'serialNumberState',
    label: '系统状态',
    enum: () => proxy.useColumnsDict('serial_number_status'),
  },
  {
    prop: 'createdTime',
    label: '创建日期',
  },
]);

const initParam = ref({});

const confirm = () => {
  const list = wsllTable.value.selectedList;
  if (list.length) {
    emit('submit', list);
    close();
  } else {
    proxy.showWarning('请选择序列号');
  }
  console.log(list, 'list');
};

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParam.value = _.cloneDeep(props.params);
      // wsllTable.value?.refresh();
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
