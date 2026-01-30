<template>
  <!-- 查询表单区域，切换用v-if减少DOM负担 -->
  <SearchForm
    v-if="isShowSearch"
    :search="searchCG"
    :reset="resetCG"
    :columns="searchColumns"
    :search-param="searchParam"
    :label-width="labelWidth"
    :search-col="searchCol"
  />

  <!-- 顶部插槽 -->
  <slot name="tatbleTop"></slot>

  <!-- 表格卡片或纯表格容器 -->
  <div ref="fullScreenTable" :class="isHideCard ? 'wsllTableBox table-main' : 'card table-main'">
    <!-- 表格操作按钮头部 -->
    <div class="table-header">
      <div v-if="toolButton" class="header-button-ri">
        <slot name="toolButton">
          <el-button
            v-if="props.grid"
            :icon="isGrid ? 'Menu' : 'Postcard'"
            circle
            @click="toggleGrid"
          />

          <el-button
            v-if="props.fullScreen"
            :icon="fullScreenVisible ? 'Close' : 'fullScreen'"
            circle
            @click="toggleFullScreen"
          />
          <el-button :icon="Refresh" circle @click="getTableList" />
          <el-button
            v-if="columns.length && props.printOptions.printable"
            :icon="Printer"
            circle
            @click="print"
          />
          <el-button v-if="columns.length" :icon="Operation" circle @click="openColSetting" />
          <el-button
            v-if="searchColumns.length"
            :icon="Search"
            circle
            @click="isShowSearch = !isShowSearch"
          />
        </slot>
      </div>
      <div class="header-button-lf">
        <slot
          name="tableHeader"
          :selected-list-ids="selectedListIds"
          :selected-list="selectedList"
          :is-selected="isSelected"
        />
      </div>
    </div>

    <!-- 可打印表格头部插槽 -->
    <div v-if="columns.length && props.printOptions.printable" class="table-printer-header">
      <slot name="tablePrinterHeader" />
    </div>

    <!-- 表格内容：切换列表视图或栅格视图 -->
    <template v-if="!isGrid && isShowTable">
      <el-table
        v-table-mobile="{ enabled: enabled }"
        ref="tableRef"
        v-bind="$attrs"
        :data="data ?? tableData"
        :border="border"
        :row-key="rowKey"
        @select="selectionChangeRepeat"
        @selection-change="selectionChange"
        @sort-change="sortChange"
        @getSelectionRows="getSelectionRows"
      >
        <!-- @current-change="currentChange" -->
        <!-- 默认插槽放置表格列 -->
        <slot></slot>
        <template v-for="item in tableColumns" :key="item.prop || item.type">
          <!-- 特殊列类型：多选、序号、展开、单选 -->
          <el-table-column
            v-if="item.type && ['selection', 'index', 'expand', 'radio'].includes(item.type)"
            v-bind="item"
            :align="item.align ?? 'center'"
            :reserve-selection="echoReserveSelection(item.reserveSelection)"
            :selectable="props.selectable ? props.selectable : () => true"
          >
            <template v-if="['expand', 'radio'].includes(item.type)" #default="scope">
              <component
                v-if="item.type === 'expand' && item.render"
                :is="item.render"
                v-bind="scope"
              />
              <el-radio
                v-else-if="item.type === 'radio'"
                v-model="currentRadioRow[rowKey]"
                :label="scope.row[rowKey]"
                :disabled="props.selectable ? props.selectable(scope.row) : false"
                @change="(v) => radioChange(v, scope.row)"
              >
                <span style="opacity: 0">1</span>
              </el-radio>
              <slot v-else-if="!item.render" :name="item.type" v-bind="scope"></slot>
            </template>
          </el-table-column>

          <!-- 普通列 -->
          <TableColumn v-if="!item.type && item.prop && item.isShow" :column="item">
            <template v-for="slot in Object.keys($slots)" #[slot]="scope">
              <slot :name="slot" v-bind="scope"></slot>
            </template>
          </TableColumn>
        </template>

        <!-- 表格尾部插槽 -->
        <template #append>
          <slot name="append"></slot>
        </template>

        <!-- 无数据展示 -->
        <template #empty>
          <div class="table-empty">
            <slot name="empty">
              <el-empty description="暂无数据" />
            </slot>
          </div>
        </template>
      </el-table>
    </template>

    <!-- 栅格视图插槽 -->
    <template v-if="isGrid && isShowTable">
      <slot name="slotGrid" :tableData="data ?? tableData"></slot>
    </template>

    <!-- 分页插槽 -->
    <slot name="pagination">
      <Pagination
        v-if="pagination"
        :size="paginationSize"
        :paginationLayout="paginationLayout"
        :pageable="pageable"
        :handle-size-change="handleSizeChange"
        :handle-current-change="handleCurrentChange"
      />
    </slot>
  </div>

  <!-- 列设置弹窗 -->
  <ColSetting
    v-if="toolButton"
    ref="colRef"
    v-model:col-setting="colSetting"
    @switchChange="switchChange"
  />
</template>

<script setup name="WellTable">
import { ref, watch, computed, provide, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { ElTable } from 'element-plus';
import { useTable } from '@/hooks/useTable';
import { useSelection } from '@/hooks/useSelection';
import { Refresh, Printer, Operation, Search } from '@element-plus/icons-vue';
import { filterEnum, formatValue, handleProp, handleRowAccordingToProp } from '@/utils/utils';
import SearchForm from '@/components/WsllSearchForm';
import Pagination from './components/Pagination';
import ColSetting from './components/ColSetting';
import TableColumn from './components/TableColumn';
import printJS from 'print-js';

// 定义 enumMap 存储枚举数据，避免异步请求导致单元格显示异常
const enumMap = ref(new Map());
provide('enumMap', enumMap);

// 组件 Props 定义，包含默认值
const props = defineProps({
  enabled: { type: Boolean, default: false },
  // 是否显示表格，默认显示
  isShowTable: { type: Boolean, default: true },

  // 表格数据数组，外部传入时优先使用该数据
  data: { type: Array, default: undefined },

  // 表格列配置数组，定义每列属性和行为
  columns: { type: Array, default: () => [] },

  // 是否自动请求数据，默认自动请求
  requestAuto: { type: Boolean, default: true },

  // 是否启用分页，默认启用
  pagination: { type: Boolean, default: true },

  // 初始化请求参数对象，作为接口请求时的参数
  initParam: { type: Object, default: () => ({}) },

  // 表格是否显示边框，默认有边框
  border: { type: Boolean, default: true },

  // 是否显示表格上方工具按钮（刷新、打印、列设置等），默认显示
  toolButton: { type: Boolean, default: true },

  // 表格行唯一标识字段，默认为 'id'
  rowKey: { type: String, default: 'id' },

  // 多选时的唯一标识字段，默认使用 rowKey
  selectKey: { type: String, default: '' },

  // 搜索表单的响应式列配置，用于控制表单项在不同屏幕宽度下的列数

  searchCol: { type: Number, default: 4 },

  // 表格数据请求接口函数，必须是一个返回 Promise 的函数
  requestApi: { type: Function },

  // 是否隐藏表格外层卡片容器，默认显示
  isHideCard: { type: Boolean, default: false },

  // 搜索表单标签宽度，如 '120px'，默认不设置
  labelWidth: { type: String },

  // 请求成功后数据回调函数，接收接口返回的数据
  dataCallback: { type: Function },

  // 请求出错时的回调函数，接收错误信息
  requestError: { type: Function },

  // 分页组件布局，定义分页条显示内容，默认显示总数、跳页、上一页、页码、下一页、每页条数
  paginationLayout: { type: String, default: 'total, jumper, prev, pager, next, sizes' },

  // 分页组件大小，支持 'default' 和 'small'，默认 'default'
  paginationSize: { type: String, default: 'default' },

  // 分页默认每页条数
  defaultPageSize: { type: Number, default: 20 },

  // 打印配置对象，支持 print-js 的配置参数，默认空对象
  printOptions: { type: Object, default: () => ({}) },

  // 表格多选是否可选的函数，用于控制行是否可被选中，默认全部可选
  selectable: { type: [Function, undefined], default: undefined },

  // 是否启用全屏模式按钮，默认不启用
  fullScreen: { type: Boolean, default: false },

  // 是否启用网格（卡片）模式显示，默认不启用
  grid: { type: Boolean, default: false },

  // 自定义参数对象，可用于请求联动时传递额外参数，默认空对象
  customParam: { type: Object, default: () => ({}) },

  // 表格数据加载完成后的回调函数，接收加载完成的数据，默认空函数
  onReady: { type: Function, default: () => {} },
});

// 声明组件支持发射的事件（必须声明才能正常触发事件）
const emit = defineEmits(['radioChange', 'search-reset', 'sortChange', 'search-search']);

// 统一管理事件名
const EMIT_EVENTS = {
  RADIO_CHANGE: 'radioChange',
  SEARCH_RESET: 'search-reset',
  SORT_CHANGE: 'sortChange',
  SEARCH_SEARCH: 'search-search',
};

// 统一事件发射函数
function emitEvent(eventName, ...args) {
  if (Object.values(EMIT_EVENTS).includes(eventName)) {
    emit(eventName, ...args);
    // 这里可以添加日志、埋点、权限校验等统一处理
    // console.log(`事件触发: ${eventName}`, args);
  } else {
    console.warn(`[WellTable] 尝试发射未声明事件: ${eventName}`);
  }
}

// 是否显示搜索模块
const isShowSearch = ref(true);
// 表格 DOM 元素 ref
const tableRef = ref();

// 表格多选 Hooks，传入行唯一标识 key
const { selectionChange, selectedList, selectedListIds, isSelected } = useSelection(
  props.selectKey || props.rowKey,
);
const { rowKey } = props;
const isShowTable = computed(() => props.isShowTable);

// 表格排序变更事件，调用统一事件发射
const sortChange = (v) => {
  emitEvent(EMIT_EVENTS.SORT_CHANGE, v);
};

// 表格操作相关 Hooks，加载数据、分页等
const {
  // 表格当前显示的数据列表，经过请求或本地处理后得到
  tableData,

  // 分页对象，包含当前页码、页面大小、总条数等信息
  pageable,

  // 搜索表单的实时绑定查询参数
  searchParam,

  // 搜索表单的初始化查询参数，通常是初始默认值
  searchInitParam,

  // 手动触发数据请求，刷新表格数据
  getTableList,

  // 执行搜索逻辑，一般会调用 getTableList 请求数据
  search,

  // 重置搜索表单参数并刷新数据
  reset,

  // 处理分页页面大小改变时的回调方法
  handleSizeChange,

  // 处理分页当前页改变时的回调方法
  handleCurrentChange,

  // 手动加载数据接口，类似于 getTableList，但可额外控制逻辑
  loadData,

  // 刷新当前表格数据，通常监听参数变化时调用
  refresh,

  // 更新分页参数（如总条数 total）
  updatedTotalParam,

  // 清空表格数据缓存，重置数据状态
  clearTable,
} = useTable(
  props.requestApi, // 请求数据的接口函数
  props.initParam, // 初始请求参数
  props.pagination, // 是否开启分页
  props.dataCallback, // 数据返回后的回调函数
  props.requestError, // 请求错误处理函数
  props.columns[0]?.type, // 首列类型，影响部分行为
  props.customParam, // 自定义参数，用于扩展请求参数
  (data) => {
    // 数据加载完成的回调，触发父组件的 onReady
    props.onReady?.(data);
  },
  undefined,
  props.defaultPageSize,
);

// 重写 reset，派发重置事件，调用统一事件发射
const resetCG = () => {
  emitEvent(EMIT_EVENTS.SEARCH_RESET);
  nextTick(() => {
    reset();
  });
};

// 重写 search，派发搜索事件，调用统一事件发射
const searchCG = () => {
  emitEvent(EMIT_EVENTS.SEARCH_SEARCH);
  nextTick(() => {
    search();
  });
};

// radio 选中变化事件，调用统一事件发射
const currentRadioRow = ref({ id: null });
const radioChange = (v, r) => {
  emitEvent(EMIT_EVENTS.RADIO_CHANGE, v, r);
};

// 清空单选状态
const clearRadio = () => {
  currentRadioRow.value = { id: null };
};

// 清空多选选中
const clearSelection = () => tableRef.value?.clearSelection();

// 组件挂载时自动请求数据
onMounted(() => {
  if (props.requestAuto) getTableList();
});

// 监听 initParam 变化，刷新表格
watch(() => props.initParam, refresh, { deep: true });

// 响应式存储当前列配置和搜索列配置
const tableColumns = ref([]);
const flatColumns = ref([]);
const searchColumns = ref([]);

// 列设置组件 ref 和数据
const colRef = ref();
const colSetting = ref([]);

// 监听 columns 变化，处理扁平化、搜索字段和列设置
watch(
  () => props.columns,
  (newVal) => {
    tableColumns.value = newVal;
    formatSearchCol();
    updateColSet();
  },
  { immediate: true, deep: true },
);

// 初始化列设置数据
updateColSet();

// 监听组件卸载，移除全屏事件监听，防止内存泄漏
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullScreenChange);
});

// 列设置开关变化
// function switchChange(row) {
//   tableColumns.value.forEach((item) => {
//     if (item.prop === row.prop) {
//       console.log('33333', row.isShow);
//       item.isShow = row.isShow;
//     }
//   });
// }
const switchChange = (row) => {
  // 更新 tableColumns 中的 isShow 状态
  const updateColumns = (columns) => {
    return columns.map((column) => {
      if (column.prop === row.prop) {
        return { ...column, isShow: row.isShow };
      }
      if (column._children?.length) {
        return {
          ...column,
          _children: updateColumns(column._children),
        };
      }
      return column;
    });
  };

  tableColumns.value = updateColumns(tableColumns.value);

  // 更新 colSetting 显示状态
  colSetting.value = colSetting.value.map((item) =>
    item.prop === row.prop ? { ...item, isShow: row.isShow } : item,
  );
};
// 设置 enumMap，支持枚举异步请求缓存
async function setEnumMap(col) {
  if (!col || !col.enum) return;

  // 如果 enum 是函数，则异步调用并缓存结果
  if (typeof col.enum === 'function') {
    const { data } = await col.enum();
    enumMap.value.set(col.prop, data);
  } else {
    // 否则直接缓存 enum 对象
    enumMap.value.set(col.prop, col.enum);
  }
}

// 扁平化 columns，递归收集所有叶子列，同时添加默认属性 isShow, isFilterEnum
function flatColumnsFunc(columns, flatArr = []) {
  columns.forEach(async (col) => {
    if (col._children?.length) {
      flatColumnsFunc(col._children, flatArr);
    } else {
      flatArr.push(col);
      col.isShow = col.isShow ?? true;
      col.isFilterEnum = col.isFilterEnum ?? true;
      await setEnumMap(col);
    }
  });
  return flatArr;
}

// 处理搜索表单列排序和默认值
function formatSearchCol() {
  flatColumns.value = flatColumnsFunc(tableColumns.value);
  searchColumns.value = flatColumns.value.filter((item) => item.search?.el || item.search?.render);

  searchColumns.value.forEach((column, index) => {
    column.search.order = column.search?.order ?? index + 2;

    if (column.search?.defaultValue !== undefined && column.search?.defaultValue !== null) {
      const key = column.search.key ?? handleProp(column.prop);
      searchInitParam.value[key] = column.search.defaultValue;
      searchParam.value[key] = searchParam.value.YM
        ? searchParam.value.YM
        : column.search.defaultValue;
    }
  });

  // 按 order 排序
  searchColumns.value.sort((a, b) => a.search?.order - b.search?.order);
}

// 更新列设置数据，过滤非操作列及隐藏列
function updateColSet() {
  colSetting.value = tableColumns.value.filter(
    (item) =>
      !['selection', 'index', 'expand'].includes(item.type) &&
      item.prop !== 'operation' &&
      item.isShow,
  );
}

// 打开列设置弹窗
const openColSetting = () => colRef.value.openColSetting();

// 处理重复数据多选，保证跨页选中同步
function selectionChangeRepeat(selection, row) {
  const { rowKey = 'id' } = props;
  const curData = props.data ?? tableData.value;
  const filterArr = curData.filter(
    (it) => JSON.stringify(it) !== JSON.stringify(row) && it[rowKey] === row[rowKey],
  );
  filterArr.forEach((row) => {
    tableRef.value?.toggleRowSelection(row, selection);
  });
}

// 全屏相关状态和函数
const fullScreenVisible = ref(false);
const fullScreenTable = ref(null);
const setFullScreenVisible = (flag = false) => {
  fullScreenVisible.value = flag;
};
const closeFullScreen = () => {
  setFullScreenVisible(false);
  if (document.fullscreenElement !== null) {
    document.exitFullscreen();
  }
};
// 监听全屏变化，关闭时重置状态
function onFullScreenChange() {
  if (document.fullscreenElement === null) {
    closeFullScreen();
  }
}
// 切换全屏
const fullScreen = () => {
  if (fullScreenVisible.value && document.fullscreenElement) {
    closeFullScreen();
    return;
  }
  setFullScreenVisible(true);
  fullScreenTable?.value?.requestFullscreen();

  document.addEventListener('fullscreenchange', onFullScreenChange);
};

// 设置当前选中行（单选）
const setCurrentRow = (row) => {
  if (!row) return;
  if (tableRef.value) {
    tableRef.value.setCurrentRow(row);
    currentRadioRow.value[rowKey] = row[rowKey];
  }
};

// 获取当前选中多选行数据
const getSelectionRows = () => {
  if (tableRef.value) {
    return tableRef.value.getSelectionRows();
  }
  return [];
};

// 面板模式切换（表格/网格）
const isGrid = ref(false);
function toggleGrid() {
  isGrid.value = !isGrid.value;
}

// 打印表格，支持自定义样式
const print = (options = {}) => {
  const style = `
    @page { size: auto; margin: 5mm; }
    @media print {
      @page { size: landscape; }
      .el-button {
        display: none;
      }
      .table-search {
        display: none;
      }
      .el-table .el-table__row {
        height: 34px;
        line-height: 34px;
      }
    }
    table-layout: auto!important;
  `;
  printJS({
    ...{
      printable: 'print-table',
      type: 'html',
      targetStyle: ['*'],
      targetStyles: ['*'],
      maxWidth: '', // 最大宽度，默认800，仅支持数字
      style: style,
      scanStyles: false,
    },
    ...props.printOptions,
    ...options,
  });
};

// 控制跨页存储多选状态，避免重复绑定
function echoReserveSelection(bool) {
  if (bool === undefined || bool === 0 || bool === null) {
    return false;
  }
  return bool;
}

// 对外暴露方法和数据，供父组件调用
defineExpose({
  // 表格组件的 ref，方便父组件直接访问 el-table 实例的方法
  element: tableRef,

  // 当前表格显示的数据列表（可能是请求结果或传入的 data）
  tableData,

  // 分页信息对象，包含总数、当前页、页面大小等
  pageable,

  // 搜索表单绑定的查询参数（实时变化）
  searchParam,

  // 搜索表单初始化时的查询参数
  searchInitParam,

  // 手动触发请求接口，刷新获取表格数据
  getTableList,

  // 搜索方法，执行搜索逻辑，通常会重新请求数据
  search,

  // 重置搜索表单方法
  reset,

  // 处理分页页面大小变化的回调
  handleSizeChange,

  // 处理分页当前页变化的回调
  handleCurrentChange,

  // 清空表格中所有选中项（多选清空）
  clearSelection,

  // 存储枚举映射数据的 Map，供子组件或外部使用
  enumMap,

  // 判断某行是否被选中（辅助函数）
  isSelected,

  // 当前选中的数据列表（多选）
  selectedList,

  // 当前选中数据的唯一标识列表
  selectedListIds,

  // 重新加载表格数据（会保留分页和搜索参数）
  loadData,

  // 刷新表格数据，通常用于监听参数变化时调用
  refresh,

  // 更新分页参数（例如 total 总条数）
  updatedTotalParam,

  // 清除当前单选行选择（radio 清空）
  clearRadio,

  // 打印表格内容的方法
  print,

  // 当前单选行选中项，格式为 { [rowKey]: 当前选中行id }
  currentRadioRow,

  // 清空表格数据，清除所有内容
  clearTable,

  // 设置表格当前选中行（单选）
  setCurrentRow,

  // 获取当前选中的所有行数据（多选）
  getSelectionRows,

  // 进入或退出全屏显示表格
  fullScreen,

  // 切换网格模式和表格模式显示
  toggleGrid,

  // 打开列显示设置弹窗
  openColSetting,
});
</script>
