<!--
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:05:54
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2025-01-10 16:40:36
 * @Description: 选择质检填报单
-->
<template>
  <el-dialog append-to-body title="选择质检填报单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable ref="wsllTable" highlight-current-row :columns="columns" :request-api="loadList" label-width="140px"
        :toolButton="false" rowKey="fillinOrder" :initParam="initParams" @radioChange="tableRadioChange" />
    </div>
    <template #footer>
      <el-button @click="close" v-if="props.checkType === 'selection'">取消</el-button>
      <el-button type="primary" @click="confirm" v-if="props.checkType === 'selection'">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="ProcessOrderListDialog">
  import { loadList, routeStepLoadList } from './services';
  import dayjs from 'dayjs';
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

  import moment from 'moment'
  const emit = defineEmits();
  const { proxy } = getCurrentInstance();
  const wsllTable = ref(null);
  const visible = ref(false);
  const initParams = ref({
    // documentStatus: "1"
  });


const stepList = ref([]);
function getStepList() {
  stepList.value = [];
  routeStepLoadList().then((res) => {
    if (res.data && res.data.length > 0) {
      res.data.forEach((i) => {
        stepList.value.push({ value: i.stepCode, label: i.stepName });
      });
    }
  });
}
getStepList();


  const columns = reactive([
    {
      type: 'radio',
      width: 40,
    },
  {
    prop: 'fillinOrder',
    label: '质检单号',
    width: 160,
    search: { el: 'input', order: 2 },
  },
  {
    prop: 'applicationOrder',
    label: '计划单号',
    width: 160,
  },
  {
    prop: 'qualityTypeCode',
    label: '检验类型',
    width: 90,
    enum: () => proxy.useColumnsDict('rule_type'),
    search: { el: 'select', order: 4 },
  },
  {
    prop: 'fillinStatus',
    label: '质检状态',
    width: 90,
    // 1 创建 2 质检中 3 完成
    enum: [{ value: '1', label: '创建' }, { value: '2', label: '质检中' }, { value: '3', label: '完成' }],
    search: { el: 'select' },
  },
  {
    prop: 'productionName',
    label: '产线',
    minWidth: 160,
  },
  {
    label: '工序',
    prop: 'processesId',
    enum: stepList,
    search: { el: 'select', order: 1 },
    minWidth: '140',
    isShow: false,
    render: ({ row }) => row.processesName,
  },
  {
    prop: 'departmentName',
    label: '部门',
    minWidth: 160,
  },
  {
    prop: 'teamGroupName',
    label: '班组',
    minWidth: 160,
  },
  {
    prop: 'shipNumber',
    label: '船号',
    width: 160,
    search: { el: 'input', order: 3 },
  },
  {
    prop: 'sectionNumber',
    label: '分段号',
    width: 160,
  },
  {
    prop: 'assemblyUnitNumber',
    label: '部件号',
    width: 160,
  },
  {
    prop: 'partNumber',
    label: '零件号',
    width: 160,
  },
  {
    prop: 'flawDetectionName',
    label: '探伤员',
    width: 90,
  },
  {
    prop: 'checkoutName',
    label: '检验员',
    width: 90,
  },
  {
    prop: 'checkoutDate',
    label: '检验时间',
    width: 160,
    render: ({ row }) => row.checkoutDate ? dayjs(row.checkoutDate).format('YYYY-MM-DD HH:mm:ss') : '',
  },
  {
    prop: 'createdTime',
    label: '创建时间',
    width: 160,
    render: ({ row }) => row.createdTime ? dayjs(row.createdTime).format('YYYY-MM-DD HH:mm:ss') : '',
  },
    // {
    //   prop: 'remark',
    //   label: '备注',
    //   width: 250,
    // },

    // { prop: 'operation', label: '操作', fixed: 'right', width: 160 },
  ]);
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
      if (val) {
        // wsllTable.value?.refresh();
        initParams.value = props.params;
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
      proxy.showWarning('请选择质检填报单');
    }
    console.log(list, 'list');
  };

  const close = () => {
    wsllTable.value.clearRadio()
    emit('update:modelValue', false);
  };
</script>