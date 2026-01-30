<!--
 * @Author: zhaijs
 * @Date: 2023-07-19 09:48:59
 * @LastEditTime: 2025-01-03 17:09:01
 * @Description: 请填写简介
-->
<template>
  <RenderTableColumn v-bind="column" />
</template>

<script setup name="TableColumn" lang="jsx">
import { inject, ref, useSlots } from 'vue';
import { filterEnum, formatValue, handleProp, handleRowAccordingToProp } from '@/utils/utils';
const props = defineProps({
  column: {
    type: Object,
    default: undefined,
  },
});
const slots = useSlots();

const enumMap = inject('enumMap', ref(new Map()));

// 渲染表格数据
const renderCellData = (item, scope) => {
  // console.log(item, scope.row, enumMap.value.get(item.prop), '========');
  return enumMap.value.get(item.prop) && item.isFilterEnum
    ? filterEnum(
        handleRowAccordingToProp(scope.row, item.prop),
        enumMap.value.get(item.prop),
        item.fieldNames,
      )
    : formatValue(handleRowAccordingToProp(scope.row, item.prop));
};

// 获取 tag 类型
const getTagType = (item, scope) => {
  const type = filterEnum(
    handleRowAccordingToProp(scope.row, item.prop),
    enumMap.value.get(item.prop),
    item.fieldNames,
    'tag',
  );
  return type || '';
};

const RenderTableColumn = (item) => {
  return (
    <>
      {item.isShow && (
        <el-table-column
          {...item}
          align={item.align ?? 'center'}
          showOverflowTooltip={item.showOverflowTooltip ?? item.prop !== 'operation'}>
          {{
            default: (scope) => {
              if (item._children) return item._children.map((child) => RenderTableColumn(child));
              if (item.render) return item.render(scope);
              if (slots[handleProp(item.prop)]) return slots[handleProp(item.prop)](scope);
              if (item.tag)
                return (
                  <el-tag type={getTagType(item, scope)}>{renderCellData(item, scope)}</el-tag>
                );
              return renderCellData(item, scope);
            },
            header: (scope) => {
              if (item.headerRender) return item.headerRender(scope);
              if (slots[`${handleProp(item.prop)}Header`])
                return slots[`${handleProp(item.prop)}Header`](scope);
              return item.label;
            },
          }}
        </el-table-column>
      )}
    </>
  );
};
</script>
