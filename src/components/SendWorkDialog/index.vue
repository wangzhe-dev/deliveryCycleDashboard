<template>
  <el-dialog
    title="派工任务"
    v-model="open"
    width="80vw"
    append-to-body
    @close="cancel"
    :close-on-click-modal="false"
  >
    <div>
      <el-descriptions class="mb-10" :column="4" border>
        <el-descriptions-item label="工序编号">
          {{ formData.processNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="工序名称">
          {{ formData.processName }}
        </el-descriptions-item>
        <el-descriptions-item label="工序内容">
          {{ formData.processContent }}
        </el-descriptions-item>
        <el-descriptions-item label="是否转委外">
          {{ formData.outsourcingFlag === '1' ? '是' : '否' }}
        </el-descriptions-item>
      </el-descriptions>
      <WsllTable
        ref="wsllTable"
        :toolButton="false"
        highlight-current-row
        :columns="columns"
        height="40vh"
        rowKey="id"
        :data="tableData"
        :pagination="false"
        @current-change="handleCurrentChange"
      >
        <!-- 表格 header 按钮 -->
        <template #tableHeader>
          <el-button v-if="isEdit" type="primary" plain @click="handleAdd">新增</el-button>
          <!-- <el-button plain @click="refreshList">刷新</el-button> -->
        </template>
        <template #operation="scope">
          <el-button type="primary" link icon="Edit" plain @click="handleUpdate(scope.row)">
            修改
          </el-button>
          <el-button link icon="Delete" type="danger" @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </WsllTable>
      <SendWorkAEDialog ref="aEDialog" @refresh="refreshAE" />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">{{ isEdit ? '取 消' : '关 闭' }}</el-button>
        <el-button v-if="isEdit" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup name="SendWorkDialog">
import SendWorkAEDialog from './SendWorkAEDialog';
import { assignFormData } from '@/utils/utils';
import {
  dispatchBatchAdd,
  dispatchBatchUpdate,
  dispatchDel,
  findByProcessNumberCode,
} from './services';
import _ from 'lodash';
const emit = defineEmits(['refresh']);
const props = defineProps({
  mainData: {
    type: Object,
    default: () => ({}),
  },
});
const aEDialog = ref(null);
const type = ref('');
const open = ref(false);
const wsllTable = ref(null);
let cloneData = {};
const { proxy } = getCurrentInstance();

const columns = reactive([
  {
    prop: 'productionLineCode',
    label: '产线编码',
  },
  {
    prop: 'productionLineName',
    label: '产线名称',
  },
  {
    prop: 'planEquipmentCode',
    label: '设备编码',
  },
  {
    prop: 'planEquipmentName',
    label: '设备名称',
  },
  {
    prop: 'workGroupName',
    label: '班组',
  },
  {
    prop: 'planUserName',
    label: '责任人',
  },
  {
    prop: 'planQty',
    label: '计划产量',
  },
  {
    prop: 'finishedQty',
    label: '完成量',
  },
  { prop: 'operation', isShow: true, label: '操作', fixed: 'right', width: 150 },
]);

const tableData = ref([]);
const curSelectedRow = ref({ id: '' });
const formData = reactive({
  processNumber: '-',
  processName: '-',
  processContent: '-',
  outsourcingFlag: '',
  processNumberId: '',
});

const isEdit = ref(true);

const handleCurrentChange = () => {};

/** 新增按钮操作 */
const handleAdd = () => {
  let area = {
    productionWorkshopCode: cloneData?.mainData?.productionWorkshopCode,
    productionWorkshopId: cloneData?.mainData?.productionWorkshopId,
    productionWorkshopName: cloneData?.mainData?.productionWorkshop,
  };
  aEDialog.value.openDialog('add', {}, formData.outsourcingFlag, area);
};

const handleUpdate = (row) => {
  let area = {
    productionWorkshopCode: cloneData?.mainData?.productionWorkshopCode,
    productionWorkshopId: cloneData?.mainData?.productionWorkshopId,
    productionWorkshopName: cloneData?.mainData?.productionWorkshop,
  };
  aEDialog.value.openDialog('edit', row, formData.outsourcingFlag, area);
};

/** 解除按钮操作 */
const handleDelete = (row) => {
  const id = row.id;
  proxy.$modal
    .confirm('是否确认删除数据项？')
    .then(function () {
      dispatchDel([row.id]).then(() => {
        tableData.value = tableData.value.filter((it) => it.id !== row.id);
      });
      return true;
    })
    .then((res) => {
      proxy.$modal.msgSuccess('删除成功');
      refreshList();
    })
    .catch(() => {});
};

/** 刷新列表 */
const refreshList = (type) => {
  type === 'add' ? wsllTable.value?.refresh() : wsllTable.value?.loadData();
};

const openDialog = (key, row) => {
  open.value = true;
  type.value = key;
  cloneData = _.cloneDeep(row);
  nextTick(() => {
    assignFormData(formData, cloneData || {});
    getList();
  });
  if (key === 'edit') {
    isEdit.value = true;
  }
  if (key === 'view') {
    isEdit.value = false;
    columns[columns.length - 1].isShow = false;
  }
};

async function getList() {
  try {
    const { code, data } = await findByProcessNumberCode({
      ...formData,
      ...(cloneData?.mainData ?? {}),
      // planEquipmentCode: '',
      // planOrderNumber: '',
      // workOrder: '',
      // processNumber: '',
      processNumberId: cloneData.id,
    });
    tableData.value = data;
  } catch (e) {
    tableData.value = [];
  }
}

/** 表单重置 */
const reset = () => {
  cloneData = {};
  tableData.value = [];
  Object.keys(formData).forEach((k) => {
    formData[k] = k === 'outsourcingFlag' ? '' : '-';
  });
  columns[columns.length - 1].isShow = true;
  isEdit.value = true;
};
/** 取消按钮 */
const cancel = () => {
  open.value = false;
  reset();
};
/** 提交按钮 */
const submitForm = async () => {
  // TODO 判断id类型删除id
  const newList = tableData.value.map((it) => {
    return typeof it.id === 'number' ? { ...it, id: null } : it;
  });
  // type.value === 'edit' ? dispatchBatchUpdate :
  const fn = dispatchBatchAdd;
  try {
    const { code, data, msg } = await fn(newList);
    if (code === 200) {
      proxy.showSuccess(msg);
      cancel();
      emit('refresh');
    }
  } catch (e) {}
};

// 编辑
const refreshAE = (type, newRow) => {
  if (type === 'edit') {
    tableData.value.forEach((it) => {
      if (it.id === newRow.id) {
        it.planUserId = '';
        it.planUserName = '';

        it.workGroupName = '';
        it.workGroupId = '';
        it.workGroup = '';

        it.planEquipmentName = '';
        it.planEquipmentCode = '';

        it.productionLineName = '';
        it.productionLineCode = '';
        it.lineId = '';
        assignFormData(it, newRow);
      }
    });
  } else {
    tableData.value.unshift({
      ...newRow,
      ...formData,
      processNumberId: cloneData.id,
      ...{ ...(cloneData?.mainData ?? {}), id: null },
      createdTime: '',
      updatedTime: '',
      id: +String(Math.random()).slice(-6),
    });
  }
  wsllTable.value?.refresh();
};

defineExpose({
  openDialog,
});
</script>
