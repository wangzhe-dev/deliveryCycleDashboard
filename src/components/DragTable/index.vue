<template>
  <div class="drag-table">
    <ul class="table-head">
      <li
        v-for="(col, index) in localColumns"
        :key="index"
        class="table-item"
        :style="{ maxWidth: col.width }"
      >
        <span>{{ col.label }}</span>
      </li>
    </ul>
    <draggable
      class="drag-table-wrap"
      :list="dataSource"
      :force-fallback="true"
      @start="startHandle"
      @end="endHandle"
      v-bind="localConfig"
      :move="props.move"
    >
      <template #item="{ element }">
        <ul @dblclick="dbClickItem(element)">
          <li
            class="table-item hover"
            v-for="(col, cIndex) in localColumns"
            :style="{ maxWidth: col.width }"
            :key="col.prop"
          >
            <slot v-if="col.slot" :name="col.prop" :scope="{ element }"></slot>
            <template v-else>
              {{ element[col.prop] }}
            </template>
          </li>
        </ul>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="jsx">
import { ref, reactive } from 'vue';
import draggable from 'vuedraggable';
import { assignFormData } from '@/utils/utils';
import _ from 'lodash';

const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({
      animation: '100',
      itemKey: 'id',
      dragClass: 'drag-class-table',
      ghostClass: 'ghost-class-table',
    }),
  },
  move: {
    type: Function,
    default: () => () => true,
  },
});

const emits = defineEmits();
const localConfig = reactive({
  animation: '100',
  itemKey: 'id',
  dragClass: 'drag-class-table',
  ghostClass: 'ghost-class-table',
  sort: true,
  disabled: false,
  group: {},
});

const localColumns = ref([]);
const dataSource = ref([]);

watch(
  () => props.config,
  (v) => {
    assignFormData(localConfig, v);
  },
  { deep: true, immediate: true },
);

watch(
  () => props.columns,
  (v) => {
    localColumns.value = v;
  },
  { deep: true, immediate: true },
);

watch(
  () => props.data,
  (v) => {
    dataSource.value = _.cloneDeep(v);
  },
  { deep: true, immediate: true },
);

// 开始拖拽
const startHandle = (e) => {
  console.log(e);
};
// 结束拖拽
const endHandle = (e) => {
  console.log(e);
  emits('dragEnd', dataSource.value);
};

function dbClickItem(element) {
  emits('dbClickItem', element);
}
</script>

<style lang="scss">
.drag-table {
  width: 100%;
  height: 100%;
  ul,
  li {
    padding: 0;
    margin: 0;
  }
  ul {
    display: flex;
    justify-content: start;
    border-bottom: 1px solid #e8e8e8;
    cursor: move;
    &:hover {
      //   background: #ebf5ff !important;
      background: #f5f7fa !important;
    }
    li.table-item {
      flex: 1;
      padding: 10px 16px;
      line-height: 22px;
      display: flex;
      align-items: center;
      font-size: 14px;

      &.center {
        display: flex;
        justify-content: center;
        & > div {
          display: flex;
          justify-content: center;
          & > .more-row {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        }
      }
      & > div {
        display: flex;
        align-items: center;
        width: 100%;
        & > div {
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &.hover {
        cursor: move;
      }
    }

    &.table-head {
      display: flex;
      height: 40px;
      background: linear-gradient(180deg, #f7f8fa 0%, #f2f2f2 100%);
      // &.table-head-white {
      //   background: var(--bg-white) !important;
      // }

      li {
        font-weight: 400;
        font-size: 14px;
        line-height: 40px;
        color: var(--font-gy-color6);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
}

// 表格的拖拽样式类名
// 拖动元素过程中添加的样式，自定义样式可能需要添加 !important 才能生效（forceFallback 属性设置味 true）
.drag-class-table {
  // 开始
  border-bottom: 2px solid #e6a23c !important;
  background: #79bbff;
  cursor: move;
  overflow: hidden;
}
// 设置拖拽元素的占位符样式 模拟被拖动元素的排序情况
.ghost-class-table {
  // 目标
  border-bottom: 2px solid #67c23a !important;
  cursor: move;
}

.drag-table-wrap {
  height: calc(100% - 40px);
  overflow-y: auto;
}
</style>
, { template }, { template }
