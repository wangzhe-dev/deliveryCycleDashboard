<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-09-06 10:08:52
 * @Description: 采购申请订单弹窗
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
        rowKey="lineId"
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

<script setup lang="jsx" name="PurchaseReqOrderListDialog">
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
    default: '选择采购申请单',
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
    label: '采购单号',
    width: 162,
    prop: 'purchaseDemandNumber',
    search: {
      el: 'input',
    },
  },
  {
    label: '单据类型',
    width: 134,
    prop: 'purchaseDemandType',
    enum: () => proxy.useColumnsDict('purchase_demand_type'),
    // search: { el: 'select', props: { filterable: true } },
  },
  {
    label: '状态',
    width: 105,
    prop: 'status',
    enum: () => proxy.useColumnsDict('purchase_demand_status'),
    // search: {
    //   el: 'select',
    // },
  },
  {
    label: '采购类别',
    width: 150,
    prop: 'purchaseCategoryNumber',
    enum: () => proxy.useColumnsDict('purchase_req_category'),
  },
  {
    label: '物料分类',
    width: 150,
    prop: 'materialsGroupName',
  },
  // {
  //   label: '物料类型',
  //   width: 150,
  //   prop: 'materialsType',
  //   enum: () => proxy.useColumnsDict('materials_type'),
  // },
  {
    label: '物料编号',
    width: 150,
    prop: 'materialsCode',
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '物料名称',
    width: 160,
    prop: 'materialsName',
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '资产描述',
    width: 150,
    prop: 'assetsDesc',
  },
  {
    label: '服务类型',
    width: 150,
    prop: 'serviceType',
  },
  {
    label: '服务描述',
    width: 150,
    prop: 'serviceDesc',
  },
  {
    label: '用途',
    width: 150,
    prop: 'purpose',
  },
  {
    label: '规格',
    width: 150,
    prop: 'specifications',
  },
  {
    label: '材质',
    width: 150,
    prop: 'textureOfMaterial',
  },
  {
    label: '图号',
    width: 150,
    prop: 'drawingNo',
  },

  {
    label: '申请数量',
    width: 120,
    prop: 'demandQuantity',
  },
  {
    label: '计量单位',
    width: 100,
    prop: 'unitOfMeasurementCode',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    label: '项目号',
    width: 100,
    prop: 'projectNumber',
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '需求部门',
    width: 130,
    prop: 'demandDepartmentName',
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '工厂',
    width: 150,
    prop: 'factoryName',
  },
  {
    label: '需求日期',
    width: 180,
    prop: 'needDate',
  },
  {
    label: '采购组织',
    width: 150,
    prop: 'purchaseOrgName',
    
  },
  {
    label: '创建日期',
    width: 180,
    prop: 'createdTime',
  },
  {
    label: '申请人',
    width: 120,
    prop: 'requesterName',
  },
  {
    label: '备注',
    width: 127,
    prop: 'remarks',
    search: {
      el: 'input',
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
    const purchaseDemandNumber = list[0].purchaseDemandNumber;
    const isSame = list.every((item) => item.purchaseDemandNumber === purchaseDemandNumber);
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
