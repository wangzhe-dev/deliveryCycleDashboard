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
    <ProductionOrderSimpleDialog
      v-model="visible"
      :checkType="props.checkType"
      :params="props.params"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="jsx" name="ProductionOrderSimpleModal">
import { checkCode } from './services';
import ProductionOrderSimpleDialog from '@/components/ProductionOrderSimpleModal/components/ProductionOrderSimpleDialog/index';

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
    default: '请选择工单编号',
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
  exitProductionOrder(props.modelValue);
}

function handleSubmit(row) {
  visible.value = false;
  if (Array.isArray(row)) {
    const codes = row.map((item) => item.productWorkOrderCode).filter(Boolean);
    emit('update:modelValue', codes.join(','));
    emit('submit', row);
    return;
  }
  if (row?.productWorkOrderCode) {
    emit('update:modelValue', row.productWorkOrderCode);
  }
  emit('submit', row);
}

async function exitProductionOrder(productWorkOrderCode) {
  if (!productWorkOrderCode) return;
  try {
    const { data } = await checkCode({ productWorkOrderCode });
    const record = data?.records?.[0] || data?.list?.[0] || data?.rows?.[0];
    if (record?.productWorkOrderCode) {
      emit('update:modelValue', record.productWorkOrderCode);
      emit('submit', record);
    } else {
      proxy.showWarning('当前工单编号不存在');
    }
  } catch (error) {}
}
</script>
