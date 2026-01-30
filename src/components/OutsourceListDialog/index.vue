<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-14 17:14:37
 * @Description: 委外订单列表弹窗
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

<script setup lang="jsx" name="OutsourceListDialog">
import { watch } from 'vue';
import { loadList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择委外单',
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
    label: '订单编号',
    width: 135,
    prop: 'documentNumber',
    fixed: 'left',
    search: { el: 'input' },
  },
  {
    label: '单据类型',
    width: 120,
    prop: 'documentType',
    enum: () => proxy.useColumnsDict('outsoutcing_order_type'),
  },
  {
    label: '单据状态',
    width: 120,
    prop: 'status',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
  },
  {
    label: '单据日期',
    width: 120,
    prop: 'createdTime',
  },
  {
    label: '发起委外工厂',
    width: 120,
    prop: 'factoryName',
  },
  {
    label: '项目编号',
    width: 120,
    prop: 'projectCode',
  },
  {
    label: '产品编号',
    width: 120,
    prop: 'materialsCode',
  },
  {
    label: '物料名称',
    width: 120,
    prop: 'materialsName',
  },
  {
    label: '规格型号',
    width: 120,
    prop: 'specifications',
  },
  {
    label: '数量',
    width: 120,
    prop: 'pnumber',
  },
  {
    label: '库存单位',
    width: 120,
    prop: 'stockUnit',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    label: '业务状态',
    width: 120,
    prop: 'businessState',
    enum: () => proxy.useColumnsDict('outsourcing_order_business_status'),
  },
  {
    label: '强制关闭原因',
    width: 120,
    prop: 'mandatoryCloseReason',
  },
  {
    label: '计划开工时间',
    width: 120,
    prop: 'plannedStartTime',
  },
  {
    label: '计划完工时间',
    width: 120,
    prop: 'plannedEndTime',
  },
  {
    label: '采购组织',
    width: 120,
    prop: 'purchaseOrgName',
  },
  {
    label: '供应商',
    width: 120,
    prop: 'supplierName',
  },
  // {
  //   label: '需求优先级',
  //   width: 120,
  //   prop: 'demandPriority',
  // },
  {
    label: '领料状态',
    width: 120,
    prop: 'pickingState',
    enum: () => proxy.useColumnsDict('production_picking_status'),
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
  emit('submit', row);
  close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;

  if (list.length) {
    const documentNumber = list[0].documentNumber;
    const isSame = list.every((item) => item.documentNumber == documentNumber);
    if (isSame) {
      emit('submit', list);
      close();
    } else {
      proxy.showWarning('请选相同的单号');
    }
  } else {
    proxy.showWarning('请选择订单');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();

  emit('update:modelValue', false);
};
</script>
