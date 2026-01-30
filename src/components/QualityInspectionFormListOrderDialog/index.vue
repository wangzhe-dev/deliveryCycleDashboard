<!--
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:05:54
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2025-01-10 16:40:36
 * @Description: 选择质检填报单
-->
<template>
  <el-dialog append-to-body title="选择加工单" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable ref="wsllTable" highlight-current-row :columns="columns" :request-api="loadList" label-width="140px"
        :toolButton="false" rowKey="taskNumber" :initParam="initParams" @radioChange="tableRadioChange" />
    </div>
    <template #footer>
      <el-button @click="close" v-if="props.checkType === 'selection'">取消</el-button>
      <el-button type="primary" @click="confirm" v-if="props.checkType === 'selection'">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="QualityInspectionFormListOrderDialog">
  import { loadList } from './services';
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

  const columns = reactive([
  {
      type: 'radio',
      width: 40,
    },
  {
    label: '计划开始',
    prop: 'day',
    search: {
      el: 'date-picker',
      props: {
        type: 'date',
        'value-format': 'YYYY-MM-DD',
        clearable: true,
        onChange: (value, searchParam) => {
          searchParam.day = value || null;
        },
      },
    },
    isShow: false,
  },
  {
    type: 'index',
    label: '序号',
    width: 80,
  },
  {
    label: '任务号',
    minWidth: 140,
    prop: 'taskNumber',
  },
  {
    label: '项目号',
    minWidth: 140,
    prop: 'shipNumber',
    search: { el: 'input' },
  },
  {
    label: '批次号',
    minWidth: 140,
    prop: 'productBatch',
    search: { el: 'input' },
  },
  {
    label: '分段号',
    minWidth: 140,
    prop: 'block',
  },
  {
    label: '状态',
    minWidth: 140,
    prop: 'status',
    enum: () => proxy.useColumnsDict('process_order_state_ode'),
    tag: true,
    search: { el: 'select' },
  },
  {
    label: '流向',
    minWidth: 140,
    prop: 'blockArea',
  },
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