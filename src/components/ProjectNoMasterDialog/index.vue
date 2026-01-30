<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-09-27 10:06:25
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 项目号主数据弹窗, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <el-dialog
    :close-on-click-modal="false"
    title="选择项目号"
    v-model="visible"
    width="80vw"
    @close="close"
  >
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="80px"
        rowKey="projectCode"
        :toolButton="false"
        :initParam="{ status: '3' }"
        @radioChange="tableRadioChange"
      ></WsllTable>
    </div>
  </el-dialog>
</template>

<script setup lang="jsx" name="ProjectNoMasterDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: 'radio', fixed: 'left', width: 40 },
  {
    prop: 'rootCode',
    label: '项目大类',
    width: 140,
  },
  {
    prop: 'rootName',
    label: '项目大类名称',
    width: 180,
  },
  {
    prop: 'projectCode',
    label: '项目号',
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-input vModel_trim={searchParam.projectCode} placeholder="请输入" />
            <span class="mr10 ml10">到</span>
            <el-input vModel_trim={searchParam.projectNoEnd} placeholder="请输入" />
          </div>
        );
      },
    },
  },
  {
    prop: 'projectName',
    label: '项目描述',
    width: 180,
    search: { el: 'input' },
  },
  {
    prop: 'status',
    label: '状态',
    enum: () => proxy.useColumnsDict('supplier_status_type'),
    // search: { el: 'select', props: { filterable: true } },
    width: 100,
  },
  {
    prop: 'createdNameBy',
    label: '创建人',
  },
  {
    prop: 'createdTime',
    label: '创建时间',
    width: 180,
    search: {
      // 自定义 search 显示内容
      render: ({ searchParam }) => {
        return (
          <div class="row">
            <el-date-picker
              type="date"
              vModel_trim={searchParam.createdTimeStart}
              value-format="YYYY-MM-DD"
              placeholder="请输入"
            />
            <span class="mr10 ml10">到</span>
            <el-date-picker
              type="date"
              value-format="YYYY-MM-DD"
              vModel_trim={searchParam.createdTimeEnd}
              placeholder="请输入"
            />
          </div>
        );
      },
    },
  },
  {
    prop: 'updatedNameBy',
    label: '修改人',
  },
  {
    prop: 'updatedTime',
    label: '修改时间',
    width: 180,
  },
  {
    prop: 'remarks',
    label: '备注',
    width: 200,
  },
]);

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
