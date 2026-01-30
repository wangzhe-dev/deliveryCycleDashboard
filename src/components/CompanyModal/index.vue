<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: jufuli 1030891512@qq.com
 * @LastEditTime: 2025-02-21 14:31:24
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 客户主数据弹窗
-->
<template>
  <div class="w-full">
    <el-input
      v-model="localValue"
      placeholder="请选择"
      class="w-full"
      clearable
      :disabled="props.disabled"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon">
            <Search />
          </el-icon>
        </span>
      </template>
    </el-input>
    <CompanyDialog
      checkType="radio"
      :params="props.params"
      :title="props.title"
      v-model="visible"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="jsx" name="CompanyModal">
import CompanyDialog from '@/components/CompanyDialog/index';
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
    default: '选择公司',
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

const visible = ref(false);

function projectNumberClick() {
  if (props.disabled) return;
  visible.value = true;
}

function handleSubmit(r) {
  visible.value = false;
  emit('update:modelValue', r.companyCode);
  emit('submit', r);
}
</script>
