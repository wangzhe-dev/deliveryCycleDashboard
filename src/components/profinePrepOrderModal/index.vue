<!--
 * @Author: jufuli 1030891512@qq.com
 * @Date: 2025-03-03 10:54:57
 * @LastEditors: jufuli 1030891512@qq.com
 * @LastEditTime: 2025-03-03 17:57:42
 * @FilePath: \cmwh\src\components\profinePrepOrderModal\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
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
        <span style="cursor: pointer" @click="projectNumberClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <ProfinePrepOrderDialog
      :params="props.params"
      v-model="visible"
      @submit="handleSubmit"
      :checkType="props.checkType"
    />
  </div>
</template>

<script setup lang="jsx" name="ProfinePrepOrderModal">
import { checkCode } from './services';
import ProfinePrepOrderDialog from '@/components/ProfinePrepOrderDialog/index';
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

function handleSubmit(r) {
  visible.value = false;
  emit('update:modelValue', r.preNumber);
  emit('submit', r);
}
</script>
