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
  </el-dialog>
</template>

<script setup lang="jsx" name="ProcessMaintenanceDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择工序主数据',
  },
  checkType: {
    type: String,
    default: 'selection',
  },
  params: {
    type: Object,
    default: {},
  },
});

const initParam = ref({});

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
    label: '编码',
    prop: 'stepCode',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    label: '名称',
    prop: 'stepName',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    label: '工序内容',
    prop: 'content',
    // search: { el: 'input', props: { filterable: true } }
  },
  {
    prop: 'type',
    label: '工序类型',
    enum: () => proxy.useColumnsDict('step_type'),
    search: { el: 'select', props: { filterable: true } },
  },
  {
    prop: 'processGroupId', // TODO: processGroupName
    label: '工序组',
    render: ({ row }) => row.processGroupName || row.processGroupId,
  },

  {
    label: '加工用时',
    prop: 'standardTime',
  },
  {
    label: '准备工时',
    prop: 'preparationTime',
  },
  {
    label: '参考单价',
    prop: 'price',
  },
  {
    label: '负责人',
    prop: 'positionId', // TODO: positionName
  },
  {
    label: '是否委外',
    prop: 'outFlag',
    enum: () => proxy.useColumnsDict('out_flag'),
    // search: { el: 'select', props: { filterable: true } }
  },
  {
    label: '委外工厂',
    prop: 'outSourcing',
  },
  {
    prop: 'weight',
    label: '权重',
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParam.value = props.params;
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
