<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2025-03-05 14:03:26
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 固资卡片弹窗
-->
<template>
  <el-dialog append-to-body title="选择固资卡片" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="80px"
        :toolButton="false"
        rowKey="id"
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

<script setup lang="jsx" name="AssetsCardListDialog">
import {
  loadList,
  companyInfo, //公司
  assetsclass, //分类
  costDepartment, //成本中心
  employee, //人员
} from './services';
import moment from 'moment';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
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
const treeData = ref([]);

const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    prop: 'assetsNo',
    label: '资产编号',
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-input vModel_trim={searchParam.assetsNoStart} placeholder="请输入" />
            <span class="mr10 ml10">到</span>
            <el-input vModel_trim={searchParam.assetsNoEnd} placeholder="请输入" />
          </div>
        );
      },
    },
    // width: 200
  },
  {
    prop: 'companyCode',
    label: '公司代码',
    enum: companyInfo,
    fieldNames: { label: 'companyName', value: 'companyCode' },
    search: {
      el: 'select',
      props: { filterable: true },
    },
    width: 180,
  },
  {
    label: '资产描述',
    prop: 'des',
    search: {
      el: 'input',
    },
  },
  {
    label: '资产分类',
    prop: 'assetClass',
    enum: assetsclass,
    fieldNames: { label: 'des', value: 'classNo' },
    search: {
      el: 'select',
      props: { filterable: true },
    },
  },
  {
    label: '成本中心',
    prop: 'costCenter',
    enum: costDepartment,
    fieldNames: { label: 'fullName', value: 'costCenterCode' },
    search: {
      el: 'select',
      props: { filterable: true },
    },
  },
  {
    label: '资产创建日期',
    prop: 'createdTime',
    render: ({ row }) => moment(row.createdTime).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    label: '使用人',
    prop: 'userName',
    enum: employee,
    fieldNames: { label: 'employeeName', value: 'employeeNumber' },
    search: {
      el: 'select',
      props: { filterable: true },
    },
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      wsllTable.value?.refresh();
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
    proxy.showWarning('请选择资产卡片');
  }
  console.log(list, 'list');
};

// 请求树
const getTreeData = async () => {
  try {
    const { code, data } = await loadTreeList({});
    if (code === 200) {
      treeData.value = proxy.formatTree(
        data,
        'name', // 名称
        'children', // 子节点
      );
    }
    console.log(treeData.value, 'treeData----');
  } catch (e) {
    treeData.value = [];
  }
};

getTreeData();

const close = () => {
  // wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
