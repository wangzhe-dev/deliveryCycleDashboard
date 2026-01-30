<!--
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:05:54
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2025-01-13 14:12:46
 * @Description: 质检计划单
-->
<template>
  <el-dialog append-to-body title="选择质检计划单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable ref="wsllTable" highlight-current-row :columns="columns" :request-api="loadList" label-width="140px"
        :toolButton="false" rowKey="documentNumber" :initParam="initParams" @radioChange="tableRadioChange" />
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
  import { loadList, getFactoryTreeBZ } from './services';

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
    documentStatus: "1"
  });
  const columns = reactive([
    {
      type: 'radio'
    },
    {
    label: '计划单号',
    minWidth: 150,
    prop: 'documentNumber',
  },

  {
    label: '质检类型',
    minWidth: '100',
    prop: 'qualityCheckType',
    enum: () => proxy.useColumnsDict('rule_type'),
  },
  {
    label: '产线',
    minWidth: 200,
    prop: 'productionLineName',
  },
  {
    label: '工序',
    minWidth: 150,
    prop: 'processName',
  },
  {
    label: '船号',
    minWidth: 150,
    prop: 'shipNumber',
    search: {
      el: 'input',
    },
  },

  {
    label: '分段号',
    prop: 'sectionNumber',
    minWidth: '150',
    search: {
      el: 'input',
    },
  },
  {
    label: '部件号',
    minWidth: 150,
    prop: 'partNumber',
  },
  {
    label: '生产部门',
    prop: 'productionDeptName',
    minWidth: '150',
  },
  {
    label: '探伤类别/检测方法',
    prop: 'inspectionCategory',
    minWidth: '150',
    enum: () => proxy.useColumnsDict('detection_method'),
    search: {
      el: 'select',
      'label-width': '200px',
    },
  },
  {
    label: '检测类别',
    prop: 'inspectionType',
    minWidth: '100',
    enum: () => proxy.useColumnsDict('check_method'),
  },
  {
    label: '检测项目',
    prop: 'inspectionItemName',
    minWidth: '150',
  },
  {
    label: '检测地点',
    prop: 'inspectionLocation',
    minWidth: '150',
    enum: () => proxy.useColumnsDict('inspection_location'),
  },
  {
    label: '探伤次数',
    prop: 'inspectionCount',
    minWidth: '100',
  },
  {
    label: '班组',
    prop: 'groupCode',
    minWidth: '150',
    search: {
      el: 'select',
    },
    enum: getFactoryTreeBZ,
    fieldNames: { label: 'name', value: 'code' },
    search: {
      el: 'select',
    },
    minWidth: '100',
  },
  {
    label: '班组质检员',
    prop: 'groupInspectorName',
    minWidth: '160',
  },
  {
    label: '计划执行日期',
    minWidth: '160',
    prop: 'planExecutionDate',
    search: {
      el: 'date-picker',
      props: {
        type: 'date',
        'value-format': 'x',
      },
    },
    render: ({ row }) => moment(row.planExecutionDate).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    label: '手机号',
    prop: 'phoneNumber',
    minWidth: '130',
  },
  {
    label: '探伤员',
    prop: 'inspectionStaffName',
    minWidth: '100',
  },
  {
    label: '质检单号',
    prop: 'qualityCheckOrderCode',
    minWidth: '160',
  },
  {
    label: '执行状态',
    prop: 'documentStatus',
    minWidth: '120',
    enum: [
      { label: '创建', value: '1' },
      { label: '进行中', value: '2' },
      { label: '执行完成', value: '3' },
    ],
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
      proxy.showWarning('请选择计划单');
    }
    console.log(list, 'list');
  };

  const close = () => {
    wsllTable.value.clearRadio()
    emit('update:modelValue', false);
  };
</script>