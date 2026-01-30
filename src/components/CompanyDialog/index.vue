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
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    prop: 'companyCode',
    label: '公司编码',
    search: {
      el: 'input',
    },
    width: 160,
  },
  {
    prop: 'companyName',
    label: '公司全称',
    search: { el: 'input', props: { filterable: true } },
    width: 250,
  },
  { prop: 'companyAbbreviation', label: '公司简称', minWidth: 120 },
  {
    prop: 'taxRegistrationCertificate',
    label: '税务登记证',
    minWidth: 140,
  },
  {
    prop: 'countryOrigin',
    label: '国家',
    enum: () => getAreaList({ level: 0 }),
    fieldNames: { label: 'shortName', value: 'id' },
  },
  {
    prop: 'address',
    label: '地址',
    minWidth: 120,
  },
  {
    prop: 'postalCode',
    label: '邮政编码',
    minWidth: 120,
  },
  {
    prop: 'currency',
    label: '币种',
    enum: () => proxy.useColumnsDict('currency_code'),
  },
  {
    prop: 'createdNameBy',
    label: '创建人',
  },
  {
    prop: 'createdTime',
    label: '创建时间',
    width: 180,
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
