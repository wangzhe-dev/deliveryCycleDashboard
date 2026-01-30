<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-11-15 09:27:15
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 核算维度Input
-->
<template>
  <div class="w-full">
    <!-- 或输入后回车查询 -->
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
    <PadMasterDataDialog
      :params="props.params"
      :title="props.title"
      v-model="visible"
      @submit="handleSubmit"
      :checkType="props.checkType"
    />
  </div>
</template>

<script setup lang="jsx" name="PadMasterDataModal">
import { checkCode } from './services';
import PadMasterDataDialog from '@/components/PadMasterDataDialog';
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
    default: '选择核算维度',
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  checkType: {
    type: String,
    default: 'radio',
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
  if (props.checkType !== 'radio') {
    emit('update:modelValue', '');
    emit('submit', r);
    return;
  }
  emit('update:modelValue', r.projectCode);
  emit('submit', r);
}

async function exitProject(projectCode) {
  if (props.checkType !== 'radio') return;
  try {
    const { data } = await checkCode({ purchaseOrderNumber });
    if (data?.purchaseOrderNumber) {
      emit('update:modelValue', data.purchaseOrderNumber);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前编号不存在`);
    }
  } catch (error) {}
}
</script>
