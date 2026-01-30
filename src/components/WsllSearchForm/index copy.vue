<!--
 * @Author: zhaijs
 * @Date: 2023-08-03 08:43:55
 * @LastEditTime: 2025-01-14 09:54:01
 * @Description: 请填写简介
-->
<template>
  <div v-if="columns.length" class="card table-search">
    <el-form
      ref="formRef"
      :model="searchParam"
      :rules="rules"
      :label-width="labelWidth"
      @submit.native.prevent
      @keyup.enter.native="localSearch"
    >
      <Grid ref="gridRef" :collapsed="collapsed" :gap="[20, 0]" :cols="searchCol">
        <GridItem
          v-for="(item, index) in columns"
          :key="item.prop"
          v-bind="getResponsive(item)"
          :index="index"
        >
          <el-form-item
            :label="`${
              item.search && item.search.searchTitle
                ? item.search.searchTitle
                : item.label
                ? item.label + ':'
                : ''
            }`"
            :prop="item.prop"
          >
            <SearchFormItem :column="item" :search-param="searchParam" />
          </el-form-item>
        </GridItem>
        <GridItem suffix>
          <div class="operation">
            <el-button type="primary" :icon="Search" @click="localSearch">搜索</el-button>
            <el-button :icon="Delete" @click="reset">重置</el-button>
            <el-button
              v-if="showCollapse"
              type="primary"
              link
              class="search-isOpen"
              @click="collapsed = !collapsed"
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
<script setup name="SearchForm">
import { computed, ref, withDefaults } from 'vue';
import { Delete, Search, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import SearchFormItem from './components/SearchFormItem';
import Grid from '@/components/WsllGrid';
import GridItem from '@/components/WsllGrid/components/GridItem';

// 默认值
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
    default: () => ({ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }),
  },
  labelWidth: {
    type: String,
    default: '120px',
  },
  search: {
    type: Function,
    default: (params) => {},
  }, // 搜索方法
  reset: {
    type: Function,
    default: (params) => {},
  }, // 重置方法
});

// 获取响应式设置
const getResponsive = (item) => {
  return {
    span: item.search?.span,
    offset: item.search?.offset ?? 0,
    xs: item.search?.xs,
    sm: item.search?.sm,
    md: item.search?.md,
    lg: item.search?.lg,
    xl: item.search?.xl,
  };
};

// 是否默认折叠搜索项
const collapsed = ref(true);
const formRef = ref(null);

// 获取响应式断点
const gridRef = ref();
const breakPoint = computed(() => gridRef.value?.breakPoint || 'xl');
// 判断是否显示 展开/合并 按钮
const showCollapse = computed(() => {
  let show = false;
  props.columns.reduce((prev, current) => {
    prev +=
      (current?.search?.[breakPoint.value]?.span || current?.search?.span || 1) +
      (current?.search?.[breakPoint.value]?.offset || current?.search?.offset || 0);
    if (typeof props.searchCol !== 'number') {
      if (prev >= props.searchCol[breakPoint.value]) show = true;
    } else {
      if (prev >= props.searchCol) show = true;
    }
    return prev;
  }, 0);
  return show;
});

const rules = computed(() => {
  let rule = { len: 0 };
  props.columns.forEach((item) => {
    if (item.rules) {
      rule[item.prop] = item.rules;
      rule.len++;
    }
  });
  return rule;
});

function localSearch() {
  if (rules.value.len) {
    formRef.value?.validate((valid) => {
      if (valid) props.search && props.search();
    });
  } else {
    props.search && props.search();
  }
}
</script>
