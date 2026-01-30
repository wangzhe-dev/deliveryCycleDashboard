<template>
  <el-dialog append-to-body title="选择工艺路线" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        :init-param="props.params"
        label-width="110px"
        :toolButton="false"
        rowKey="routeCode"
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

<script setup lang="jsx" name="ProcessRouteDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  checkType: {
    type: String,
    default: 'selection',
  },
  params: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);

const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    prop: 'routeCode',
    label: '工艺路线编码',
    search: { el: 'input', props: { filterable: true } }, // TODO: 暂不支持
    // width: 250
  },
  {
    prop: 'routeName',
    label: '工艺路线名称',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'routeDesc',
    label: '工艺路线描述',
  },
  {
    prop: 'routeType',
    label: '工艺路线类型',
    enum: () => proxy.useColumnsDict('route_type'),
  },
  {
    prop: 'isEnable',
    enum: () => proxy.useColumnsDict('is_enable'),
    label: '是否启用',
    search: { el: 'select', props: { filterable: true } },
  },
  // { prop: 'operation', label: '操作', fixed: 'right', width: 150 }
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
    proxy.showWarning('请选择工艺路线');
  }
  console.log(list, 'list');
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
