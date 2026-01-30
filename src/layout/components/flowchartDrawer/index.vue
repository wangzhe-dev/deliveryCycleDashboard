<template>
  <el-drawer
    v-model="visible"
    @close="close"
    direction="rtl"
    size="50vw"
    class="wsll-table"
    title="凭证流"
    append-to-body
  >
    <WsllTable
      ref="wsllTable"
      :toolButton="false"
      highlight-current-row
      default-expand-all
      :columns="columns"
      :data="tableData"
      rowKey="voucherNo"
      height="83vh"
      :pagination="false"
    ></WsllTable>
  </el-drawer>
</template>
<script setup lang="jsx" name="flowchartDrawer">
import useFlowchartStore from '@/store/modules/flowchart';

const store = useFlowchartStore();

const visible = computed(() => store.visible);
const columns = computed(() => store.columns);
const tableData = computed(() => store.tableData);

watch(
  () => visible,
  (v) => {
    v.value && store.getTableData();
  },
  { immediate: true, deep: true },
);

function open() {
  store.update({ visible: true });
}

function close() {
  store.update({ visible: false });
}

defineExpose({
  open,
  close,
});
</script>
