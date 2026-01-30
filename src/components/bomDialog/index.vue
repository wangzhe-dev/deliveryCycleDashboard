<template>
  <el-dialog append-to-body title="选择BOM" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        row-key="id"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        lazy
        :load="load"
        @radioChange="tableRadioChange"
      ></WsllTable>
    </div>
  </el-dialog>
</template>

<script setup lang="jsx" name="bomDialog">
import { loadList, loadBomList } from './services';
import MaterialMasterModal from '@/components/MaterialMasterModal/index';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: 'radio', fixed: 'left', width: 40 },
  {
    prop: 'projectCode',
    label: '项目号',
    width: '180',
    search: {
      el: 'input',
    },
  },
  {
    prop: 'block',
    label: '分段号',
    search: {
      el: 'input',
    },
  },
  {
    label: '',
    prop: 'searchFlag',
    width: 60,
    align: 'center',
  },
  {
    prop: 'materialsCode',
    label: '物料编号',
    width: 170,
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <MaterialMasterModal v-model={searchParam.materialsCode} />
          </div>
        );
      },
    },
  },
  {
    prop: 'materialsName',
    label: '物料名称',
    width: 120,
  },
  {
    prop: 'version',
    label: '版本号',
    width: 90,
  },
  {
    prop: 'materialsQuantity',
    label: '数量',
  },
  {
    prop: 'specifications',
    label: '规格',
  },
  {
    prop: 'flowcode1',
    label: '1级流向',
    search: {
      el: 'input',
    },
  },

  {
    prop: 'flowcode2',
    label: '2级流向',
    search: {
      el: 'input',
    },
  },
  {
    prop: 'weight',
    label: '重量',
    width: 100,
  },
]);
const load = (row, treeNode, resolve) => {
  if (wsllTable.value.searchParam.materialsCode) {
    resolve(row.children || []);
    return;
  }
  loadBomList({ materialsCode: row.materialsCode }).then(({ data }) => {
    resolve(data);
  });
};
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      wsllTable.value?.refresh();
    }
  },
  { deep: true, immediate: true },
);

const tableRadioChange = (v, row) => {
  emit('submit', row);
  close();
};

const close = () => {
  wsllTable.value?.clearRadio();
  emit('update:modelValue', false);
};
</script>
