<template>
  <div v-if="columns.length" class="card table-search">
    <el-form
      ref="formRef"
      :model="searchParam"
      :rules="rules"
      @submit.native.prevent
      @keyup.enter.native="localSearch"
    >
      <Grid ref="gridRef" :collapsed="collapsed" :gap="[20, 0]" :cols="searchCol">
        <!-- 根据columns动态渲染响应式搜索项 -->
        <GridItem
          v-for="(item, index) in columns"
          :key="item.prop"
          v-bind="getResponsive(item)"
          :index="index"
        >
          <el-form-item
            :label="formatLabel(item)"
            :label-width="item.search.width || labelWidth"
            :prop="item.prop"
          >
            <SearchFormItem :column="item" :search-param="searchParam" />
          </el-form-item>
        </GridItem>
        <!-- 操作按钮组 -->
        <GridItem suffix>
          <div class="operation">
            <el-button type="primary" :icon="Search" @click="localSearch">搜索</el-button>
            <el-button :icon="Refresh" @click="reset">重置</el-button>
            <el-button
              v-if="showCollapse"
              type="primary"
              link
              class="search-isOpen"
              @click="toggleCollapsed"
            >
              {{ collapsed ? '展开' : '合并' }}
              <el-icon class="el-icon--right">
                <component :is="collapsed ? ArrowDown : ArrowUp"></component>
              </el-icon>
            </el-button>
          </div>
        </GridItem>
      </Grid>
    </el-form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Delete, Search, ArrowDown, ArrowUp, Refresh } from '@element-plus/icons-vue';
import SearchFormItem from './components/SearchFormItem';
import Grid from '@/components/WsllGrid';
import GridItem from '@/components/WsllGrid/components/GridItem';

// 接收父组件传入的 props，均有默认值
const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  searchParam: {
    type: Object,
    default: () => ({}),
  },
  searchCol: {
    type: [Number, Object],
    default: () => 4, // ⭐ 一行固定4个
  },

  // searchCol: {
  //   type: [Number, Object],
  //   default: () => ({ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }),
  // },
  labelWidth: {
    type: String,
    default: '120px',
  },
  search: {
    type: Function,
    default: () => {},
  }, // 搜索回调
  reset: {
    type: Function,
    default: () => {},
  }, // 重置回调
});

const formRef = ref(null);
const gridRef = ref(null);

// 控制搜索区域是否折叠，默认折叠
const collapsed = ref(false);

// 格式化表单项标签，优先显示 search.searchTitle，没有则显示 label 并加冒号
const formatLabel = (item) => {
  if (item.search?.searchTitle) return item.search.searchTitle;
  if (item.label) return item.label + ':';
  return '';
};

// 获取搜索项响应式布局配置，方便 GridItem 直接解构绑定
const getResponsive = (item) => ({
  span: item.search?.span,
  offset: item.search?.offset ?? 0,
  xs: item.search?.xs,
  sm: item.search?.sm,
  md: item.search?.md,
  lg: item.search?.lg,
  xl: item.search?.xl,
});

// 计算当前响应式断点，Grid 组件内部提供
const breakPoint = computed(() => gridRef.value?.breakPoint || 'xl');

// 判断是否显示展开/合并按钮（当搜索项总跨度超过一行时显示）
const showCollapse = computed(() => {
  let accumulated = 0;
  // 根据当前断点或默认span，累加所有搜索项宽度
  const maxCols =
    typeof props.searchCol === 'number' ? props.searchCol : props.searchCol[breakPoint.value];
  for (const col of props.columns) {
    accumulated += col.search?.[breakPoint.value] ?? col.search?.span ?? 1;
    accumulated += col.search?.[breakPoint.value]?.offset ?? col.search?.offset ?? 0;
    if (accumulated >= maxCols) return true;
  }
  return false;
});

// 验证规则收集，自动汇总所有列中定义的rules
const rules = computed(() => {
  const ruleObj = { len: 0 };
  props.columns.forEach((item) => {
    if (item.rules) {
      ruleObj[item.prop] = item.rules;
      ruleObj.len++;
    }
  });
  return ruleObj;
});

// 搜索执行函数，带验证逻辑
function localSearch() {
  if (rules.value.len > 0) {
    formRef.value?.validate((valid) => {
      if (valid) props.search();
    });
  } else {
    props.search();
  }
}

// 切换折叠状态
function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}
</script>
