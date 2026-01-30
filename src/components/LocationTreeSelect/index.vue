<template>
  <div class="location-tree-select w-full">
    <el-tree-select
      v-model="localValue"
      :data="treeData"
      :props="treeProps"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :filterable="filterable"
      :filter-method="handleFilter"
      :filter-node-method="filterNode"
      :check-strictly="false"
      :render-after-expand="false"
      node-key="id"
      class="w-full"
      @node-click="handleNodeClick"
      @clear="handleClear"
    >
      <template #default="{ node, data }">
        <span
          :class="[
            'tree-node-label',
            { 'is-disabled': !isLeafNode(data), 'is-leaf': isLeafNode(data) },
          ]"
        >
          {{ node.label }}
        </span>
      </template>
    </el-tree-select>
  </div>
</template>

<script setup name="LocationTreeSelect">
import { loadTreeList } from './services';

const props = defineProps({
  /** 双向绑定的值（节点 id 或 code，根据 valueKey 决定） */
  modelValue: {
    type: [String, Number],
    default: '',
  },
  /** 返回值使用的字段：'id' | 'code' */
  valueKey: {
    type: String,
    default: 'code',
  },
  /** 显示值使用的字段 */
  labelKey: {
    type: String,
    default: 'label',
  },
  /** 占位符 */
  placeholder: {
    type: String,
    default: '请选择储位',
  },
  /** 是否禁用 */
  disabled: {
    type: Boolean,
    default: false,
  },
  /** 是否可清空 */
  clearable: {
    type: Boolean,
    default: true,
  },
  /** 是否可搜索 */
  filterable: {
    type: Boolean,
    default: true,
  },
  /** 额外的请求参数 */
  params: {
    type: Object,
    default: () => ({}),
  },
  /** 是否在组件挂载时自动加载数据 */
  autoLoad: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'change', 'node-click']);

const treeData = ref([]);
const loading = ref(false);
const localValue = ref('');
const keyword = ref('');
let loadRequestId = 0;

// 树节点配置
const treeProps = {
  label: 'label',
  children: 'children',
  value: 'id',
  disabled: (data) => !isLeafNode(data),
};

/**
 * 判断是否为叶子节点（没有子节点）
 */
function isLeafNode(data) {
  return !data.children || data.children.length === 0;
}

/**
 * 过滤节点方法
 */
function filterNode() {
  return true;
}

/**
 * 搜索输入变化时走后端查询
 */
function handleFilter(value) {
  const nextKeyword = value || '';
  if (nextKeyword === keyword.value && treeData.value.length) {
    return;
  }
  loadData(nextKeyword);
}

/**
 * 加载树数据
 */
async function loadData(nextKeyword = keyword.value) {
  const keywordValue = (nextKeyword || '').toUpperCase();
  keyword.value = keywordValue;
  const requestId = ++loadRequestId;
  loading.value = true;
  try {
    const { code, data } = await loadTreeList({ ...props.params, keyword: keywordValue });
    if (requestId !== loadRequestId) return;
    if (code === 200) {
      treeData.value = Array.isArray(data) ? data : [];
      // 数据加载后，如果有初始值需要回显
      if (props.modelValue) {
        setValueByKey(props.modelValue);
      }
    }
  } catch (error) {
    console.error('加载储位树数据失败：', error);
  } finally {
    if (requestId === loadRequestId) {
      loading.value = false;
    }
  }
}

/**
 * 根据 valueKey 设置当前选中值
 */
function setValueByKey(value) {
  if (!value) {
    localValue.value = '';
    return;
  }
  // 如果 valueKey 是 'id'，直接使用
  if (props.valueKey === 'id') {
    localValue.value = value;
    return;
  }
  // 如果 valueKey 是 'code'，需要找到对应的 id
  const node = findNodeByKey(treeData.value, props.valueKey, value);
  if (node) {
    localValue.value = node.id;
  }
}

/**
 * 递归查找节点
 */
function findNodeByKey(nodes, key, value) {
  for (const node of nodes || []) {
    if (node[key] === value) {
      return node;
    }
    if (node.children?.length) {
      const found = findNodeByKey(node.children, key, value);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 根据 id 查找节点
 */
function findNodeById(nodes, id) {
  return findNodeByKey(nodes, 'id', id);
}

/**
 * 获取返回值
 */
function getEmitValue(node) {
  if (!node) return '';
  return props.valueKey === 'id' ? node.id : node[props.valueKey] || node.code || '';
}

/**
 * 节点点击事件
 */
function handleNodeClick(data, node) {
  // 只有叶子节点才能选中
  if (!isLeafNode(data)) {
    return;
  }
  const emitValue = getEmitValue(data);
  emit('update:modelValue', emitValue);
  emit('change', emitValue, data);
  emit('node-click', data, node);
}

/**
 * 清空事件
 */
function handleClear() {
  emit('update:modelValue', '');
  emit('change', '', null);
}

/**
 * 刷新树数据
 */
function refresh() {
  loadData();
}

// 监听 modelValue 变化进行回显
watch(
  () => props.modelValue,
  (newVal) => {
    if (treeData.value.length) {
      setValueByKey(newVal);
    }
  },
  { immediate: true },
);

// 监听 localValue 变化同步到 modelValue
watch(localValue, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', '');
    return;
  }
  const node = findNodeById(treeData.value, newVal);
  if (node && isLeafNode(node)) {
    const emitValue = getEmitValue(node);
    if (emitValue !== props.modelValue) {
      emit('update:modelValue', emitValue);
      emit('change', emitValue, node);
    }
  }
});

// 组件挂载时自动加载数据
onMounted(() => {
  if (props.autoLoad) {
    loadData();
  }
});

// 暴露方法供外部调用
defineExpose({
  refresh,
  loadData,
  treeData,
});
</script>

<style lang="scss" scoped>
.location-tree-select {
  :deep(.el-tree-node__content) {
    .tree-node-label {
      &.is-disabled {
        color: #909399;
        cursor: not-allowed;
      }
      &.is-leaf {
        color: inherit;
        cursor: pointer;
      }
    }
  }

  :deep(.el-tree-node.is-disabled) {
    .el-tree-node__content {
      cursor: not-allowed;
      .tree-node-label {
        color: #909399;
      }
    }
  }
}
</style>
