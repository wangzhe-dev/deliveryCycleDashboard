<!--
 * @Author: hupaocai 13767071930@163.com
 * @Date: 2024-11-25 17:42:22
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-11-26 14:11:38
 * @FilePath: /mcm-web/src/components/positionInfoDialog/index.vue
 * @Description: 岗位信息弹窗
-->
<template>
  <el-dialog append-to-body :title="props.title" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        highlight-current-row
        default-expand-all
        :columns="columns"
        :initParam="{ isCancel: '0' }"
        :request-api="loadList"
        label-width="80px"
        rowKey="id"
        :toolButton="false"
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

<script setup lang="jsx" name="positionInfoDialog">
// 岗位信息弹窗
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '岗位列表',
  },
  checkType: {
    type: String,
    default: 'radio',
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);
const columns = reactive([
  { type: props.checkType, fixed: 'left', width: 40 },
  {
    prop: 'functionCode',
    label: '岗位编码',
    search: {
      el: 'input',
    },
  },
  {
    prop: 'functionName',
    label: '岗位名称',
    search: { el: 'input' },
  },
  {
    prop: 'qtType',
    label: '安全级别',
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

const confirm = () => {
  const list = wsllTable.value.selectedList;

  if (list.length) {
    // const deliveryOrderCode = list[0].deliveryOrderCode;
    // const isSame = list.every((item) => item.deliveryOrderCode == deliveryOrderCode);
    // if (isSame) {
      emit('submit', list);
      close();
    // } else {
    //   proxy.showWarning('请选相同的单号');
    // }
  } else {
    proxy.showWarning('请选择岗位');
  }
};
</script>
