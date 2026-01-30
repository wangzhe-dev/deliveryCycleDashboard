<!--
 * @Author: 胡洋杰
 * @Date: 2023-09-12 15:05:54
 * @LastEditors: jufuli 1030891512@qq.com
 * @LastEditTime: 2025-01-02 18:54:03
 * @Description: 加工单
-->
<template>
  <div class="w-full">
    <!-- 输入销售订单号后回车查询 -->
    <el-input
      v-model="localValue"
      placeholder="请选择"
      class="w-full"
      :disabled="props.disabled"
      readonly
      @input="input"
    >
      <template #suffix>
        <span style="cursor: pointer" @click="handleInputClick">
          <el-icon class="el-input__icon">
            <Search />
          </el-icon>
        </span>
      </template>
    </el-input>
    <ProductionLineDialog
      v-model="visible"
      @submit="handleSubmit"
      :checkType="props.checkType"
      :params="props.params"
    />
  </div>
</template>

<script setup lang="jsx" name="ProductionLineModal">
import ProductionLineDialog from '@/components/ProductionLineDialog';
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  checkType: {
    type: String,
    default: 'radio',
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

function handleInputClick() {
  if (props.disabled) return;
  visible.value = true;
}

// 编号回车查询
// function handleInputEnter() {
//   // 判断编号是否存在
//   exitProject(props.modelValue);
// }

function handleSubmit(r) {
  visible.value = false;
  emit('update:modelValue', r.routeName);
  emit('submit', r);
}

// async function exitProject(workOrder) {
//   try {
//     const { data } = await checkCode({ workOrder });
//     if (data?.workOrder) {
//       emit('update:modelValue', data.workOrder);
//       emit('submit', data);
//     } else {
//       proxy.showWarning(`当前销售订单号不存在`);
//     }
//   } catch (error) {}
// }
</script>
