<template>
  <el-dialog
    title="请选择工具"
    v-model="open"
    width="95%"
    append-to-body
    @close="cancel"
    :close-on-click-modal="false"
  >
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadListFn"
        label-width="80px"
        rowKey="toolCode"
        :toolButton="false"
      >
        <template #expand="scope">
          <WsllTable
            :columns="listColumns"
            :data="scope.row?.lineList || []"
            :pagination="false"
            :toolButton="false"
            row-key="toolUniqueKey"
            :ref="(el) => getRefList(el, scope.$index)"
          />
        </template>
      </WsllTable>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="getSelectFn">保 存</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="jsx" name="ToolMasterData">
import { loadList } from './services';
import _ from 'lodash';
const props = defineProps({
  defaultParam: {
    type: Object,
    default: {},
  },
});
const emit = defineEmits(['setData']);

const open = ref(false);
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const tableRefList = ref([]);
const getRefList = (el, index) => {
  if (el) {
    tableRefList.value[index] = el;
  }
};
const columns = reactive([
  { type: 'expand', label: '', width: 100 },
  {
    prop: 'toolCode',
    label: '工具编码',
    width: '210',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'toolName',
    label: '工具名称',
    width: '210',
    search: { el: 'input', props: { filterable: true } },
  },
  {
    prop: 'factoryName',
    label: '工厂',
  },
  {
    prop: 'warehouseName',
    label: '仓库',
  },

  {
    prop: 'locationName',
    label: '库位',
  },
  // {
  //   prop: 'categoryName',
  //   label: '工具类型',
  // },
  {
    prop: 'quantity',
    label: '数量',
  },
  {
    prop: 'any',
    label: '单位',
    render: () => '个',
  },
]);

const listColumns = reactive([
  { type: 'selection', fixed: 'left', width: 90 },
  { type: 'index', label: '序号', width: 210 },
  { prop: 'toolUniqueKey', label: '唯一标识', width: 210 },
]);

async function loadListFn(params) {
  try {
    const { data } = await loadList({ ...params, ...props.defaultParam });
    data.list.forEach((item) => {
      item.lineList.forEach((i) => {
        i.factoryCode = item.factoryCode;
        i.factoryName = item.factoryName;
        i.categoryCode = item.categoryCode;
        i.categoryName = item.categoryName;
        i.locationCode = item.locationCode;
        i.locationName = item.locationName;
        i.toolCode = item.toolCode;
        i.toolName = item.toolName;
        i.warehouseCode = item.warehouseCode;
        i.warehouseName = item.warehouseName;
      });
    });
    return {
      records: data.list,
      size: data.pageSize,
      total: data.total,
      current: data.pageNum,
    };
  } catch (e) {
    return {
      records: [],
      size: 20,
      total: 0,
      current: 1,
    };
  }
}
const getSelectFn = () => {
  let selectArr = [];
  tableRefList.value.forEach((item) => {
    console.log(item.selectedList);
    console.log('909090');

    selectArr = selectArr.concat(_.cloneDeep(item.selectedList));
  });
  console.log(selectArr);
  console.log('-=-=-=-=');

  if (selectArr && selectArr.length > 0) {
    emit('setData', selectArr);
    cancel();
  } else {
    proxy.showWarning('请选择工具！');
  }
};
function cancel() {
  open.value = false;
}

const openDialog = () => {
  open.value = true;
};

defineExpose({
  openDialog,
});
</script>
<style lang="scss">
.panel-num-card {
  display: grid;
  grid-template-columns: 24% 24% 24% 24%;
  gap: 10px;
  justify-content: space-around;
  background-color: #fbfbfb;

  & > dl {
    padding: 10px 0;
    text-align: center;
    /* background: linear-gradient(); */
    /* background-image: linear-gradient(45deg, #FFF 0%, #409EFF 100%); */
    cursor: pointer;
    box-shadow: 0 0 5px 1px #ccc;
    border-radius: 4px;
    dt {
      /* padding-bottom: 10px; */
      font-size: 36px;
      font-weight: bold;
    }

    dd {
      margin: 0;
      font-size: 16px;
    }
  }
}
</style>
import { stringifyQuery } from 'vue-router';import { cloneDeep } from 'lodash';, { forEach }, {
concat }, { cloneDeep }, { forEach }, { forEach }
