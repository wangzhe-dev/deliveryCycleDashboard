<!--
 * @Author: 胡洋杰 16601050311@163.com
 * @Date: 2023-08-21 17:13:41
 * @LastEditors: zhaijinsong
 * @LastEditTime: 2023-09-14 14:24:46
 * @FilePath: \mcm-web\src\components\ProjectNoMasterDialog\index.vue
 * @Description: 外向交货单
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
      @keyup.enter="projectNumberEnter"
    >
      <template #suffix>
        <span style="cursor: pointer" @click.native="projectNumberClick">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </template>
    </el-input>
    <OutgoingListDialog
      :params="props.params"
      :title="props.title"
      v-model="visible"
      @submit="handleSubmit"
      :checkType="props.checkType"
    />
  </div>
</template>

<script setup lang="jsx" name="OutgoingListModal">
import { checkCode } from './services';
import OutgoingListDialog from '@/components/OutgoingListDialog/index';
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
    default: '选择外向交货单',
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
  emit('update:modelValue', r.deliveryOrderCode);
  emit('submit', r);
}

async function exitProject(deliveryOrderCode) {
  if (props.checkType !== 'radio') return;
  try {
    const { data } = await checkCode({ deliveryOrderCode });
    if (data?.deliveryOrderCode) {
      emit('update:modelValue', data.deliveryOrderCode);
      emit('submit', data);
    } else {
      proxy.showWarning(`当前编号不存在`);
    }
  } catch (error) {}
}
</script>
