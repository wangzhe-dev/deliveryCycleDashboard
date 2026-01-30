/*
 * @Author: zhaijinsong
 * @Date: 2024-01-05 10:29:24
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2024-01-08 16:56:10
 * @Description: 页面打印配置
 */
import { httpBuilderUrl } from '@/utils/utils';
// 劲松
const initialEntries_zjs = [
  ['salesOrderCreate', '/jmreport/view/902772097509838848'], // 销售订单详情
  ['purchaseOrderList', '/jmreport/view/903141356433920000'], // 采购订单列表/详情
  ['returnOrderList', '/jmreport/view/903122916298018816'], // 退换货订单列表/详情
  ['outgoingList', '/jmreport/view/903177320149635072'], // 外向交货单列表/详情
];
// 洋杰
const initialEntries_hyj = [
  ['otherInStockList', '/jmreport/view/903142561977552896'], // 其他入库单列表/详情
  ['otherOutStockList', '/jmreport/view/903144782697943040'], // 其他出库单列表/详情
  ['stockAllotList', '/jmreport/view/903122609458311168'], // 库存调拨单列表/详情
  ['printNbAps', '/jmreport/view/904146064854306816'], // 排产数据明细
  ['stockTakingList', '/jmreport/view/902770263424585728'], // 库存盘点单列表/详情
  ['stockPostingList', '/jmreport/view/903083894736351232'], // 库存过账单列表/详情
  ['outPickingList', '/jmreport/view/904299904840847360'], // 委外领料单列表/详情
  ['deliveryList', '/jmreport/view/904280896590663680'], // 收货单列表/详情
  ['outsourceReturnList', '/jmreport/view/904889304721215488'], // 委外退料单列表/详情
  ['outsourceReplenishmentList', '/jmreport/view/904886052722135040'], // 委外补料单列表/详情
];
// 福利
const initialEntries_jfl = [
  ['productModuleList', '/jmreport/view/903114456407822336'], //生产组件清单
  ['productOrderList', '/jmreport/view/903162233284284416'], // 生产计划单
  ['proInStockOrder', '/jmreport/view/903182052381511680'], // 生产入库单
  ['processOrderList', '/jmreport/view/903169670657691648'], // 加工单
  ['scrapSheet', '/jmreport/view/904171491060699136'], // 报废单
  ['repairOrderList', '/jmreport/view/905621594510282752'], // 翻修单
];
// 贺淇
const initialEntries_hq = [
  ['materialRequisitionList', '/jmreport/view/902787365960691712'], //生产领料
  ['supplementMaterialList', '/jmreport/view/904181398933688320'], //补料
  ['materialReturnList', '/jmreport/view/904217475748810752'], //退料
];

const myMap = new Map([
  ...initialEntries_zjs,
  ...initialEntries_hyj,
  ...initialEntries_jfl,
  ...initialEntries_hq,
]);

export const getPrintUrl = (key) => {
  const url = myMap.get(key);
  if (!url) return;
  return import.meta.env.VITE_APP_JIMU_URL + url;
};
export const printPage = (key, params = {}) => {
  const str = getPrintUrl(key);
  if (!str) return;
  const url = httpBuilderUrl(str, params);
  window.open(url, '_blank');
};
