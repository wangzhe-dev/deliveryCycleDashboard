<template>
  <el-dialog
    v-model="open"
    :title="type === 'add' ? '新增分段任务' : '编辑分段任务'"
    width="720px"
    append-to-body
    :close-on-click-modal="false"
    @close="onCancel"
  >
    <WsllForm
      ref="formRef"
      :formData="formData"
      :formColumns="formColumns"
      :formRules="formRules"
      label-width="110px"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancel">取 消</el-button>
        <el-button type="primary" @click="onSubmit">保 存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="CurvedSurfaceTaskAEDialog">
import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue';
import {
  segmentTaskAdd,
  segmentTaskUpdate,
  fetchVesselTypeList,
  fetchFetalPositionList,
} from '../services';
import { curvedSegment, fetchVenueOptionsList } from './services';

const props = defineProps({
  statusOptions: {
    type: Array,
    default: () => [],
  },
  siteOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['refresh']);
const { proxy } = getCurrentInstance();

const normalizePlannedSiteId = (value) => {
  if (Array.isArray(value)) return value.map((item) => `${item}`.trim()).find(Boolean) || '';
  if (value === null || value === undefined) return '';
  const str = `${value}`.trim();
  if (!str) return '';
  // If backend returns comma-separated values, keep the first for single select
  return str.includes(',') ? str.split(',').find((item) => item.trim())?.trim() || '' : str;
};

//获取分段数据
const curvedSegmentList = ref([]);
function getCurvedSegmentList(projectShipCode) {
  const shipCode = projectShipCode || formData.projectNumber || formData.shipNo;
  if (!shipCode) {
    curvedSegmentList.value = [];
    return;
  }
  curvedSegment({ projectShipCode: shipCode }).then((res) => {
    curvedSegmentList.value = res.data;
    console.log(res.data);
  });
}
//获取船号数据
const shipNoList = ref([]);
getFetchVenueOptionsList();
function getFetchVenueOptionsList() {
  fetchVenueOptionsList().then((res) => {
    shipNoList.value = res.data;
    console.log(shipNoList.value);
    console.log('shipNoList.value');
  });
}

const open = ref(false);
const type = ref('add');
const formRef = ref(null);
const vesselTypeOptions = ref([]);
const fixtureOptions = ref([]);

const buildDefaultForm = () => ({
  id: undefined,
  segmentNo: '',
  segmentName: '',
  projectNumber: '',
  vesselType: '',
  vesselTypeName: '',
  weightT: null,
  heightM: null,
  buildCycleDays: null,
  maxPersons: null,
  flipTime: '',
  fixtureCode: '',
  refSegmentNo: '',
  plannedSiteIds: '',
  planStart: '',
  planFinish: '',
  responsibleName: '',
  responsibleCode: '',
  status: 0,
  remark: '',
  virtualTask: 0,
  grandSegmentCode: '',
  graphJson:'{}'
});

const formData = reactive(buildDefaultForm());

const formRules = reactive({
  grandSegmentCode: [{ required: true, message: '请输入总段编号', trigger: ['blur', 'change'] }],
  segmentNo: [{ required: true, message: '请输入分段编号', trigger: ['blur', 'change'] }],
  segmentName: [{ required: true, message: '请输入分段名称', trigger: ['blur', 'change'] }],
  vesselType: [{ required: true, message: '请选择所属船型', trigger: ['blur', 'change'] }],
  planStart: [{ required: true, message: '请选择计划开始时间', trigger: ['change', 'blur'] }],
  planFinish: [{ required: true, message: '请选择计划完成时间', trigger: ['change', 'blur'] }],
});

const formColumns = computed(() => [
  {
    xType: 'Select',
    label: '船号',
    prop: 'projectNumber',
    options: shipNoList.value,
    span: 12,
    maxlength: 80,
    'show-word-limit': true,
    labelFiled: 'shipNo',
    valueFiled: 'shipNo',
    change: (value) => {
      const target = shipNoList.value.find((item) => item.shipNo === value);

      console.log(target);

      formData.projectNumber = value;
      formData.vesselType = target?.vesselType || '';
      getCurvedSegmentList(value);
    },
  },
  {
    xType: 'Select',
    label: '所属船型',
    prop: 'vesselType',
    span: 12,
    options: vesselTypeOptions.value,
    placeholder: '请选择船型',
    filterable: true,
    change: (value) => {
      const target = vesselTypeOptions.value.find((item) => item.value === value);
      formData.vesselTypeName = target?.label || '';
    },
  },

  {
    xType: 'Select',
    label: '分段编号',
    prop: 'segmentNo',
    options: curvedSegmentList.value,
    labelFiled: 'segmentNumber',
    valueFiled: 'segmentNumber',
    span: 12,
    maxlength: 80,
    'show-word-limit': true,
    change: (value) => {
      const target = curvedSegmentList.value.find((item) => item.segmentNumber === value);
      formData.segmentName = target?.segmentName || '';
      formData.heightM = target?.heightZMm || 0;
      formData.weightT = target?.weightTon || 0;
      formData.plannedSiteIds =target?.defaultYard;
      formData.grandSegmentCode = target?.blockNumber || '';
      formData.graphJson = target?.footprintJson || '{}';
      console.log(formData)

    },
  },

  {
    xType: 'Input',
    label: '分段名称',
    prop: 'segmentName',
    span: 12,
    maxlength: 80,
    disabled: true,
    'show-word-limit': true,
  },
  {
    xType: 'InputNumber',
    label: '重量(t)',
    prop: 'weightT',
    span: 12,
    min: 0,
    precision: 2,
  },
  //   {
  //   xType: 'InputNumber',
  //   label: 'X 长度(mm)',
  //   prop: 'lengthXMm',
  //   span: 12,
  //   min: 0,
  //   precision: 2,
  // },
  //   {
  //   xType: 'InputNumber',
  //   label: 'Y 宽度(mm)',
  //   prop: 'widthYMm',
  //   span: 12,
  //   min: 0,
  //   precision: 2,
  // },
  {
    xType: 'InputNumber',
    label: '高度(m)',
    prop: 'heightM',
    span: 12,
    min: 0,
    precision: 2,
  },
  {
    xType: 'InputNumber',
    label: '建造周期(天)',
    prop: 'buildCycleDays',
    span: 12,
    min: 0,
  },
  {
    xType: 'InputNumber',
    label: '最大人员数量',
    prop: 'maxPersons',
    span: 12,
    min: 0,
  },
  { xType: 'Input', label: '负责人', prop: 'responsibleName', span: 12, maxlength: 40 },
  { xType: 'Input', label: '负责人编码', prop: 'responsibleCode', span: 12, maxlength: 40 },
  {
    xType: 'Select',
    label: '对称分段',
    prop: 'refSegmentNo',
    span: 12,
    maxlength: 80,
    options: curvedSegmentList.value,
    labelFiled: 'segmentNumber',
    valueFiled: 'segmentNumber',
    'show-word-limit': true,
  },
  {
    xType: 'Select',
    label: '固定胎架',
    prop: 'fixtureCode',
    span: 12,
    options: fixtureOptions.value,
    placeholder: '请选择胎架',
    filterable: true,
  },
  {
    xType: 'Select',
    label: '执行状态',
    prop: 'status',
    span: 12,
    options: props.statusOptions,
    placeholder: '请选择状态',
  },
  {
    xType: 'Switch',
    label: '虚拟任务',
    prop: 'virtualTask',
    span: 12,
    'active-value': 1,
    'inactive-value': 0,
  },
  {
    xType: 'DatePicker',
    label: '计划开始时间',
    prop: 'planStart',
    span: 12,
    type: 'datetime',
    'value-format': 'x',
  },
  {
    xType: 'DatePicker',
    label: '计划完成时间',
    prop: 'planFinish',
    span: 12,
    type: 'datetime',
    'value-format': 'x',
  },
  {
    xType: 'DatePicker',
    label: '翻架时间',
    prop: 'flipTime',
    span: 12,
    type: 'datetime',
    'value-format': 'x',
  },
  {
    xType: 'Select',
    label: '计划场地',
    prop: 'plannedSiteIds',
    span: 24,
    options: props.siteOptions,
    filterable: true,
    placeholder: '请选择计划场地',
  },
  {
    xType: 'Input',
    label: '备注',
    prop: 'remark',
    span: 24,
    type: 'textarea',
    rows: 3,
    maxlength: 200,
    'show-word-limit': true,
  },
]);

const loadVesselTypes = async () => {
  try {
    const res = await fetchVesselTypeList({ pageNum: 1, pageSize: 999 });
    const list = Array.isArray(res?.data?.records) ? res.data.records : res?.data || [];
    vesselTypeOptions.value = list
      .map((item) => ({
        label: item.typeName || item.vesselType || item.typeCode || '--',
        value: item.typeCode || item.typeName || item.id,
        raw: item,
      }))
      .filter((opt) => opt.label && opt.value !== undefined && opt.value !== null);
  } catch (error) {
    proxy?.showError?.(error?.message || '获取船型列表失败');
  }
};

const loadFixtureOptions = async () => {
  try {
    const res = await fetchFetalPositionList({ pageNum: 1, pageSize: 999 });
    const list = Array.isArray(res?.data?.records) ? res.data.records : res?.data || [];
    fixtureOptions.value = list
      .map((item) => ({
        label: item.name,
        value: item.code,
      }))
      .filter((opt) => opt.label && opt.value !== undefined && opt.value !== null);
  } catch (error) {
    proxy?.showError?.(error?.message || '获取胎架列表失败');
  }
};

onMounted(() => {
  loadVesselTypes();
  loadFixtureOptions();
});

const resetForm = () => {
  Object.assign(formData, buildDefaultForm());
};

const openDialog = (mode, row) => {
  type.value = mode;
  open.value = true;
  nextTick(() => {
    formRef.value?.formRef?.resetFields?.();
    resetForm();
    if (mode === 'edit' && row) {
      Object.assign(formData, row, {
        plannedSiteIds:row.plannedSiteIds,
        virtualTask: Number(row.virtualTask ?? 0),
        vesselTypeName: row.vesselTypeName || formData.vesselTypeName,
      });
      getCurvedSegmentList(row?.projectNumber || row?.shipNo);
      console.log(formData);
    }
  });
};

const onCancel = () => {
  open.value = false;
};

const onSubmit = () => {
  formRef.value?.formRef?.validate(async (valid) => {
    if (!valid) return;
    const payload = { ...formData };
    const numericFields = ['weightT', 'heightM', 'buildCycleDays', 'maxPersons'];
    numericFields.forEach((field) => {
      if (payload[field] === '' || payload[field] === null || payload[field] === undefined) {
        delete payload[field];
      } else {
        payload[field] = Number(payload[field]);
      }
    });
    payload.plannedSiteIds = payload.plannedSiteIds;
    payload.virtualTask =
      payload.virtualTask === 1 || payload.virtualTask === '1' ? 1 : 0;
    if (!payload.vesselTypeName) {
      const target = vesselTypeOptions.value.find((opt) => opt.value === payload.vesselType);
      payload.vesselTypeName = target?.label || '';
    }
    console.log(payload);
    const api = type.value === 'edit' ? segmentTaskUpdate : segmentTaskAdd;
    const res = await api(payload);
    proxy
      .responseMsg(res)
      .then(() => {
        open.value = false;
        emit('refresh', type.value);
      })
      .catch(() => {});
  });
};

const setVesselType = ({ code, name } = {}) => {
  formData.vesselType = code || '';
  formData.vesselTypeName = name || '';
};

defineExpose({ openDialog, resetForm, setVesselType });
</script>

<style scoped></style>
