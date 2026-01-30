<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-03-18 15:22:39
 * @Description: 托盘管理弹窗
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
        rowKey="trayNumber"
        :toolButton="false"
        :initParam="initParam"
        @radioChange="tableRadioChange"
      >
        <template #expand="scope">
          <WsllTable
            :columns="listColumns"
            :data="scope.row?.list || []"
            :pagination="false"
            :toolButton="false"
          />
        </template>
      </WsllTable>
    </div>
    <template #footer>
      <el-button @click="close" v-if="props.checkType === 'selection'">取消</el-button>
      <el-button type="primary" @click="confirm" v-if="props.checkType === 'selection'">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="PalletManageDialog">
import { loadList } from './services';
import FactorySelect from '@/components/FactorySelect';
import LocationSelect from '@/components/LocationSelect';
import WarehouseSelect from '@/components/WarehouseSelect';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择托盘',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'selection',
  },
  cbClose: {
    type: Boolean,
    default: false,
  },
});
const initParam = ref({});
const { cbClose } = props;

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: props.checkType, fixed: 'left', width: 40 },
  { type: 'expand', label: '', width: 100 },
  {
    label: '工厂',
    prop: 'factoryCode',
    minWidth: 120,
    render: ({ row }) => {
      return row.factoryName;
    },
  },
  {
    label: '仓库',
    prop: 'stockLocationCode',
    minWidth: 120,
    render: ({ row }) => row.stockLocationName || row.stockLocationCode,
  },
  {
    label: '库位',
    prop: 'locationCode',
    minWidth: 120,
    render: ({ row }) => row.locationName || row.locationCode,
  },
  {
    prop: 'trayNumber',
    label: '托盘编码',
    width: 180,
    search: { el: 'input' },
  },
  {
    prop: 'trayName',
    label: '托盘名称',
    width: 180,
  },
]);

const listColumns = reactive([
  {
    prop: 'materialsNumber',
    label: '物料编号',
    minWidth: 120,
  },
  {
    prop: 'materialsName',
    label: '物料名称',
    minWidth: 120,
  },
  {
    prop: 'quantity',
    label: '数量',
    minWidth: 80,
  },
  {
    prop: 'createdTime',
    label: '创建时间',
    width: 180,
  },
  {
    prop: 'updatedTime',
    label: '修改时间',
    width: 180,
  },
]);

// 工厂改变
function factoryChange(v, searchParam) {
  searchParam.stockLocationCode = '';
  searchParam.locationCode = '';
}

// 仓库
function stockLocationCodeChange(v, searchParam) {
  searchParam.locationCode = '';
}

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
  emit('submit', row, () => close());
  !cbClose && close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;

  if (list.length) {
    emit('submit', list, () => close());
    !cbClose && close();
  } else {
    proxy.showWarning('请选择托盘');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
