<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-25 10:51:20
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-25 10:55:49
 * @Description: 生产组件清单
-->
<template>
  <el-dialog append-to-body title="选择组件清单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        :toolButton="false"
        rowKey="id"
        max-height="40vh"
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

<script setup lang="jsx" name="ProductModuleListDialog">
import { loadList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'selection',
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const initParam = ref({});
const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    label: '单据编号',
    width: 150,
    prop: 'documentNumber',
  },
  // {
  //   label: '项目批号',
  //   width: 150,
  //   prop: 'batchNumber1',
  // },
  {
    label: '产品编号',
    width: 150,
    prop: 'headerMaterialsCode', // headerMaterielsCode
    search: {
      el: 'input',
    },
  },
  {
    label: '产品名称',
    width: 150,
    prop: 'headerMaterialsName',
    search: {
      el: 'input',
    },
  },
  {
    label: '产品数量',

    width: 150,
    prop: 'pnumber',
  },
  {
    label: '物料编号',
    width: 150,
    prop: 'materialsCode',
    search: {
      el: 'input',
    },
  },
  {
    label: '物料名称',
    width: 150,
    prop: 'materialsName',
    search: {
      el: 'input',
    },
  },
  {
    label: '生产订单状态',
    width: 150,
    prop: 'businessState',
    enum: () => proxy.useColumnsDict('produce_order_business_status'),
    search: {
      el: 'select',
    },
  },
  {
    label: '单据状态',
    width: 150,
    prop: 'documentState',
    enum: () => proxy.useColumnsDict('produce_order_status'),
    // search: {
    //   el: 'select',
    // },
  },
  {
    label: '生产订单编号',
    width: 150,
    prop: 'productionNumber',
    search: {
      el: 'input',
    },
  },
  // {
  //   label: '生产订单行号',
  //
  //   width: 150,
  //   prop: 'productionLineNumber',
  // },
  {
    label: 'BOM版本',
    width: 150,
    prop: 'materielBom',
  },
  {
    label: '加工单号',
    width: 150,
    prop: 'processingOrderNumber',
  },
  // {
  //   label: '生产车间',
  //   width: 120,
  //   prop: 'productionWorkshop',
  //   enum: () => proxy.useColumnsDict('production_factory_workshop'),
  // },
  // {
  //   label: '单据明细行号',
  //
  //   width: 150,
  //   prop: 'lineNumber',
  // },
  {
    label: '规格型号',
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
    label: '用量分子',
    width: 150,
    prop: 'molecule',
  },
  {
    label: '用量分母',
    width: 150,
    prop: 'denominator',
  },
  {
    label: '库存单位',
    width: 150,
    prop: 'stockUnit',
    enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  },
  {
    label: '变动损耗',
    width: 150,
    prop: 'variableLoss',
  },
  {
    label: '应发数量',
    width: 150,
    prop: 'shouldQty',
  },
  {
    label: '领料数量',
    width: 150,
    prop: 'pickingQty',
  },
  {
    label: '补料数量',
    width: 150,
    prop: 'supplementQty',
  },
  {
    label: '退料数量',
    width: 150,
    prop: 'returnQty',
  },
  // {
  //   label: '未领数量',
  //   width: 150,
  //   prop: 'notReceivedQty',
  // },
  // {
  //   label: '项目号',
  //   apiParam: 'PROJECT',
  //   width: 150,
  //   prop: 'projectNumber',
  // },
  {
    label: '备注',
    width: 150,
    prop: 'remark',
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParam.value = props.params;
      // wsllTable.value?.refresh();
      wsllTable.value?.clearSelection();
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
    proxy.showWarning('请选择物料');
  }
  console.log(list, 'list');
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
