<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2024-09-26 18:19:59
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 项目号主数据弹窗
-->
<template>
  <div class="w-[100%]">
    <el-input
      v-model="localValue"
      placeholder="请选择或输入后回车查询"
      style="width: 100%"
      clearable
      @input="input"
      @keyup.enter="projectNumberEnter"
      :disabled="props.disabled"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <ProjectNoMasterDialog v-model="visible" @submit="submit" />
  </div>
</template>

<script setup lang="jsx" name="ProjectNoMasterModal">
import { productNumberByNumber } from './services';
import ProjectNoMasterDialog from '@/components/ProjectNoMasterDialog/index.vue';
import { watch } from 'vue';
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// 本地数据
const localValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
);

const emit = defineEmits();
const { proxy } = getCurrentInstance();
// 项目号弹窗
const visible = ref(false);

function input(v) {
  emit('update:modelValue', v);
}
// 打开项目
function projectNumberClick() {
  if (props.disabled) return;
  visible.value = true;
}

// 项目回车查询
function projectNumberEnter() {
  // 判断项目是否存在
  exitProject(props.modelValue);
}

// 选择项目
function submit(r) {
  visible.value = false;
  emit('update:modelValue', r.projectCode);
  emit('submit', r);
}

async function exitProject(projectCode) {
  try {
    const { data } = await productNumberByNumber({ projectCode, pageNum: 1, pageSize: 20 });
    if (data?.records?.length) {
      const [r] = data?.records;
      emit('update:modelValue', r.projectCode);
      emit('submit', r);
    } else {
      proxy.showWarning(`当前项目号不存在`);
    }
  } catch (error) {}
}
</script>
