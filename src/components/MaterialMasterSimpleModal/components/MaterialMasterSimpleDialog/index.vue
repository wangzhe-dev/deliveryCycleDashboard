<template>
  <el-dialog append-to-body title="选择物料" v-model="visible" width="70vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="100px"
        :toolButton="false"
        rowKey="materialsCode"
        :initParam="initParams"
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

<script setup lang="jsx" name="MaterialMasterSimpleDialog">
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
    default: () => ({}),
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const initParams = ref({});
const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  {
    label: '物料编号',
    width: 180,
    prop: 'materialsCode',
    search: {
      order: 1,
      el: 'input',
      props: { clearable: true },
    },
  },
  {
    label: '物料名称',
    width: 180,
    prop: 'materialsName',
    search: {
      order: 2,
      el: 'input',
      props: { clearable: true },
    },
  },
  {
    label: '规格',
    width: 160,
    prop: 'specifications',
  },
  {
    label: '加工',
    width: 160,
    prop: 'process',
  },
  {
    label: '打磨',
    width: 160,
    prop: 'polish',
  },
  {
    label: '零件类型',
    width: 160,
    prop: 'partType',
    enum: () => proxy.useColumnsDict('part_type'),
  },
  {
    label: '型材长度',
    width: 160,
    prop: 'profileLength',
  },
  {
    label: '材质',
    width: 160,
    prop: 'textureOfMaterial',
  },
  {
    label: '重量',
    width: 160,
    prop: 'weight',
  },
  {
    label: '切割图号',
    width: 160,
    prop: 'drawingNo',
  },
  {
    label: '特殊类型',
    width: 160,
    prop: 'specialType',
    enum: () => proxy.useColumnsDict('special_type'),
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      initParams.value = props.params;
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
    proxy.showWarning('请选择物料');
  }
};

const close = () => {
  wsllTable.value?.clearRadio();
  wsllTable.value?.clearSelection();
  emit('update:modelValue', false);
};
</script>
