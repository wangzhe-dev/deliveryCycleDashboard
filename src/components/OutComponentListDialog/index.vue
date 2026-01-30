<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-20 16:09:53
 * @Description: 委外组件清单
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
        rowKey="documentNumber"
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

<script setup lang="jsx" name="OutComponentListDialog">
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
    default: '选择委外组件清单',
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
    label: '单据编号',
    width: 174,
    prop: 'documentNumber',
    fixed: 'left',
    search: { el: 'input' },
  },
  {
    label: '项目批号',
    width: 140,
    prop: 'batchNumber1',
  },
  {
    label: '产品编号',
    minWidth: 200,
    prop: 'headerMaterialsCode',
  },
  {
    label: '产品名称',
    width: 120,
    prop: 'headerMaterialsName',
  },
  {
    label: '产品数量',
    width: 120,
    prop: 'pnumber',
  },
  {
    label: '子物料编号',
    minWidth: 200,
    prop: 'materialsCode',
  },
  {
    label: '子物料名称',
    minWidth: 200,
    prop: 'materialsName',
  },
  {
    label: '单据状态',
    width: 120,
    prop: 'status',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
  },
  {
    label: '委外订单编号',
    width: 150,
    prop: 'productionNumber',
  },
  {
    label: '委外订单行号',
    width: 120,
    prop: 'productionLineNumber',
  },
  {
    label: '委外订单状态',
    width: 120,
    prop: 'businessState',
    enum: () => proxy.useColumnsDict('outsourcing_order_business_status'),
  },
  {
    label: '单据明细行号',
    width: 120,
    prop: 'lineNumber',
  },
  {
    label: '子规格型号',
    width: 120,
    prop: 'materialsModel',
  },
  {
    label: '用量分子',
    width: 120,
    prop: 'molecule',
  },
  {
    label: '用量分母',
    width: 120,
    prop: 'denominator',
  },
  {
    label: '子项库存单位',
    width: 120,
    prop: 'company',
    enum: proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    label: '变动损耗',
    width: 120,
    prop: 'variableLoss',
  },
  {
    label: '应发数量',
    width: 120,
    prop: 'shouldQty',
  },
  {
    label: '已领数量',
    width: 120,
    prop: 'receivedQty',
  },
  {
    label: '未领数量',
    width: 120,
    prop: 'notReceivedQty',
  },
  {
    label: '项目号',
    width: 120,
    prop: 'projectCode',
  },
  {
    label: '采购订单',
    width: 144,
    prop: 'purchasingNumber',
  },
  {
    label: '采购订单行号',
    width: 120,
    prop: 'purchasingLineNumber',
  },
  {
    label: 'BOM版本',
    width: 120,
    prop: 'materialsBom',
  },
  {
    label: '备注',
    width: 120,
    prop: 'remarks',
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
