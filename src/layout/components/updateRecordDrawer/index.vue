<template>
  <el-drawer
    v-model="visible"
    @close="close"
    direction="rtl"
    size="50vw"
    class="wsll-table"
    title="修改记录"
    append-to-body
  >
    <WsllTable
      ref="wsllTable"
      :toolButton="false"
      highlight-current-row
      :columns="columns"
      :data="tableData"
      rowKey="id"
      height="83vh"
      :pagination="false"
    ></WsllTable>
  </el-drawer>
</template>
<script setup lang="jsx" name="updateRecordDrawer">
import useUpdateRecordStore from '@/store/modules/updateRecord';

const store = useUpdateRecordStore();

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
