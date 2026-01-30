<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: liangjia
 * @LastEditTime: 2025-07-01 11:37:18
 * @Description: 供应商主数据弹窗
-->
<template>
  <el-dialog title="选择供应商" v-model="visible" width="80vw" @close="close" append-to-body>
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="110px"
        rowKey="supplierCode"
        :toolButton="false"
        @radioChange="tableRadioChange"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="jsx" name="SupplierMasterDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: 'radio', fixed: 'left', width: 40 },
  {
    prop: 'supplierCode',
    label: '供应商编码',
    search: {
      order: 0,
      el: 'input',
    },
    width: 120,
  },
  {
    prop: 'supplierType',
    label: '供应商类型',
    enum: () => proxy.useColumnsDict('supplier_type'),
    search: { order: 2, el: 'select', props: { filterable: true } },
    width: 120,
  },
  {
    prop: 'supplierStatus',
    label: '状态',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
    search: { order: 5, el: 'select', props: { filterable: true } },
    width: 100,
  },
  {
    prop: 'supplierName',
    label: '名称',
    search: { order: 1, el: 'input', props: { filterable: true } },
    width: '160px',
  },
  {
    prop: 'countryName',
    label: '国家',
    width: 120,
  },
  {
    prop: 'provinceName',
    label: '省',
    width: 120,
  },
  {
    prop: 'address',
    label: '地址',
    width: 120,
  },
  {
    prop: 'responsibleDepartmentName',
    label: '负责部门',
    width: 120,
  },
  {
    prop: 'responsiblePersonName',
    label: '负责人',
  },
  {
    prop: 'telephoneNumber',
    label: '电话',
  },
  {
    prop: 'companyCategoryCode',
    label: '公司类别',
    enum: () => proxy.useColumnsDict('supplier_company_category'),
    width: 120,
  },
  {
    prop: 'companyNatureCode',
    label: '公司性质',
    enum: () => proxy.useColumnsDict('customer_company_nature'),
    width: 120,
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
