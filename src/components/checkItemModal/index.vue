<!--
 * @Author: heqi
 * @Date: 2023-09-07 14:20:50
 * @LastEditTime: 2025-01-09 13:31:29
 * @Description: 财务科目主数据放大镜
-->

<template>
  <div class="w-[100%]">
    <el-input
      v-model="localValue"
      placeholder="请选择"
      style="width: 100%"
      clearable
      @input="input"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="accountMaterClick">
          <el-icon class="el-input__icon">
            <Search />
          </el-icon>
        </span>
      </template>
    </el-input>
    <CheckItemDialog v-model="visible" @submit="submit" :processesId="localProcessesId" />
  </div>
</template>

<script setup lang="jsx" name="bomModal">
import CheckItemDialog from '@/components/checkItemDialog/index.vue';
import { watch } from 'vue';
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  processesId: {
    type: String,
    default: '',
  },
});

// 本地数据
const localValue = ref('');
const localProcessesId = ref('');

watch(
  () => props.processesId,
  (nV) => {
    localProcessesId.value = nV;
  },
);
watch(
  () => props.modelValue,
  (nV) => {
    localValue.value = nV;
  },
);

const emit = defineEmits();
// 项目号弹窗
const visible = ref(false);
function input(v) {
  emit('update:modelValue', v);
}
// 打开项目
function accountMaterClick() {
  visible.value = true;
}

// 选择项目
function submit(r) {
  visible.value = false;
  emit('update:modelValue', r.projectCode);
  emit('submit', r);
}
</script>
<style scoped>
.searchIcon {
  background: rgb(64, 128, 255);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
}
</style>
