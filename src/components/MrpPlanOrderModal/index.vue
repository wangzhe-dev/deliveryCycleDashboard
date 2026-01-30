<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-01-03 15:29:26
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: mrp 计划单
-->
<template>
  <div class="w-full">
    <!-- @keyup.enter="projectNumberEnter" 或输入后回车查询  -->
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
    <MrpPlanOrderDialog
      :params="props.params"
      :title="props.title"
      v-model="visible"
      @submit="handleSubmit"
      :checkType="props.checkType"
    />
  </div>
</template>

<script setup lang="jsx" name="MrpPlanOrderModal">
import { checkCode } from './services';
import MrpPlanOrderDialog from '@/components/MrpPlanOrderDialog/index';
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
    default: '选择MRP计划单',
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
  { deep: true, immediate: true },
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
  emit('update:modelValue', r.mrpOrderCode);
  emit('submit', r);
}

async function exitProject(mrpOrderCode) {
  if (props.checkType !== 'radio') return;
  try {
    const { data } = await checkCode({ mrpOrderCode });
    if (data?.mrpOrderCode) {
      emit('update:modelValue', data.mrpOrderCode);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前编号不存在`);
    }
  } catch (error) {}
}
</script>
