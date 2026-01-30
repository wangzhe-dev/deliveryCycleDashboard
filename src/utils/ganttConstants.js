/*
 * @Descripttion:
 * @version:
 * @Author: lj
 * @Date: 2025-06-30 09:04:48
 * @LastEditors: liangjia
 * @LastEditTime: 2025-07-19 16:04:57
 */
// 工艺段颜色映射
export const STAGE_COLOR_MAP = {
  下料: { onTime: '#39c86a', late: '#f56c6c' },
  小组: { onTime: '#39c86a', late: '#f56c6c' },
  大组: { onTime: '#39c86a', late: '#f56c6c' },
};

// 工时块背景色映射（根据产线编码）
export const BG_COLOR_MAP = {
  'YCL-XC': '#91CC75',
  'YCL-BC': '#5470C6',
  'QG-BC': '#FAC858',
  'QG-XC': '#EE6666',
  'HJ-TP': '#73C0DE',
  'HJ-XZ': '#3BA272',
  'HJ-PT': '#FC8452',
  'HJ-FD01': '#9A60B4',
  // 平直分段智能产线-2/3：在 FD01 基础上做更高级、偏亮的变体
  'HJ-FD02': '#7A6CE0',
  'HJ-FD03': '#5B3FC4',
};

// 固定产线顺序配置
export const FIXED_LANE_ORDER = [
  { type: '下料', ds: '-BC' },
  { type: '下料', ds: '-XC' },
  { type: '换产', ds: 'XLXZ' },
  { type: '小组', ds: '-TP' },
  { type: '小组', ds: '-XZ' },
  { type: '小组', ds: '-PT' },
  { type: '换产', ds: 'XZDZ' },
  { type: '大组', ds: '-FD01' },
  { type: '大组', ds: '-FD02' },
  { type: '大组', ds: '-FD03' },
];

// 产线对应颜色块
export const LANE_COLOR_MAP = {
  '#5470C6': '板材预处理线',
  '#91CC75': '型材预处理线',
  '#FAC858': '板材切割线',
  '#EE6666': '型材切割线',
  '#73C0DE': 'T型材智能产线',
  '#3BA272': '小组立智能产线',
  '#FC8452': '片体拼板智能产线',
  '#9A60B4': '平直分段智能产线-1',
  '#7A6CE0': '平直分段智能产线-2',
  '#5B3FC4': '平直分段智能产线-3', 
};
