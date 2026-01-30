<!--
 * @Author: hupaocai 13767071930@163.com
 * @Date: 2024-07-11 17:41:20
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2024-07-11 17:48:31
 * @FilePath: /mcm-web/src/components/ToolListDialog/index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="app-container wsll-table">
    <WsllTable
      ref="wsllTable"
      highlight-current-row
      :columns="columns"
      :request-api="loadList"
      label-width="80px"
      rowKey="trayNumber"
      :toolButton="false"
    >
      <template #expand="scope">
        <WsllTable
          :columns="listColumns"
          :data="scope.row?.list || []"
          :pagination="false"
          :toolButton="false"
        />
      </template>
    </WsllTable>
  </div>
</template>
<script setup  name="ToolListDialog">
const columns = reactive([
  {
    prop: 'toolCode',
    label: '工具编码',
    align: 'left',
    search: { el: 'input', props: { filterable: true } },

  },
  {
    prop: 'toolName',
    label: '工具名称',
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
  {
    prop: 'categoryName',
    label: '工具类型',
  },
  {
    prop: 'quantity',
    label: '数量',
  },
  {
    prop: 'any',
    label: '单位',
  },
]);

const listColumns = reactive([
{ prop: 'selection', fixed: 'left' },
{ prop: 'index', label: '序号', minWidth: '50' },
{ prop: 'toolUniqueKey', label: '唯一标识' },
{ prop: 'quantity', label: '数量' },
{ prop: 'totalTimeDays', label: '总次数/时间（天）' },
{ prop: 'usedTimeDays', label: '已使用次数/时间（天）' },
{ prop: 'remainingTimeDays', label: '剩余使用次数/时间（天）' },
{
        prop: 'toolStatus',
        label: '状态',
        enum: () => proxy.useColumnsDict('use_status'),
        minWidth: '120',
      },
])

</script>
