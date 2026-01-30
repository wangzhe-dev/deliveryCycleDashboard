/*
 * @Author: zhaijs
 * @Date: 2023-08-03 08:41:19
 * @LastEditTime: 2023-11-02 17:09:19
 * @Description: 请填写简介
 */
import { ref, computed } from 'vue';

/**
 * @description 表格多选数据操作
 * @param {String} rowKey 当表格可以多选时，所指定的 id
 * */
export const useSelection = (rowKey = 'id') => {
  const isSelected = ref(false);
  const selectedList = ref([]);

  // 当前选中的所有 ids 数组
  const selectedListIds = computed(() => {
    let ids = [];
    selectedList.value.forEach((item) => ids.push(item[rowKey]));
    return ids;
  });

  /**
   * @description 多选操作
   * @param {Array} rowArr 当前选择的所有数据
   * @return void
   */
  const selectionChange = (rowArr) => {
    rowArr.length ? (isSelected.value = true) : (isSelected.value = false);
    selectedList.value = rowArr;
  };

  return {
    isSelected,
    selectedList,
    selectedListIds,
    selectionChange,
  };
};
