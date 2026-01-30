<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-02-27 16:25:56
 * @Description: 采购运单
-->
<template>
  <div class="w-full">
    <el-input
      v-model="localValue"
      placeholder="请选择"
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
    <TransportListDialog
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

<script setup lang="jsx" name="TransportListModal">
import { checkCode } from './services';
import TransportListDialog from '@/components/TransportListDialog/index';
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择采购运单',
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
    emit('submit', r, r.transportOrderNumber, () => (visible.value = false));
    return;
  }
  emit('update:modelValue');
  emit('submit', r, r.transportOrderNumber, () => (visible.value = false));
}

async function exitProject(transportOrderNumber) {
  if (props.checkType !== 'radio') return;
  try {
    const { data } = await checkCode({ transportOrderNumber });
    if (data?.transportOrderNumber) {
      emit('update:modelValue', data.transportOrderNumber);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前编号不存在`);
    }
  } catch (error) {}
}
</script>
