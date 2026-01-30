<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2025-01-06 17:36:30
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 设备弹窗
-->
<template>
  <el-dialog append-to-body title="选择设备" v-model="visible" width="80vw" @close="close">
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
      <el-button type="primary" @click="confirm" v-if="props.checkType === 'selection'">
        确定
      </el-button>
      <el-button @click="close" v-if="props.checkType === 'selection'">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="EquipmentListDialog">
import { loadList, loadTreeList } from './services';
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
    label: '上级组织',
    prop: 'factoryName',
    width: 150,
    search: {
      // 自定义 search 显示内容
      /* multiple，show-checkbox */
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-tree-select
              v-model={searchParam.factoryId}
              data={treeData.value}
              props={{ value: 'id', label: 'name', children: 'children' }}
              value-key="id"
              placeholder="请选择"
              clearable
            />
          </div>
        );
      },
    },
  },
  {
    label: '设备编码',
    prop: 'equipmentCode',
    width: 150,
    search: {
      el: 'input',
    },
  },
  {
    label: '设备名称',
    prop: 'equipmentName',
    width: 150,
    search: {
      el: 'input',
    },
  },
  {
    label: '设备型号',
    prop: 'equipmentModel',
    width: 150,
  },
  {
    label: '设备类型',
    prop: 'equipmentTypeName',
    width: 150,
    search: {
      el: 'input',
    },
  },
  {
    label: '设备状态',
    prop: 'equipmentStatus',
    width: 150,
    enum: () => proxy.useColumnsDict('using_status'),
  },
  {
    label: '供应商',
    prop: 'supplierName',
    width: 150,
  },
  {
    label: '供应商联系方式',
    prop: 'supplierIphone',
    width: 150,
  },
  {
    label: '制造商',
    prop: 'manufacturerName',
    width: 150,
  },
  {
    label: '制造商联系方式',
    prop: 'manufacturerIphone',
    width: 150,
  },
  {
    label: '出厂编号',
    prop: 'initializeCode',
    width: 150,
  },
  {
    label: '出厂日期',
    prop: 'initializeTime',
    width: 150,
  },
  {
    label: '保修日期',
    prop: 'warrantyTime',
    width: 150,
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
    proxy.showWarning('请选择设备');
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
