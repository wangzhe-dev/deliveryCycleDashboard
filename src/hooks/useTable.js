/*
 * @Author: zhaijs
 * @Date: 2023-08-03 08:23:40
 * @LastEditTime: 2025-12-16 15:27:37
 * @Description: 页面表格操作方法封装（优化版，不含 loading，不改函数名）
 *
 * ✅ 支持分页、查询、重置、刷新、清空等表格常规功能
 * ✅ 提供 onReady / onBeforeLoad 回调便于父组件控制时机
 */

import { reactive, computed, toRefs } from 'vue';

/**
 * @description table 页面操作方法封装
 * @param {Function} api - 获取表格数据 API（必传）
 * @param {Object} initParam - 初始化参数（默认 {}）
 * @param {Boolean} isPageable - 是否分页（默认 true）
 * @param {Function} dataCallBack - 对后端返回的数据进行处理的回调函数
 * @param {Function} requestError - 请求出错的回调函数
 * @param {String} type - 预留字段
 * @param {Object} customParam - 自定义参数合并进请求参数
 * @param {Function} onReady - 数据加载完成的钩子函数
 * @param {Function} onBeforeLoad - 数据加载前的钩子函数
 * @param {Number} defaultPageSize - 默认每页条数（默认 20）
 */
export const useTable = (
  api,
  initParam = {},
  isPageable = true,
  dataCallBack,
  requestError,
  type,
  customParam = {},
  onReady,
  onBeforeLoad,
  defaultPageSize = 20,
) => {
  const resolvedPageSize = Number.isFinite(Number(defaultPageSize))
    ? Math.max(1, Number(defaultPageSize))
    : 20;
  const state = reactive({
    tableData: [],
    pageable: {
      current: 1,
      size: resolvedPageSize,
      total: 0,
    },
    searchParam: {},
    searchInitParam: {},
    totalParam: {},
  });

  // 计算分页参数（pageNum, pageSize）
  const pageParam = computed(() => ({
    pageNum: state.pageable.current,
    pageSize: state.pageable.size,
  }));

  /**
   * @description 获取表格数据
   */
  const resolveTableData = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.records)) return data.records;
    return [];
  };

  const getTableList = async () => {
    if (!api) return;
    try {
      onBeforeLoad?.();
      Object.assign(state.totalParam, initParam, customParam, isPageable ? pageParam.value : {});
      const res = await api({ ...state.searchInitParam, ...state.totalParam });
      let data = res.data ? res.data : res;
      if (dataCallBack) data = dataCallBack(data);
      const tableData = isPageable ? data?.records || [] : resolveTableData(data);
      tableData.forEach((it) => (it.rChecked = false));
      state.tableData = tableData;
      if (isPageable) {
        const { current, size, total } = data;
        updatePageable({ current, size, total });
      }
      onReady?.(state.tableData);
    } catch (error) {
      console.error(error);
      requestError?.(error);
    }
  };

  /**
   * @description 更新查询参数 totalParam
   */
  const updatedTotalParam = () => {
    state.totalParam = {};
    const nowSearchParam = Object.fromEntries(
      Object.entries(state.searchParam).filter(
        ([, val]) => val !== undefined && val !== '' && val !== null,
      ),
    );
    Object.assign(state.totalParam, nowSearchParam, isPageable ? pageParam.value : {});
  };

  /**
   * @description 设置分页数据
   */
  const updatePageable = (pageable) => {
    Object.assign(state.pageable, pageable);
  };

  /**
   * @description 表格搜索操作（重置页码并加载数据）
   */
  const search = () => {
    state.tableData = [];
    state.pageable.current = 1;
    updatedTotalParam();
    getTableList();
  };

  /**
   * @description 表格重置操作（清空参数并加载数据）
   */
  const reset = () => {
    state.pageable.current = 1;
    state.searchParam = {};
    Object.keys(state.searchInitParam).forEach((key) => {
      state.searchParam[key] = state.searchInitParam[key];
    });
    updatedTotalParam();
    getTableList();
  };

  /**
   * @description 每页条数变化时触发
   * @param {Number} val - 当前每页条数
   */
  const handleSizeChange = (val) => {
    state.pageable.current = 1;
    state.pageable.size = val;
    getTableList();
  };

  /**
   * @description 页码变化时触发
   * @param {Number} val - 当前页码
   */
  const handleCurrentChange = (val) => {
    state.pageable.current = val;
    getTableList();
  };

  /**
   * @description 刷新数据（保留当前页）
   */
  const loadData = () => {
    getTableList();
  };

  /**
   * @description 刷新数据（跳转至第一页）
   */
  const refresh = () => {
    state.pageable.current = 1;
    getTableList();
  };

  /**
   * @description 清空表格数据和分页信息
   */
  const clearTable = () => {
    state.pageable.current = 1;
    state.pageable.size = resolvedPageSize;
    state.pageable.total = 0;
    state.tableData = [];
  };

  return {
    ...toRefs(state),
    getTableList,
    search,
    reset,
    handleSizeChange,
    handleCurrentChange,
    updatedTotalParam,
    loadData,
    refresh,
    clearTable,
  };
};
