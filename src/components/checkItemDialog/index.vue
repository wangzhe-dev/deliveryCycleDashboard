<template>
  <el-dialog append-to-body title="选择检测项目" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        row-key="id"
        highlight-current-row
        :columns="columns"
        :request-api="loadListFn"
        @radioChange="tableRadioChange"
        :init-param="initParam"
      ></WsllTable>
    </div>
  </el-dialog>
</template>

<script setup lang="jsx" name="bomDialog">
import { loadList } from './services';
import { mapValueToLabel } from '@/utils/utils';
const { proxy } = getCurrentInstance();
const { check_method, detection_method, check_frequent, unit_of_measurement_code } =
  proxy.useDictList([
    'check_method',
    'detection_method',
    'check_frequent',
    'unit_of_measurement_code',
  ]);
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  processesId: {
    type: String,
    default: '',
  },
});
let initParam = ref({ processesId: '' });
const emit = defineEmits();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: 'radio', fixed: 'left', width: 40 },
  {
    type: 'index',
    label: '序号',
    width: 80,
  },
  {
    label: '工序',
    prop: 'processesName',
    minWidth: '140',
  },
  {
    label: '质检类型',
    prop: 'qualityTypeCode',
    search: { el: 'select' },
    enum: () => proxy.useColumnsDict('rule_type'),
    minWidth: '140',
    render: ({ row }) => row.qualityTypeName,
  },
  {
    label: '检验项目',
    prop: 'inspectionItemName',
    render: ({ row }) => row.itemsDTOList[0].inspectionItemName,
    minWidth: '140',
  },
  {
    label: '检测类别',
    prop: 'checkMethod',
    enum: () => proxy.useColumnsDict('check_method'),
    search: { el: 'select', order: 5 },
    render: ({ row }) => mapValueToLabel(row.itemsDTOList[0].checkMethod, check_method.value),
    minWidth: '140',
  },
  {
    label: '检测方法',
    prop: 'detectionMethod',
    enum: () => proxy.useColumnsDict('detection_method'),
    search: { el: 'select' },
    render: ({ row }) =>
      mapValueToLabel(row.itemsDTOList[0].detectionMethod, detection_method.value),
    minWidth: '140',
  },
  {
    label: '检验位置',
    prop: 'detectLocation',
    render: ({ row }) => row.itemsDTOList[0].detectLocation,
    minWidth: '140',
  },
  {
    label: '检验频率',
    prop: 'checkFrequent',
    enum: () => proxy.useColumnsDict('check_frequent'),
    render: ({ row }) => mapValueToLabel(row.itemsDTOList[0].checkFrequent, check_frequent.value),
    minWidth: '140',
  },
  {
    label: '上公差',
    prop: 'upError',
    render: ({ row }) => row.itemsDTOList[0].upError,
    minWidth: '140',
  },
  {
    label: '下公差',
    prop: 'lowError',
    render: ({ row }) => row.itemsDTOList[0].lowError,
    minWidth: '140',
  },
  {
    label: '管理上公差',
    prop: 'upErrorManage',
    render: ({ row }) => row.itemsDTOList[0].upErrorManage,
    minWidth: '140',
  },
  {
    label: '管理下公差',
    prop: 'lowErrorManage',
    render: ({ row }) => row.itemsDTOList[0].lowErrorManage,
    minWidth: '140',
  },
  {
    label: '单位',
    prop: 'unit',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),

    render: ({ row }) => mapValueToLabel(row.itemsDTOList[0].unit, unit_of_measurement_code.value),
    minWidth: '140',
  },
  {
    label: '判定方式',
    prop: 'decisionProcedure',
    search: { el: 'select' },
    enum: [
      { value: '数值判定', value: '数值判定' },
      { value: '非数值判定', value: '非数值判定' },
    ],
    render: ({ row }) => row.itemsDTOList[0].decisionProcedure,
    minWidth: '140',
  },
]);
let localProcessesId = ref('');

watch(
  () => props.processesId,
  (val) => {
    localProcessesId.value = val;
    initParam.value = { processesId: localProcessesId.value };
    wsllTable.value?.refresh();
  },
  { deep: true, immediate: true },
);
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
const loadListFn = (param) => {
  param.processesId = localProcessesId.value;
  return loadList(param);
};
</script>
