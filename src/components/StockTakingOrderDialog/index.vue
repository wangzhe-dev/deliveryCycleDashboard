<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-12 10:05:28
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
        rowKey="documentNo"
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

<script setup lang="jsx" name="StockTakingOrderDialog">
import { loadList } from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择盘点单',
  },
  params: {
    type: Object,
    default: () => ({
      documentPostType: '',
      documentStatus: ''
    }),
  },
  checkType: {
    type: String,
    default: 'radio',
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);

const initParam = ref({ 
  documentPostType: '',
  documentStatus: ''
});

const columns = reactive([
  { type: props.checkType, fixed: 'left', width: 40 },
  {
    label: '盘点单号',
    prop: 'documentNo',
    // width: 160,
    search: {
      el: 'input',
    },
  },
  {
    label: '单据状态',
    prop: 'documentStatus',
    // width: 120,
    enum: () => proxy.useColumnsDict('io_status'),
    search: {
      el: 'select',
    },
  },
  {
    label: '单据类型',
    prop: 'documentType',
    // width: 120,
    enum: () => proxy.useColumnsDict('inventory_document_type'),
    // search: {
    //   el: 'select',
    // },
  },
  {
    label: '单据日期',
    prop: 'createdTime',
    // width: 160,
    render: ({ row }) =>
      row.createdTime ? moment(row.createdTime).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  // {
  //   label: '物料编号',
  //   prop: 'materialsCode',
  //   width: 160,
  // },
  // {
  //   label: '物料名称',
  //   prop: 'materialsName',
  //   width: 160,
  // },
  // {
  //   label: '物料分类',
  //   prop: 'materialsGroupCode',
  //   width: 120,
  // },
  // {
  //   label: '规格型号',
  //   prop: 'specifications',
  //   width: 120,
  // },
  // {
  //   label: '材质',
  //   prop: 'textureOfMaterial',
  //   width: 120,
  // },
  // {
  //   label: '图号',
  //   prop: 'drawingNo',
  //   width: 120,
  // },
  // {
  //   label: '在库数量',
  //   prop: 'inStockQuantity',
  //   width: 200,
  // },
  // {
  //   label: '已盘点数量',
  //   prop: 'inventoryQuantity',
  //   width: 120,
  // },
  // {
  //   label: '差异',
  //   prop: 'diffQuantity',
  //   width: 120,
  // },

  // {
  //   label: '过账日期',
  //   prop: 'postingDate',
  //   render: ({ row }) =>
  //     row.postingDate ? moment(row.postingDate).format('YYYY-MM-DD HH:mm:ss') : '-',
  // },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParam.value.documentPostType = props.params?.documentPostType ?? '';
      initParam.value.documentStatus = props.params?.documentStatus ?? '';
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
