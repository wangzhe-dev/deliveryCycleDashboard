<!--
 * @Author: zhaijinsong
 * @Date: 2023-09-12 16:03:20
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-09-26 17:43:25
 * @Description: 加工单
-->
<template>
  <el-dialog append-to-body title="选择加工单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable ref="wsllTable" highlight-current-row :columns="columns" :request-api="loadList" label-width="140px"
        :toolButton="false" rowKey="workOrder" :initParam="initParams" @radioChange="tableRadioChange" />
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

  import moment from 'moment'
  const emit = defineEmits();
  const { proxy } = getCurrentInstance();
  const wsllTable = ref(null);
  const visible = ref(false);
  const initParams = ref({
    workType: "1"
  });
  const columns = reactive([
    {
      type: 'radio'
    },
    {
      prop: 'projectNumber',
      label: '项目编号',
      width: 160,
    },
    // {
    //   prop: 'batchNumber1',
    //   label: '项目批号',
    //   width: 160,
    // },
    {
      prop: 'materialsCode',
      label: '物料编号',
      width: 160,
      search: { el: 'input' },
    },
    {
      prop: 'materialsName',
      label: '物料名称',
      width: 160,
      search: { el: 'input' },
    },
    {
      prop: 'workOrder',
      label: '加工单号',
      width: 160,
      search: { order: 1, el: 'input' },
    },
    {
      prop: 'specifications',
      label: '规格型号',
      width: 160,
    },
    {
      prop: 'textureOfMaterial',
      label: '材质',
      width: 160,
    },
    {
      prop: 'materialsType',
      label: '物料类型',
      enum: () => proxy.useColumnsDict('materials_type'),
      width: 160,
    },
    {
      prop: 'drawingNo',
      label: '图号',
      width: 160,
    },
    {
      prop: 'productionQuantity',
      label: '生产数量',
      width: 160,
    },
    {
      prop: 'completeSetQty',
      label: '齐套数量',
      width: 160,
    },
    {
      prop: 'stateCode',
      label: '状态',
      width: 160,
      enum: () => proxy.useColumnsDict('process_order_state_ode'),
      search: { el: 'select' },
    },

    {
      prop: 'productionOrderNo',
      label: '生产单号',
      width: 160,
    },
    {
      prop: 'salesOrder',
      label: '销售订单号',
      width: 160,
    },
    {
      prop: 'varietiesRateStr',
      label: '品种齐套率(%)',
      width: 160,
      render: ({ row }) =>
        row.varietiesRateStr === '0' ? 0 : Math.round(row.varietiesRateStr) * 100 + '%',
    },
    {
      prop: 'completedQuantity',
      label: '经办数量',
      width: 160,
    },
    {
      prop: 'qualifiedQuantity',
      label: '合格数量',
      width: 160,
    },
    {
      prop: 'serialNumberType',
      label: '管理类型',
      width: 160,
      render: ({ row }) => (row.varietiesRateStr === '1' ? '序列号' : '批次号'),
    },
    {
      prop: 'printCont',
      label: '打印状态',
      width: 160,
      render: ({ row }) => (row.printCont >= '1' ? '已打印' : '未打印'),
    },
    {
      prop: 'plannedStartTime',
      label: '计划开工时间',
      width: 160,
      render: ({ row }) =>
        row.plannedStartTime ? moment(row.plannedStartTime).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    {
      prop: 'plannedCompletionTime',
      label: '计划完成时间',
      render: ({ row }) =>
        row.plannedCompletionTime
          ? moment(row.plannedCompletionTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
      width: 160,
    },
    {
      prop: 'actualStartTime',
      label: '实际开工时间',
      width: 160,
      render: ({ row }) =>
        row.actualStartTime ? moment(row.actualStartTime).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    {
      prop: 'actualCompletionTime',
      label: '计划完工时间',
      width: 160,
      render: ({ row }) =>
        row.actualCompletionTime
          ? moment(row.actualCompletionTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
    },
    {
      prop: 'stdTime',
      label: '标准工时(h)',
      width: 160,
    },
    {
      prop: 'laborConsumption',
      label: '耗费工时(h)',
      width: 160,
      render: ({ row }) =>
        row.laborConsumption ? (row.laborConsumption / (60 * 1000)).toFixed(2) : '',
    },
    {
      prop: 'productionWorkshop',
      label: '生产车间',
      width: 160,
      enum: () => proxy.useColumnsDict('test_workshop'),
    },
    {
      prop: 'pickingState',
      label: '领料状态',
      width: 160,
      enum: () => proxy.useColumnsDict('production_picking_status'),
    },
    {
      prop: 'createdTime',
      label: '创建日期',
      width: 160,
      render: ({ row }) =>
        row.actualCompletionTime
          ? moment(row.actualCompletionTime).format('YYYY-MM-DD HH:mm:ss')
          : '',
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
      proxy.showWarning('请选择销售订单');
    }
    console.log(list, 'list');
  };

  const close = () => {
    wsllTable.value.clearRadio()
    emit('update:modelValue', false);
  };
</script>