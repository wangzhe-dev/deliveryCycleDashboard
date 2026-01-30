<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: liangjia
 * @LastEditTime: 2025-06-17 10:13:57
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 物料主数据弹窗
-->
<template>
  <el-dialog append-to-body title="选择物料" v-model="visible" width="80vw" @close="close">
    <div class="app-container wsll-table">
      <WsllTable
        ref="wsllTable"
        :init-param="props.params"
        highlight-current-row
        :columns="columns"
        :request-api="loadList"
        label-width="80px"
        :toolButton="false"
        rowKey="materialsCode"
        height="40vh"
        labelWidth="110px"
        @radioChange="tableRadioChange"
      />
    </div>
    <template #footer>
      <el-button @click="close" v-if="props.checkType === 'selection'">取消</el-button>
      <el-button v-if="props.singleAppend" @click="singleAppendHandle">追加</el-button>
      <el-button type="primary" @click="confirm" v-if="props.checkType === 'selection'">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="jsx" name="MaterialMasterDialog">
import { loadList } from './services';
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  checkType: {
    type: String,
    default: 'selection',
  },
  params: {
    type: Object,
    default: () => {
      return {
        materialsStatus: '3',
      };
    },
  },
  singleAppend: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits();
const { proxy } = getCurrentInstance();
const wsllTable = ref(null);
const visible = ref(false);

const columns = reactive([
  {
    type: props.checkType,
    fixed: 'left',
    width: 40,
  },
  // {
  //   label: '物料编号',
  //   width: 180,
  //   prop: 'materialsCode',
  //   fixed: 'left',
  //   search: {
  //     el: 'input',
  //   },
  // },
  // {
  //   label: '物料名称',
  //   width: 180,
  //   prop: 'materialsName',
  //   search: {
  //     el: 'input',
  //   },
  // },
  // {
  //   label: '规格型号',
  //   width: 159,
  //   prop: 'specifications',
  // },
  // {
  //   label: '物料类型',
  //   width: 107,
  //   prop: 'materialsType',
  //   enum: () => proxy.useColumnsDict('materials_type'),
  //   search: {
  //     el: 'select',
  //     props: { filterable: true },
  //   },
  // },
  // {
  //   label: '启用',
  //   prop: 'enableFlag',
  //   enum: () => proxy.useColumnsDict('use_status'),
  //   search: { el: 'select', props: { filterable: true } },
  //   width: 100,
  // },
  // {
  //   label: '状态',
  //   prop: 'materialsStatus',
  //   enum: () => proxy.useColumnsDict('supplier_status_type'),
  //   // search: { el: 'select', props: { filterable: true } },
  //   width: 100,
  // },
  // {
  //   label: '物料分类',
  //   width: 140,
  //   prop: 'materialsGroupName',
  // },
  // {
  //   label: '库存单位',
  //   width: 109,
  //   prop: 'stockUnit',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  //   search: { el: 'select', props: { filterable: true } },
  // },
  // {
  //   label: '批号管理',
  //   width: 140,
  //   prop: 'phFlag',
  //   enum: [
  //     { label: '否', value: '0' },
  //     { label: '是', value: '1' },
  //   ],
  // },
  // {
  //   label: '出库跟踪入库',
  //   width: 140,
  //   prop: 'issueTracking',
  //   enum: [
  //     { label: '否', value: '0' },
  //     { label: '是', value: '1' },
  //   ],
  // },
  // {
  //   label: '序列号管理',
  //   width: 140,
  //   prop: 'serialNumberMgtFlag',
  //   enum: [
  //     { label: '否', value: '0' },
  //     { label: '是', value: '1' },
  //   ],
  // },
  // {
  //   label: '是否启用效期',
  //   width: 160,
  //   prop: 'validityMgtFlag',
  //   enum: [
  //     { label: '否', value: '0' },
  //     { label: '是', value: '1' },
  //   ],
  // },
  // {
  //   label: '保质期单位',
  //   width: 115,
  //   prop: 'shelfLifeUnit',
  //   enum: () => proxy.useColumnsDict('shelf_life_unit_code'),
  // },
  // {
  //   label: '保质期',
  //   width: 140,
  //   prop: 'shelfLife',
  // },
  // {
  //   label: '默认仓库',
  //   width: 140,
  //   prop: 'produceStockLocation',
  // },
  // {
  //   label: '安全库存',
  //   width: 140,
  //   prop: 'safetyStock',
  // },
  // {
  //   label: '库存数量',
  //   width: 140,
  //   prop: 'stockQuantity',
  // },
  // {
  //   label: '采购类型',
  //   width: 140,
  //   prop: 'purchaseTypeCode',
  //   search: { el: 'select', props: { filterable: true } },
  //   enum: () => proxy.useColumnsDict('purchase_type_code'),
  // },
  // {
  //   label: '特殊采购类型',
  //   width: 147,
  //   prop: 'specialPurchaseTypeCode',
  //   enum: () => proxy.useColumnsDict('special_purchase_type_code'),
  //   search: { el: 'select', props: { filterable: true } },
  // },
  // {
  //   label: '加权平均价',
  //   width: 140,
  //   prop: 'weightedAveragePrice',
  // },
  // {
  //   label: '创建人姓名',
  //   width: 140,
  //   prop: 'createdNameBy',
  // },
  // {
  //   label: '修改人姓名',
  //   width: 131,
  //   prop: 'updatedNameBy',
  // },
  // {
  //   label: '创建时间',
  //   width: 159,
  //   prop: 'createdTime',
  // },
  // {
  //   label: '重量单位',
  //   width: 159,
  //   prop: 'weightUnitCode',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  // },
  // {
  //   label: '基本计量单位',
  //   width: 159,
  //   prop: 'unitOfMeasurementCode',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  // },
  // {
  //   label: '图号',
  //   width: 159,
  //   prop: 'drawingNo',
  // },
  // {
  //   label: '材质',
  //   width: 159,
  //   prop: 'textureOfMaterial',
  // },
  // {
  //   label: '长',
  //   width: 159,
  //   prop: 'length',
  // },
  // {
  //   label: '宽',
  //   width: 159,
  //   prop: 'width',
  // },
  // {
  //   label: '高',
  //   width: 159,
  //   prop: 'height',
  // },
  // {
  //   label: '直径',
  //   width: 159,
  //   prop: 'diameter',
  // },
  // {
  //   label: '尺寸单位',
  //   width: 159,
  //   prop: 'measurementUnitCode',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  // },
  // {
  //   label: '体积',
  //   width: 159,
  //   prop: 'volume',
  // },
  // {
  //   label: '体积单位',
  //   width: 159,
  //   prop: 'volumeUnitCode',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  // },
  // {
  //   label: '毛重',
  //   width: 159,
  //   prop: 'grossWeight',
  // },
  // {
  //   label: '净重',
  //   width: 159,
  //   prop: 'netWeight',
  // },
  // {
  //   label: '最小库存',
  //   width: 159,
  //   prop: 'minStock',
  // },
  // {
  //   label: '最大库存',
  //   width: 159,
  //   prop: 'maxStock',
  // },
  // {
  //   label: '批量大小',
  //   width: 159,
  //   prop: 'batchSize',
  // },
  // {
  //   label: '条码',
  //   width: 159,
  //   prop: 'barCode',
  // },
  // {
  //   label: '采购单位',
  //   width: 159,
  //   prop: 'purchaseUnit',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  // },
  // {
  //   label: '进项税',
  //   width: 159,
  //   prop: 'inputTaxCode',
  //   enum: () => proxy.useColumnsDict('tax_rate'),
  // },
  // {
  //   label: '销售单位',
  //   width: 159,
  //   prop: 'marketUnitCode',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  // },
  // {
  //   label: '销售组织',
  //   width: 159,
  //   prop: 'marketOrgCode',
  //   enum: () => proxy.useColumnsDict('market_org_code'),
  // },
  // {
  //   label: '分销渠道',
  //   width: 159,
  //   prop: 'distributionChannelsCode',
  //   enum: () => proxy.useColumnsDict('distribution_channels_code'),
  // },
  // {
  //   label: '保修期',
  //   width: 159,
  //   prop: 'warrantyPeriodCode',
  // },
  // {
  //   label: '销项税',
  //   width: 159,
  //   prop: 'outputTaxCode',
  //   enum: () => proxy.useColumnsDict('tax_rate'),
  // },
  // {
  //   label: '工厂',
  //   width: 159,
  //   prop: 'produceFactoryCode',
  // },
  // {
  //   label: 'MRP类型',
  //   width: 159,
  //   prop: 'mrpTypeCode',
  //   enum: () => proxy.useColumnsDict('mrp_type_code'),
  // },
  // {
  //   label: '利润中心',
  //   width: 159,
  //   prop: 'profitCenterCode',
  //   enum: () => proxy.useColumnsDict('profit_center_code'),
  // },
  // {
  //   label: '价格控制',
  //   width: 159,
  //   prop: 'priceControlCode',
  //   enum: () => proxy.useColumnsDict('price_control_code'),
  // },
  // {
  //   label: '标准价格',
  //   width: 159,
  //   prop: 'standardPrice',
  // },
  // {
  //   label: '存货列表',
  //   width: 159,
  //   prop: 'stockListCode',
  //   enum: () => proxy.useColumnsDict('stock_list_code'),
  // },
  // {
  //   label: '货币编码',
  //   width: 159,
  //   prop: 'currencyCode',
  //   enum: () => proxy.useColumnsDict('currency_code'),
  // },
  // {
  //   label: '期初库存',
  //   width: 159,
  //   prop: 'totalStock',
  // },
  // {
  //   label: '总价值',
  //   width: 159,
  //   prop: 'totalValue',
  // },
  // {
  //   label: '创建人编号',
  //   width: 159,
  //   prop: 'createdBy',
  // },
  // {
  //   label: '修改人编码',
  //   width: 159,
  //   prop: 'updatedBy',
  // },
  // {
  //   label: '修改时间',
  //   width: 159,
  //   prop: 'updatedTime2',
  // },
  // {
  //   label: '转换因子',
  //   width: 159,
  //   prop: 'conversionFactor',
  // },
  // {
  //   label: '存货代码',
  //   width: 159,
  //   prop: 'inventoryCode',
  // },
  // {
  //   label: '停用日期',
  //   width: 159,
  //   prop: 'deactivationDate',
  // },
  // {
  //   label: '条码管理',
  //   width: 159,
  //   prop: 'barCodeFlag',
  //   enum: [
  //     { label: '否', value: '0' },
  //     { label: '是', value: '1' },
  //   ],
  // },
  // {
  //   label: '客户编码',
  //   prop: 'customerCode',
  //   width: 159,
  // },
  // {
  //   label: '客户名称',
  //   width: 159,
  //   prop: 'customerName',
  // },
  // {
  //   label: '项目号',
  //   width: 159,
  //   prop: 'projectCode',
  // },
  // {
  //   label: '产品编码',
  //   width: 159,
  //   prop: 'productCode',
  // },
  // {
  //   label: '成品重量',
  //   width: 159,
  //   prop: 'productWeight',
  // },
  // {
  //   label: '毛坯成品重量',
  //   width: 159,
  //   prop: 'roughcastProductWeight',
  // },
  // {
  //   label: '毛坯重量',
  //   width: 159,
  //   prop: 'roughcastWeight',
  // },
  // {
  //   label: '铸造重量',
  //   width: 159,
  //   prop: 'castingWeight',
  // },
  // {
  //   label: '牌号',
  //   width: 159,
  //   prop: 'brand',
  // },
  // {
  //   label: '废品类型',
  //   width: 159,
  //   prop: 'scrapType',
  //   enum: () => proxy.useColumnsDict('material_scrap_type'),
  // },
  // {
  //   label: '磨具分摊类型',
  //   width: 159,
  //   prop: 'moldAllocationType',
  //   enum: () => proxy.useColumnsDict('purchase_order_cost_sharing_method'),
  // },
  // {
  //   label: '产品材料',
  //   width: 159,
  //   prop: 'productMaterials',
  // },
  // {
  //   label: '发货单位',
  //   width: 159,
  //   prop: 'forwardingUnit',
  //   enum: () => proxy.useColumnsDict('unit_of_measurement_code'),
  // },
  // {
  //   label: '采购员',
  //   width: 159,
  //   prop: 'buyerName',
  // },
  // {
  //   label: '供应类型',
  //   width: 159,
  //   prop: 'supplyType',
  //   enum: () => proxy.useColumnsDict('supply_type'),
  // },
  // {
  //   label: '资产标识',
  //   width: 159,
  //   prop: 'assetsFlag',
  //   enum: [
  //     { label: '否', value: '0' },
  //     { label: '是', value: '1' },
  //   ],
  // },
  // {
  //   label: '超额交货',
  //   width: 159,
  //   prop: 'overDelivery',
  // },
  // {
  //   label: '送货地址',
  //   width: 159,
  //   prop: 'shippingAddress',
  // },
  {
    label: '物料编号',
    width: 220,
    prop: 'materialsCode',
    search: {
      order: 1,
      el: 'input',
      // defaultValue: route.query.materialsCode || '',
      props: { clearable: true },
    },
  },
  {
    label: '物料名称',
    width: 220,
    prop: 'materialsName',
    // search: {
    //   el: 'input',
    // },
  },
  {
    prop: 'projectCode',
    label: '项目号',
    search: {
      el: 'input',
    },
  },
  {
    prop: 'block',
    label: '分段号',
    search: {
      el: 'input',
    },
  },
  // {
  //   prop: 'partNO',
  //   label: '零件号',
  //   search: {
  //     el: 'input',
  //   },
  //   isShow: false,
  // },
  {
    label: '规格',
    width: 159,
    prop: 'specifications',
    search: { el: 'input' },
  },
  {
    label: '材质',
    width: 159,
    prop: 'textureOfMaterial',
    search: { el: 'input' },
  },
  {
    label: '阶段',
    width: 159,
    prop: 'stage',
    enum: () => proxy.useColumnsDict('stage_type'),
  },
  {
    label: '加工',
    width: 159,
    prop: 'process',
  },
  {
    label: '打磨',
    width: 159,
    prop: 'polish',
  },
  {
    label: '零件类型',
    width: 159,
    prop: 'partType', // TODO: P1 板材 P2 型材
    enum: () => proxy.useColumnsDict('part_type'),
  },
  {
    label: '型材长度',
    width: 159,
    prop: 'profileLength',
  },
  {
    label: '重量',
    width: 159,
    prop: 'weight',
  },
  {
    label: '切割图号',
    width: 159,
    prop: 'drawingNo',
  },
  {
    label: '组立',
    width: 159,
    prop: 'assembly',
    // search: { el: 'input' },
  },
  {
    label: '特殊类型', // TODO: 1 自制 2 外协
    width: 159,
    prop: 'specialType',
    enum: () => proxy.useColumnsDict('special_type'),
  },
  {
    label: '对接焊总长',
    width: 150,
    prop: 'buttTotalLength',
    // search: { el: 'input' },
  },
  {
    label: '角焊总长',
    width: 150,
    prop: 'filletTotalLength',
    // search: { el: 'input' },
  },
  {
    label: '自制生产时间(秒)',
    width: 150,
    prop: '自制生产时间(秒)',
    // search: { el: 'input' },
  },
  {
    label: '采购交货时间(天)',
    width: 150,
    prop: '采购交货时间',
    // search: { el: 'input' },
  },
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      wsllTable.value?.refresh();
      wsllTable.value?.clearSelection();
    }
  },
  { deep: true, immediate: true },
);

const tableRadioChange = (v, row) => {
  emit('submit', row);
  close();
};

const confirm = () => {
  const list = wsllTable.value.selectedList;
  if (list.length) {
    emit('submit', list);
    close();
  } else {
    proxy.showWarning('请选择物料');
  }
  console.log(list, 'list');
};

const singleAppendHandle = () => {
  const list = wsllTable.value.selectedList;
  if (list.length) {
    emit('submit', list);
    // wsllTable.value?.clearRadio(); //清除勾选状态
    wsllTable.value?.clearSelection(); //清除勾选状态
  } else {
    proxy.showWarning('请选择物料');
  }
  console.log(list, 'list');
};

const close = () => {
  wsllTable.value?.clearRadio(); //清除勾选状态
  wsllTable.value?.clearSelection(); //清除勾选状态
  emit('update:modelValue', false);
};
</script>
