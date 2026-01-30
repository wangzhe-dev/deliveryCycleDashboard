<template>
  <div class="w-full">
    <el-input
      v-model="localValue"
      :placeholder="placeholder"
      class="w-full"
      clearable
      :disabled="props.disabled"
      @input="input"
      @keyup.enter="handleInputEnter"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="handleInputClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <MaterialMasterSimpleDialog
      v-model="visible"
      @submit="handleSubmit"
      :checkType="props.checkType"
      :params="props.params"
    />
  </div>
</template>

<script setup lang="jsx" name="MaterialMasterSimpleModal">
import { checkCode } from './services';
import MaterialMasterSimpleDialog from '@/components/MaterialMasterSimpleModal/components/MaterialMasterSimpleDialog/index';
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
  params: {
    type: Object,
    default: () => ({}),
  },
  placeholder: {
    type: String,
    default: '请选择物料',
  },
});

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

function handleInputClick() {
  if (props.disabled) return;
  visible.value = true;
}

function handleInputEnter() {
  if (props.checkType === 'selection') return;
  exitMaterial(props.modelValue);
}

function handleSubmit(r) {
  visible.value = false;
  if (Array.isArray(r)) {
    const codes = r.map((item) => item.materialsCode).filter(Boolean);
    emit('update:modelValue', codes.join(','));
    emit('submit', r);
    return;
  }
  emit('update:modelValue', r.materialsCode);
  emit('submit', r);
}

async function exitMaterial(materialsCode) {
  try {
    const { data } = await checkCode({ materialsCode });
    if (data?.materialsCode) {
      emit('update:modelValue', data.materialsCode);
      emit('submit', data);
    } else {
      proxy.showWarning('当前物料编号不存在');
    }
  } catch (error) {}
}
</script>
