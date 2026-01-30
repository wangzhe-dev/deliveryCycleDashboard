<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-09-27 11:23:05
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 客户主数据弹窗
-->
<template>
  <div class="w-full">
    <el-input
      v-model="localValue"
      placeholder="请选择或输入工序编号后回车"
      class="w-full"
      clearable
      :disabled="props.disabled"
      @input="input"
      @keyup.enter="projectNumberEnter"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon">
            <Search />
          </el-icon>
        </span>
      </template>
    </el-input>
    <StepListDialog
      checkType="radio"
      :params="props.params"
      :title="props.title"
      v-model="visible"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="jsx" name="StepListModal">
import { checkCode } from './services';
import StepListDialog from '@/components/StepDialog/index';
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
    default: '选择工序',
  },
  params: {
    type: Object,
    default: {},
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
  emit('update:modelValue', r.stepCode);
  emit('submit', r);
}

async function exitProject(stepCode) {
  try {
    const {
      data: { records },
    } = await checkCode({ stepCode });
    if (records && records[0] && records[0].stepCode) {
      emit('update:modelValue', records[0].stepCode);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前工序编号不存在`);
    }
  } catch (error) {}
}
</script>
