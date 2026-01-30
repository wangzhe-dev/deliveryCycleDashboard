<script setup name="TableColumn" lang="jsx">
import { inject, ref, useSlots } from 'vue';
import { filterEnum, formatValue, handleProp, handleRowAccordingToProp } from '@/utils/utils';

/**
 * TableColumn 组件
 * 说明：
 * - 负责渲染表格中的单个列，支持多级表头递归渲染
 * - 支持根据 enumMap 进行枚举值转换显示
 * - 支持列数据格式化、tag 标签显示、自定义渲染函数及插槽
 * - 使用 JSX 语法，增强灵活性和复用性
 * - 不使用 TypeScript，保持项目一致性
 */

const props = defineProps({
  column: {
    type: Object,
    default: undefined,
  },
});

const slots = useSlots();

// 注入外层提供的 enumMap，用于枚举数据格式化
const enumMap = inject('enumMap', ref(new Map()));

/**
 * 渲染单元格数据
 * @param {Object} column 当前列配置
 * @param {Object} scope 当前单元格数据上下文
 * @returns 格式化后的显示内容（支持枚举映射）
 */
const renderCellData = (column, scope) => {
  const rawValue = handleRowAccordingToProp(scope.row, column.prop);
  if (enumMap.value.has(column.prop) && column.isFilterEnum) {
    return filterEnum(rawValue, enumMap.value.get(column.prop), column.fieldNames);
  }
  return formatValue(rawValue);
};

/**
 * 获取用于标签组件的类型，用于展示不同样式
 * @param {Object} column 当前列配置
 * @param {Object} scope 当前单元格数据上下文
 * @returns 标签类型字符串或空字符串
 */
const getTagType = (column, scope) => {
  const tagType = filterEnum(
    handleRowAccordingToProp(scope.row, column.prop),
    enumMap.value.get(column.prop),
    column.fieldNames,
    'tag',
  );
  return tagType || 'info';
};

/**
 * 递归渲染表格列
 * - 过滤掉未显示的列
 * - 优先渲染多级子列
 * - 支持自定义渲染函数render
 * - 支持对应列插槽
 * - 支持tag标签渲染
 * - 默认渲染格式化数据
 * @param {Object} column 列配置对象
 * @returns JSX 元素
 */
const RenderTableColumn = (column) => {
  if (!column.isShow) return null;

  return (
    <el-table-column
      {...column}
      align={column.align ?? 'center'}
      showOverflowTooltip={column.showOverflowTooltip ?? column.prop !== 'operation'}>
      {{
        // 默认单元格渲染逻辑
        default: (scope) => {
          if (column._children?.length) {
            // 递归渲染多级子列
            return column._children.map((child) => RenderTableColumn(child));
          }
          // 自定义 render 函数优先
          if (column.render) {
            return column.render(scope);
          }
          // 对应插槽优先
          const slotName = handleProp(column.prop);
          if (slots[slotName]) {
            return slots[slotName](scope);
          }
          // tag 标签渲染
          if (column.tag) {
            return (
              <el-tag type={getTagType(column, scope)}>{renderCellData(column, scope)}</el-tag>
            );
          }
          // 默认格式化数据展示
          return renderCellData(column, scope);
        },

        // 表头渲染逻辑
        header: (scope) => {
          // 优先 headerRender 自定义函数
          if (column.headerRender) {
            return column.headerRender(scope);
          }
          // 插槽头部渲染优先
          const headerSlotName = `${handleProp(column.prop)}Header`;
          if (slots[headerSlotName]) {
            return slots[headerSlotName](scope);
          }
          // 默认显示列标题
          return column.label;
        },
      }}
    </el-table-column>
  );
};
</script>

<template>
  <!-- 只需传入 column 对象，递归渲染完整列 -->
  <RenderTableColumn v-bind="column" />
</template>
