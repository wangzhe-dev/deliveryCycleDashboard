<template>
  <div class="w-full">
    <!-- @keyup.enter="projectNumberEnter" -->
    <el-input
      v-model="localValue"
      placeholder="请选择或输入盘点单号后回车查询"
      class="w-full"
      readonly
      @input="input"
      :disabled="props.disabled"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <StockTakingOrderDialog v-model="visible" :params="props.params" @submit="handleSubmit" />
  </div>
</template>

<script setup lang="jsx" name="StockTakingOrderDialog">
import { checkCode } from './services';
import StockTakingOrderDialog from '@/components/StockTakingOrderDialog/index';

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
  emit('update:modelValue', r.documentNo);
  emit('submit', r);
}

async function exitProject(documentNo) {
  try {
    const { data } = await checkCode({ documentNo });
    if (data?.documentNo) {
      emit('update:modelValue', data.documentNo);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前盘点单号不存在`);
    }
  } catch (error) {}
}
</script>
