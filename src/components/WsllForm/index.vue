<!--
 * @Author: zhaijs
 * @Date: 2023-08-08 16:25:27
 * @LastEditTime: 2025-01-06 14:42:58
 * @Description: Form封装
-->
<template>
  <el-form ref="formRef" :model="props.formData" :rules="props.formRules" v-bind="$attrs">
    <el-row>
      <template :key="index" v-for="(column, index) in props.formColumns">
        <el-col :key="index" :span="column.span" :offset="column.offset" v-if="!column.hidden">
          <template v-if="column.slotName">
            <slot :name="column.slotName"></slot>
          </template>
          <el-form-item
            :label="column.label"
            :prop="column.prop"
            v-else
            v-bind="column.formItemOpts"
          >
            <component
              :is="componentsTypes[column.xType]"
              v-bind="column"
              v-on="column.handles || {}"
              v-model="props.formData[column.prop]"
              :disabled="props.allDisabled || column.disabled"
            ></component>
          </el-form-item>
        </el-col>
      </template>
    </el-row>
  </el-form>
</template>
<script setup name="WsllForm">
import { ref, markRaw } from 'vue';
import Input from './components/WsllInput'; // Input 入框
import Autocomplete from './components/WsllAutocomplete'; // Autocomplete 自动补全输入框
import Select from './components/WsllSelect'; // Select 下拉框
import SelectV2 from './components/WsllSelectV2'; // Select V2 虚拟列表选择器
import DatePicker from './components/WsllDatePicker'; // DatePicker 日期时间选择器
import TimePicker from './components/WsllTimePicker'; // TimePicker 时间选择器
import TimeSelect from './components/WsllTimeSelect'; // TimeSelect 时间选择
import InputNumber from './components/WsllInputNumber'; // InputNumber 数字输入框
import Radio from './components/WsllRadio'; // Radio 单选框
import CheckboxGroup from './components/WsllCheckboxGroup'; // CheckboxGroup 多选框
import Checkbox from './components/WsllCheckbox';
import Switch from './components/WsllSwitch'; // Switch 开关
import Slider from './components/WsllSlider'; // Slider 滑块
import Rate from './components/WsllRate'; // Rate 评分
import Transfer from './components/WsllTransfer'; // Transfer 穿梭框
import Cascader from './components/WsllCascader'; // Cascader 级联框
import ColorPicker from './components/WsllColorPicker'; // ColorPicker 颜色选择器
import Tree from './components/WsllTree'; // Tree 树形控件
import TreeSelect from './components/WsllTreeSelect'; // TreeSelect 树形选择
import TreeV2 from './components/WsllTreeV2'; // Tree V2 虚拟化树形控件
import ProjectNoMasterModal from '@/components/ProjectNoMasterModal';
import FactorySelect from '@/components/FactorySelect';
import WorkshopSelect from '@/components/WorkshopSelect';
import WarehouseSelect from '@/components/WarehouseSelect';
import MaterialMasterModal from '@/components/MaterialMasterModal';
import ProcessMaintenanceModal from '@/components/ProcessMaintenanceModal';
import SendWorkTaskModal from '@/components/SendWorkTaskModal';
import EquipmentSelect from '@/components/EquipmentSelect';
import LocationSelect from '@/components/LocationSelect';
import StepListModal from '@/components/StepListModal';
import PlainText from './components/WsllplainText';

const props = defineProps({
  // 表单数据
  formData: {
    type: Object,
    default: () => {},
  },
  // 表单配置项
  formColumns: {
    type: Array,
    default: () => [],
  },
  // 表单规则验证
  formRules: {
    type: Object,
    default: () => {},
  },
  allDisabled: {
    type: Boolean,
    default: false,
  },
});
// 定义动态组件
const componentsTypes = markRaw({
  Input,
  Autocomplete,
  Select,
  SelectV2,
  DatePicker,
  TimePicker,
  TimeSelect,
  InputNumber,
  Radio,
  CheckboxGroup,
  Checkbox,
  Switch,
  Slider,
  Rate,
  Transfer,
  Cascader,
  ColorPicker,
  Tree,
  TreeSelect,
  TreeV2,
  ProjectNoMasterModal,
  WorkshopSelect,
  FactorySelect,
  WarehouseSelect,
  MaterialMasterModal,
  ProcessMaintenanceModal,
  SendWorkTaskModal,
  EquipmentSelect,
  LocationSelect,
  StepListModal,
  PlainText,
});
// 将表单绑定的ref暴露给父组件
const formRef = ref();
defineExpose({ formRef });
</script>
