<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-08 09:14:31
 * @Description: 采购退货单
-->
<template>
  <div class="w-full">
    <el-input
      v-model="localValue"
      placeholder="请选择或输入后回车查询"
      class="w-full"
      clearable
      :disabled="props.disabled"
      @input="input"
    >
      <template #suffix>
        <span style="cursor: pointer" @click.native="projectNumberClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <DeliveryReturnsListDialog
      :isRef="props.params.isRef"
      :params="props.params"
      :title="props.title"
      :cbClose="props.cbClose"
      v-model="visible"
      @submit="handleSubmit"
      :checkType="props.checkType"
    />
  </div>
</template>

<script setup lang="jsx" name="DeliveryReturnsListModal">
import { checkCode } from './services';
import DeliveryReturnsListDialog from '@/components/DeliveryReturnsListDialog/index';
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
    default: '选择采购退货单',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'radio',
  },
  cbClose: {
    type: Boolean,
    default: false,
  },
});

const { cbClose } = props;
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
  !cbClose && (visible.value = false);
  if (props.checkType !== 'radio') {
    emit('update:modelValue', '');
    emit('submit', r, r.purchaseReturnNumber, () => (visible.value = false));
    return;
  }
  emit('update:modelValue');
  emit('submit', r, r.purchaseReturnNumber, () => (visible.value = false));
}

async function exitProject(purchaseReturnNumber) {
  if (props.checkType !== 'radio') return;
  try {
    const { data } = await checkCode({ purchaseReturnNumber });
    if (data?.purchaseReturnNumber) {
      emit('update:modelValue', data.purchaseReturnNumber);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前编号不存在`);
    }
  } catch (error) {}
}
</script>
