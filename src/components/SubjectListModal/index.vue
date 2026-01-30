<!--
 * @Author: zhaijinsong
 * @Date: 2023-11-13 13:39:26
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-11-15 08:40:10
 * @Description: 科目model
-->
<template>
  <div class="w-full">
    <!-- @keyup.enter="projectNumberEnter" -->
    <el-input
      v-model="localValue"
      placeholder="请选择"
      class="w-full"
      clearable
      @input="input"
      :disabled="props.disabled"
      :size="props.size"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <SubjectListDialog
      v-model="visible"
      :params="props.params"
      :checkType="props.checkType"
      @submit="handleSubmit"
      :submitVerify="props.submitVerify"
    />
  </div>
</template>

<script setup lang="jsx" name="SubjectListModal">
import { checkCode } from './services';
import SubjectListDialog from '@/components/SubjectListDialog';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'radio',
  },
  size: {
    type: String,
    default: 'default',
  },
  submitVerify: {
    type: Function,
    default: null,
  },
});

// 本地数据
const localValue = ref('');

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
  emit('update:modelValue', r.subjectCode);
  emit('submit', r);
}

async function exitProject(subjectCode) {
  try {
    const { data } = await checkCode({ subjectCode });
    if (data?.subjectCode) {
      emit('update:modelValue', data.subjectCode);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前科目编码不存在`);
    }
  } catch (error) {}
}
</script>
