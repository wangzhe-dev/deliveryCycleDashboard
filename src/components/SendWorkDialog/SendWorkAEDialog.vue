<template>
  <el-dialog
    :title="type === 'add' ? '新增行信息' : type === 'batchAdd' ? '整单派工' : '编辑行信息'"
    v-model="open"
    width="800px"
    append-to-body
    @close="cancel"
    :close-on-click-modal="false"
  >
    <WsllForm
      :formData="formData"
      :formColumns="formColumns"
      :formRules="formRules"
      label-width="120px"
      ref="wsllFormRef"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup name="AEDialog">
import {
  listAllEmployee,
  selectEquipmentInfoByArea,
  selectFactoryTree,
  selectWorkGroupPerson,
} from './services';
import _ from 'lodash';
import { assignFormData, mapValueToLabel } from '@/utils/utils';
const { proxy } = getCurrentInstance();
const emit = defineEmits(['refresh']);
const type = ref('');
const open = ref(false);
let cloneData = {};
const wsllFormRef = ref(null);

const { unit_of_measurement_code, stock_location } = proxy.useDictList([
  'unit_of_measurement_code',
  'stock_location',
]);
const employeeList = ref([]);
const EquipmentList = ref([]);
const groupList = ref([]);
const lineList = ref([]);

const A = {
  create: () => {
    const initData = {
      planEquipmentCode: '', // 生产设备编码
      planEquipmentName: '', //生产设备名称
      planQty: 0, // 计划产量
      planUserId: '', // 责任人编码
      planUserName: '', //责任人名称
      productionWorkShopId: '', //车间id
      productionWorkShopCode: '', //车间编码
      productionWorkShopName: '', //车间名称
      lineId: '', //产线id
      productionLineCode: '', //产线编码
      productionLineName: '', //产线名称
      workGroupId: '', //班组id
      workGroup: '', //班组编码
      workGroupName: '', //班组名称
    };

    const initRules = {
      planEquipmentCode: [{ required: true, message: '必填字段' }],
      planQty: [{ required: true, message: '必填字段' }],
      workGroupId: [{ required: true, message: '必填字段' }],
    };

    const initColumn = [
      {
        xType: 'Select',
        label: '产线',
        options: lineList,
        prop: 'lineId',
        span: 12,
        onChange: changeLine,
      },
      {
        xType: 'Select',
        label: '生产设备',
        options: EquipmentList,
        prop: 'planEquipmentCode',
        span: 12,
        onChange: changePlanEquipmentCode,
      },
      {
        xType: 'Select',
        label: '班组',
        options: groupList,
        prop: 'workGroupId',
        span: 12,
        onChange: changeGroup,
      },
      {
        xType: 'InputNumber',
        label: '计划产量',
        prop: 'planQty',
        min: 1,
        'controls-position': 'right',
        span: 12,
      },
      {
        xType: 'Select',
        label: '责任人',
        prop: 'planUserId',
        options: employeeList,
        span: 12,
        change: changePlanUserId,
      },
    ];

    return {
      initData,
      initRules,
      initColumn,
    };
  },
};

const { initData, initRules, initColumn } = A.create();

const formData = reactive(initData);

let formRules = reactive(initRules);

const formColumns = reactive(initColumn);

const openDialog = (key, row, outsourcingFlag, area) => {
  open.value = true;
  type.value = key;
  //委外、整单派工、非联合车间，设备不是必填项目
  if (outsourcingFlag == 1 || key === 'batchAdd' || area.productionWorkshopCode !== 'LHCJ') {
    formRules = reactive({
      planQty: [{ required: true, message: '必填字段' }],
      workGroupId: [{ required: true, message: '必填字段' }],
    });
  } else {
    formRules = reactive(initRules);
  }
  //根据车间获取设备
  getEquipmentInfoList(area.productionWorkshopCode);
  //根据车间获取产线
  selectFactoryTreeList(area.productionWorkshopId);
  if (key === 'edit') {
    cloneData = row ? _.cloneDeep(row) : {};
    if (row.lineId) {
      changeLine(row.lineId, 'edit');
    }
    if (row.workGroupId) {
      changeGroup(row.workGroupId, 'edit');
    }
    nextTick(() => {
      assignFormData(formData, cloneData);
      formData.productionWorkShopCode = area.productionWorkshopCode;
      formData.productionWorkShopId = area.productionWorkshopId;
      formData.productionWorkShopName = area.productionWorkshopName;
    });
  } else {
    formData.productionWorkShopCode = area.productionWorkshopCode;
    formData.productionWorkShopId = area.productionWorkshopId;
    formData.productionWorkShopName = area.productionWorkshopName;
  }
};

/** 表单重置 */
const reset = () => {
  cloneData = {};
  wsllFormRef.value?.formRef?.resetFields();
};
/** 取消按钮 */
const cancel = () => {
  open.value = false;
  reset();
};
/** 提交按钮 */
const submitForm = () => {
  wsllFormRef.value?.formRef?.validate(async (valid) => {
    if (valid) {
      // if (type.value === 'edit') {
      emit('refresh', type.value, { ...cloneData, ...formData });
      cancel();
      // }
    }
  });
};

function changePlanUserId(v, r) {
  formData.planUserName = mapValueToLabel(v, r);
}
//改变设备
function changePlanEquipmentCode(v) {
  if (v) {
    formData.planEquipmentName = EquipmentList.value.find((item) => item.value === v)?.label;
  } else {
    formData.planEquipmentName = '';
  }
}

// 请求采购人员数据
const getEmployeeList = async () => {
  try {
    const { code, data } = await listAllEmployee();
    if (code === 200) {
      employeeList.value = data.map(({ employeeName: label, employeeNumber: value }) => ({
          label,
          value,
        }));
      return;
    }
    employeeList.value = [];
  } catch (error) {
    console.error(error);
    employeeList.value = [];
  }
};

const getEquipmentInfoList = async (factoryCode) => {
  try {
    const { code, data } = await selectEquipmentInfoByArea({
      pageNum: 1,
      pageSize: 9999,
      areaCode: factoryCode,
    });
    if (code === 200) {
      EquipmentList.value = data.records.map(({ equipmentName: label, equipmentCode: value }) => ({
        label,
        value,
      }));
      return;
    }
    EquipmentList.value = [];
  } catch (error) {
    console.error(error);
    EquipmentList.value = [];
  }
};
//获取产线
async function selectFactoryTreeList(factoryId) {
  try {
    const { code, data } = await selectFactoryTree({
      superiorId: factoryId,
    });
    if (code === 200) {
      lineList.value = data.map(({ name: label, id: value, code: code }) => ({
        label,
        value,
        code,
      }));
      return;
    }
    lineList.value = [];
  } catch (error) {
    console.error(error);
    lineList.value = [];
  }
}
//改变产线、获取班组
async function changeLine(factoryId, type) {
  //1、获取产线的名字、编码
  //2、编辑状态不清空数据
  if (!type) {
    formData.workGroup = '';
    formData.workGroupId = '';
    formData.workGroupName = '';
    groupList.value = [];
    formData.planUserName = '';
    formData.planUserId = '';
  }

  if (factoryId) {
    let line = lineList.value.find((item) => item.value === factoryId);
    formData.productionLineCode = line?.code;
    formData.productionLineName = line?.label;
    try {
      const { code, data } = await selectFactoryTree({
        superiorId: factoryId,
      });
      if (code === 200) {
        groupList.value = data.map(({ name: label, id: value, code: code }) => ({
          label,
          value,
          code,
        }));
        return;
      }
      groupList.value = [];
    } catch (error) {
      console.error(error);
      groupList.value = [];
    }
  } else {
    formData.productionLineCode = '';
    formData.productionLineName = '';
    formData.lineId = '';
  }
}
//改变班组
async function changeGroup(factoryId, type) {
  if (factoryId) {
    //获取班组编码、名称
    let group = groupList.value.find((item) => item.value === factoryId);
    formData.workGroup = group?.code;
    formData.workGroupName = group?.label;
    try {
      const { code, data } = await selectWorkGroupPerson({
        workGroupId: factoryId,
      });
      if (code === 200) {
        employeeList.value = data.map(({ nickName: label, userName: value }) => ({
          label,
          value,
        }));
        return;
      }
      employeeList.value = [];
    } catch (error) {
      console.error(error);
      employeeList.value = [];
    }
  } else {
    formData.workGroup = '';
    formData.workGroupName = '';
  }
  if (!type) {
    //清空用户
    formData.planUserName = '';
    formData.planUserId = '';
  }
}

getEmployeeList();

defineExpose({
  openDialog,
});
</script>
