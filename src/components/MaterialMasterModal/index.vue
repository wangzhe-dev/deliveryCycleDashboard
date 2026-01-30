<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: liangjia
 * @LastEditTime: 2025-06-12 15:54:11
 * @Description: 物料主数据Form
-->
<template>
  <div class="w-full">
    <el-input
      v-model="localValue"
      :placeholder="placeholder"
      class="w-full"
      clearable
      :disabled="props.disabled"
      readonly
      @input="input"
      @keyup.enter="handleInputEnter"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="handleInputClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <MaterialMasterDialog v-model="visible" @submit="handleSubmit" :checkType="props.checkType" />
  </div>
</template>

<script setup lang="jsx" name="MaterialMasterModal">
import { checkCode } from './services';
import MaterialMasterDialog from '@/components/MaterialMasterDialog/index';
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  checkType: {
    type: String,
    default: 'radio',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    // default: '请选择或输入物料编号后回车查询',
    default: '请选择物料编号',
  },
});

// 本地数据
const localValue = ref('');

watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
  { deep: true, immediate: true },
);

const emit = defineEmits();
const { proxy } = getCurrentInstance();

const visible = ref(false);

function input(v) {
  emit('update:modelValue', v);
}

function handleInputClick() {
  if (props.disabled) return;
  visible.value = true;
}

// 编号回车查询
function handleInputEnter() {
  // 判断编号是否存在
  exitProject(props.modelValue);
}

function handleSubmit(r) {
  visible.value = false;
  emit('update:modelValue', r.materialsCode);
  emit('submit', r);
}

async function exitProject(materialsCode) {
  try {
    const { data } = await checkCode({ materialsCode });
    if (data?.materialsCode) {
      emit('update:modelValue', data.materialsCode);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前物料编号不存在`);
    }
  } catch (error) {}
}
</script>
