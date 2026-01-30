<template>
  <el-dialog append-to-body title="库存数量" v-model="visible" width="80vw" @close="close">
    <div class="wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :data="tableData"
        label-width="80px"
        :toolButton="false"
        :pagination="false"
        rowKey="materialsCode"
        @radioChange="tableRadioChange"
      />
    </div>
    <template #footer>
      <el-button @click="close">确定</el-button>
      <!-- <el-button type="primary" @click="confirm" v-if="props.checkType === 'selection'">
        确定
      </el-button> -->
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="SearchInventoryQuantity">
import { loadList } from './services';
import { assignFormData } from '@/utils/utils';
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
    default: () => [],
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
// const initParams = ref({
//   materialsCode: '',
//   materialsName: ''
// });

const columns = reactive([
  // {
  //   type: props.checkType,
  //   fixed: 'left',
  //   width: 40,
  // },
  {
    label: '物料编号',
    prop: 'materialsCode',
    fixed: 'left',
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '物料名称',
    prop: 'materialsName',
    // search: {
    //   el: 'input',
    // },
  },
  {
    label: '工厂',
    prop: 'factoryName',
    render: ({ row }) => row.factoryName || row.factoryCode,
    // enum: () => proxy.useColumnsDict('factory'),
    // search: {
    //   el: 'select',
    //   props: { filterable: true },
    // },
  },
  {
    label: '仓库',
    prop: 'stockLocationName',
    render: ({ row }) => row.stockLocationName || row.stockLocationCode,
  },
  {
    label: '库位',
    prop: 'locationName',
  },
  {
    label: '库存数量',
    prop: 'inventoryQuantity',
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      // assignFormData(initParams.value, props.params)
      fetchData();
      // console.log(initParams.value, props.params, '----')
      // wsllTable.value?.refresh();
      // wsllTable.value?.clearSelection();
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
const tableData = ref([]);
async function fetchData() {
  try {
    const { code, data } = await loadList(props.params);
    tableData.value = data;
  } catch (e) {
    tableData.value = [];
  }
}
</script>
