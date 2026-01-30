<template>
  <el-dialog append-to-body title="选择人员" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="80px"
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

<script setup lang="jsx" name="PersonnelDialog">
import { loadList, getDepartmentList } from './services';
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
    prop: 'employeeNumber',
    label: '员工编码',
    search: {
      el: 'input',
    },
    minWidth: '100',
  },
  { prop: 'employeeName', label: '员工姓名', search: { el: 'input' }, minWidth: '100' },
  {
    prop: 'departmentId',
    label: '所属部门',
    enum: getDepartmentList,
    fieldNames: { label: 'fullName', value: 'costCenterCode' },
    search: {
      el: 'tree-select',
      props: {
        filterable: true,
        'check-strictly': true,
      },
    },
    minWidth: '100',
    isShow: false,
  },
  {
    prop: 'departmentName',
    label: '所属部门',
    minWidth: '100',
  },
  {
    prop: 'qtName',
    label: '岗位',
    minWidth: '100',
  },
  {
    prop: 'telephone',
    label: '电话',
    minWidth: '100',
  },
  {
    prop: 'mobilePhone',
    label: '移动电话',
    minWidth: '100',
  },
  {
    prop: 'mailbox',
    label: '邮箱',
    minWidth: '100',
  },
  {
    prop: 'address',
    label: '地址',
    minWidth: '100',
  },
  {
    prop: 'state',
    label: '状态',
    enum: [
      { label: '在职', value: '1' },
      { label: '离职', value: '0' },
    ],
    search: { el: 'select', defaultValue: '1', props: { filterable: true }, minWidth: '100' },
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
    proxy.showWarning('请选择人员');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
