<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-03 15:29:00
 * @Description: MRP计划单
-->
<template>
  <el-dialog append-to-body :title="props.title" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="120px"
        rowKey="mrpOrderCode"
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

<script setup lang="jsx" name="MrpPlanOrderDialog">
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
    default: '选择MRP计划单',
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
    prop: 'mrpOrderCode',
    label: '计划单号',
    width: '160px',
    fixed: 'left',
    search: { el: 'input' },
  },
  {
    prop: 'auditStatus',
    width: '140px',
    label: '计划单状态',
    enum: () => proxy.useColumnsDict('mrp_order_audit_state'),
  },
  {
    prop: 'marketOrderNumber',
    label: '销售订单编号',
    width: '160px',
    search: {
      el: 'input',
    },
  },

  { prop: 'materialsName', label: '物料名称', width: '140px' },
  { prop: 'materialsNumber', label: '物料编号', width: '180px' },
  { prop: 'materialsDesc', label: '物料描述', width: '180px' },
  {
    prop: 'materialsType',
    label: '物料类型',
    width: '140px',
    enum: () => proxy.useColumnsDict('materials_type'),
  },
  { prop: 'specifications', label: '规格型号', width: '180px' },
  { prop: 'textureOfMaterial', label: '材质', width: '180px' },

  { prop: 'stockQuantity', label: '当前库存', width: '120px' },
  { prop: 'safetyStock', label: '安全库存', width: '120px' },
  { prop: 'purchaseQuantity', label: '采购在途', width: '120px' },
  { prop: 'productionQuantity', label: '自制在途', width: '120px' },
  { prop: 'feedingQuantity', label: '生产领料', width: '120px' },
  { prop: 'outsourcingNumber', label: '委外在途', width: '120px' },
  { prop: 'outsourcingPicking', label: '委外领料', width: '120px' },
  { prop: 'plannedInventory', label: '计划库存量', width: '120px' },
  { prop: 'plannedQuantity', label: '计划数量', width: '120px' },
  { prop: 'numberDifferences', label: '需求数量', width: '120px' },
  { prop: 'choiceQuantity', label: '备货数量', width: '120px' },
  { prop: 'systemRecommendationsNumber', label: '系统建议数量', width: '120px' },
  {
    prop: 'systemRecommendationsType',
    label: '建议数量',
    width: '120px',
    render: ({ row }) => row.suggestedQuantity || 0,
    enum: [
      {
        id: 1,
        label: '等于0',
        value: 0,
      },
      {
        id: 2,
        label: '大于0',
        value: 1,
      },
    ],
    search: {
      el: 'select',
    },
  },
  {
    prop: 'measurementUnit',
    label: '计量单位',
    width: '120px',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    prop: 'commencementDate',
    label: '计划采购/开工日期',
    width: '180px',
    render: ({ row }) =>
      row.commencementDate ? moment(row.commencementDate).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    prop: 'completionDate',
    label: '计划完工日期',
    width: '180px',
    render: ({ row }) =>
      row.completionDate ? moment(row.completionDate).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    prop: 'orderType',
    label: '订单类型',
    width: '120px',
    enum: () => proxy.useColumnsDict('mrp_order_type'),
    search: { el: 'select' },
  },
  { prop: 'productionPurchaseCode', label: '生产/采购编号', width: '160px' },
  {
    prop: 'auditDate',
    label: '审核日期',
    width: '180px',
    render: ({ row }) =>
      row.auditDate ? moment(row.auditDate).format('YYYY-MM-DD HH:mm:ss') : '-',
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-date-picker
              type="date"
              vModel_trim={searchParam.auditDateStart}
              value-format="x"
              placeholder="请输入"
            />
            <span class="mr10 ml10">到</span>
            <el-date-picker
              type="date"
              value-format="x"
              vModel_trim={searchParam.auditDateEnd}
              placeholder="请输入"
            />
          </div>
        );
      },
    },
  },
  {
    prop: 'createdTime',
    label: '生成日期',
    width: '180px',
    render: ({ row }) =>
      row.createdTime ? moment(row.createdTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-date-picker
              type="date"
              vModel_trim={searchParam.createdTimeStart}
              value-format="x"
              placeholder="请输入"
            />
            <span class="mr10 ml10">到</span>
            <el-date-picker
              type="date"
              value-format="x"
              vModel_trim={searchParam.createdTimeEnd}
              placeholder="请输入"
            />
          </div>
        );
      },
    },
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
