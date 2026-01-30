<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-04 14:14:29
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 客户主数据弹窗
-->
<template>
  <div class="w-full">
    <el-input
      v-model="localValue"
      placeholder="请选择或输入客户编号后回车查询"
      class="w-full"
      clearable
      :disabled="props.disabled"
      @input="input"
      @keyup.enter="projectNumberEnter"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <CustomerMasterDialog :title="props.title" v-model="visible" @submit="handleSubmit" />
  </div>
</template>

<script setup lang="jsx" name="CustomerMasterModal">
import { checkCode } from './services';
import CustomerMasterDialog from '@/components/CustomerMasterDialog/index';
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择客户主数据',
  },
});

// 本地数据
const localValue = ref('');

watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
);

const emit = defineEmits();
const { proxy } = getCurrentInstance();

const visible = ref(false);

function input(v) {
  emit('update:modelValue', v);
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
  emit('update:modelValue', r.customerCode);
  emit('submit', r);
}

async function exitProject(customerCode) {
  try {
    const { data } = await checkCode({ customerCode });
    if (data?.customerCode) {
      emit('update:modelValue', data.customerCode);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前客户编号不存在`);
    }
  } catch (error) {}
}
</script>
