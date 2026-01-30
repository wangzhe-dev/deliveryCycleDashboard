<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-02-18 09:18:51
 * @Description: 客户主数据弹窗
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
        rowKey="customerCode"
        :toolButton="false"
        :initParam="{ customerStatusList: ['3'] }"
        @radioChange="tableRadioChange"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="jsx" name="CustomerMasterDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择客户主数据',
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: 'radio', fixed: 'left', width: 40 },
  {
    prop: 'customerCode',
    label: '客户编号',
    search: {
      el: 'input',
      // 自定义 search 显示内容
      // render: ({ searchParam }) => {
      //   return (
      //     <div class="row">
      //       <el-input vModel_trim={searchParam.companyCode} placeholder="请输入" />
      //       <span class="mr10 ml10">到</span>
      //       <el-input vModel_trim={searchParam.companyCodeEnd} placeholder="请输入" />
      //     </div>
      //   );
      // },
    },
    width: 120,
  },
  {
    prop: 'customerName',
    label: '客户名称',
    search: { el: 'input' },
    width: '160px',
  },
  {
    prop: 'customerTypeCode',
    label: '客户类型',
    enum: () => proxy.useColumnsDict('customer_type'),
    search: { el: 'select', props: { filterable: true } },
    width: 120,
  },
  {
    prop: 'companyName',
    label: '公司名称',
    width: 120,
  },
  {
    prop: 'customerStatus',
    label: '状态',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
    search: { el: 'select', props: { filterable: true } },
    width: 100,
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
    prop: 'cityName',
    label: '城市',
    width: 120,
  },
  {
    prop: 'companyNatureCode',
    label: '公司性质',
    enum: () => proxy.useColumnsDict('customer_company_nature'),
    width: 120,
  },
  {
    prop: 'companyCategoryCode',
    label: '公司类别',
    enum: () => proxy.useColumnsDict('supplier_company_category'),
    width: 120,
  },
  {
    prop: 'companyScaleCode',
    label: '公司规模',
    enum: () => proxy.useColumnsDict('customer_company_scale'),
    width: 120,
  },
  {
    prop: 'billingAddress',
    label: '开票地址',
  },
  {
    prop: 'telephone',
    label: '电话',
  },
  {
    prop: 'customerClassify',
    label: '客户分类',
  },
  {
    prop: 'createdNameBy',
    label: '创建人',
  },
  {
    prop: 'createdTime',
    label: '创建时间',
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
