<template>
  <el-drawer
    v-model="visible"
    @close="close"
    direction="rtl"
    size="40vw"
    class="wsll-table"
    title="维护序列号"
    append-to-body
  >
    <div class="text-right"></div>
    <el-descriptions title="" :column="3" border>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">单据编号</div>
        </template>
        {{ basicData.documentNo }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">明细行号</div>
        </template>
        {{ basicData.lineNumber }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">项目批号</div>
        </template>
        {{ basicData.batchNumber }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">物料编号</div>
        </template>
        {{ basicData.materialsCode }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">序列号数量</div>
        </template>
        {{ basicData.quantity }}
      </el-descriptions-item>
    </el-descriptions>
    <el-row class="mb-10 mt10">
      <el-col :span="10">
        <el-input v-model="serialVal" placeholder="请输入序列号回生成" @keyup.enter="handleEnter" />
      </el-col>
      <el-col class="text-right" :span="14">
        <el-button plain @click="toggleSerialNumVisible(true)">选择</el-button>
        <el-button plain @click="autoCreateSerialNumber">自动生成</el-button>
        <el-button type="primary" plain @click="submit">保存</el-button>
      </el-col>
    </el-row>
    <WsllTable
      ref="wsllTable"
      :toolButton="false"
      highlight-current-row
      :columns="columns"
      :data="tableData"
      rowKey="serialNumber"
      height="65vh"
      :pagination="false"
    >
      <template #operation="scope">
        <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">
          删除
        </el-button>
      </template>
    </WsllTable>

    <SerialNumDialog v-model="serialNumVisible" :params="basicData" @submit="serialNumSubmit" />
  </el-drawer>
</template>
<script setup lang="jsx" name="updateRecordDrawer">
import { mapValueToLabel, assignFormData } from '@/utils/utils';
import SerialNumDialog from '@/components/SerialNumDialog';
import { findBySerialNumber, createSerialNumber } from './services';
const { proxy } = getCurrentInstance();
const emit = defineEmits();
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
});

const initBasic = () => ({
  documentNo: '-',
  lineNumber: '-',
  batchNumber: '-',
  materialsCode: '-',
  quantity: '-',
});

const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: 'index', fixed: 'left', width: 80 },
  {
    prop: 'serialNumber',
    label: '序列号',
  },
  {
    prop: 'operation',
    label: '操作',
    fixed: 'right',
    width: 100,
  },
]);
const tableData = ref([]);
const basicData = ref(initBasic());

const serialNumVisible = ref(false);
const serialVal = ref('');

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;

    if (val) {
      assignFormData(basicData.value, props.params);
      tableData.value = props.params.serialNoLineList || [];
      wsllTable.value?.refresh();
      wsllTable.value?.clearSelection();
    }
  },
  { deep: true, immediate: true },
);

function open() {
  emit('update:modelValue', true);
}

function close() {
  emit('update:modelValue', false);
  basicData.value = initBasic();
}

function toggleSerialNumVisible(v = false) {
  serialNumVisible.value = v;
}

function serialNumSubmit(rows) {
  const exitSerial = tableData.value.map((it) => it.serialNumber);

  const pushSerial = rows.filter((it) => !exitSerial.includes(it.serialNumber));

  const pushNum = basicData.value.quantity - tableData.value.length;

  tableData.value = [...tableData.value, ...pushSerial.slice(0, pushNum)];
}

// 回车验证
async function handleEnter() {
  try {
    const { code, data } = await findBySerialNumber({ serialNumber: serialVal.value });
    if (!data) {
      proxy.showWarning('所输入序列号不可用');
      serialVal.value = '';
      return;
    }

    const exit = tableData.value.find((it) => it.serialNumber === data.serialNumber);
    if (exit) {
      proxy.showWarning('请勿添加重复的序列号');
      return;
    }

    tableData.value.push(data);
  } catch (e) {}
}

// 自动生成
async function autoCreateSerialNumber() {
  const quantity = basicData.value.quantity - tableData.value.length;

  if (quantity <= 0) {
    proxy.showWarning('已达最大数量');
    return;
  }

  try {
    const { code, data } = await createSerialNumber({ quantity });
    console.log(data, 'data----');
    const nData = data.map((serialNumber) => ({ serialNumber }));
    tableData.value = [...tableData.value, ...nData];
  } catch (e) {}
}

/** 删除按钮操作 */
function handleDelete(row) {
  proxy.$modal
    .confirm('是否确认删除序列号？')
    .then(() => {
      tableData.value = tableData.value.filter((it) => it.serialNumber !== row.serialNumber);
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

function submit() {
  emit('submit', tableData.value);
  close();
}

defineExpose({
  open,
  close,
});
</script>
