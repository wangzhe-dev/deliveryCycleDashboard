<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { icon: '🏠', label: '曲面分段进度推演', path: '/' },
  { icon: '🔧', label: '三维作业指导书', path: '/3d-guide' },
  { icon: '📐', label: '曲面分段计划', path: '/surface-plan' },
  { icon: '🏗️', label: '场地设计', path: '/scene-editor' },
  { icon: '📋', label: '场地任务', path: '/venue-task' },
  { icon: '📊', label: '工厂监控大屏', path: '/monitor', external: 'http://62.234.55.120/screen/' },

]

function handleNavigate(path: string) {
  const item = menuItems.find(m => m.path === path)
  if (item?.external) {
    window.open(item.external, '_blank')
    return
  }
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 侧边栏 -->
    <Sidebar
      :menu-items="menuItems"
      :current-path="route.path"
      @navigate="handleNavigate"
    />

    <!-- 主内容区域 -->
    <main class="ml-60 h-screen overflow-hidden pl-2">
      <router-view />
    </main>
  </div>
</template>
