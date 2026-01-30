<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: hupaocai 13767071930@163.com
 * @LastEditTime: 2025-01-09 17:54:58
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 供应商主数据弹窗
-->
<template>
  <div class="w-full">
    <!-- @keyup.enter="projectNumberEnter" -->
    <el-input
      v-model="localValue"
      :placeholder="props.placeholder"
      class="w-full"
      :readonly="props.readonly"
      :disabled="props.disabled"
      :size="props.size"
      :clearable="props.clearable"
      @input="input"
      @clear="clear"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon">
            <Search />
          </el-icon>
        </span>
      </template>
    </el-input>
    <SupplierMasterDialog v-model="visible" @submit="handleSubmit" />
  </div>
</template>
<script setup lang="jsx" name="SupplierMasterModal">
import { reactive } from 'vue';
import { checkCode } from './services';
import SupplierMasterDialog from '@/components/SupplierMasterDialog/index';
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'default',
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: '请选择供应商',
  },
});

// 本地数据
const localValue = ref('');

// 临时选出的数据
const tempData = ref({ supplierName: '', supplierCode: '' });

watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
  { immediate: true },
);

const emit = defineEmits();
const { proxy } = getCurrentInstance();

const visible = ref(false);

function input(v) {
  emit('update:modelValue', v);

  emit(
    'submit',
    v === tempData.value.supplierCode ? tempData.value : { supplierName: '', supplierCode: v },
  );
}

function clear() {
  emit('submit', { supplierName: '', supplierCode: '' });
  tempData.value = { supplierName: '', supplierCode: '' };
}

function projectNumberClick() {
  if (props.disabled) return;
  visible.value = true;
}

// 项目回车查询
function projectNumberEnter() {
  // 判断项目是否存在
  exitProject(props.modelValue);
}

function handleSubmit(r) {
  visible.value = false;
  emit('update:modelValue', r.supplierCode);

  tempData.value = r;
  emit('submit', r);
}

async function exitProject(supplierCode) {
  try {
    const { data } = await checkCode({ supplierCode });
    if (data?.supplierCode) {
      emit('update:modelValue', data.supplierCode);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前供应商编号不存在`);
    }
  } catch (error) {}
}
</script>
