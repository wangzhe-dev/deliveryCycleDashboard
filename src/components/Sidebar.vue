<script setup lang="ts">
import { cn } from '@/lib/utils'

interface MenuItem {
  icon: string
  label: string
  path: string
  external?: string
}

const props = defineProps<{
  menuItems: MenuItem[]
  currentPath?: string
}>()

const emit = defineEmits<{
  navigate: [path: string]
}>()

</script>

<template>
  <aside
    :class="cn(
      'fixed left-0 top-0 z-50 flex h-full flex-col',
      'w-60',
      'border-r border-slate-200 bg-slate-50',
      'shadow-[0_8px_24px_rgba(148,163,184,0.35)]'
    )"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
        <span class="text-sm font-bold">WZ</span>
      </div>
      <div class="leading-tight">
        <div class="text-base font-semibold text-slate-800">个人演示项目</div>
      </div>
    </div>

    <!-- 菜单项 -->
    <nav class="flex-1 py-4">
      <ul class="space-y-2 px-3">
        <li v-for="item in menuItems" :key="item.path">
          <button
            :class="cn(
              'group relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition-all duration-200',
              'border border-transparent bg-white/80 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900',
              currentPath === item.path &&
                'border-slate-200 bg-slate-100 text-slate-900 shadow-sm'
            )"
            @click="emit('navigate', item.path)"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-700"
              :class="currentPath === item.path ? 'border-slate-300 bg-white text-slate-900' : ''"
            >
              {{ item.icon }}
            </span>
            <span class="flex-1 whitespace-nowrap text-sm font-semibold">
              {{ item.label }}
            </span>
            <svg
              v-if="item.external"
              class="h-3 w-3 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </button>
        </li>
      </ul>
    </nav>

    <!-- 底部 -->
    <div class="border-t border-slate-200 p-4">
      <button
        :class="cn(
          'group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition-all duration-200',
          'border border-transparent bg-white/80 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'
        )"
      >
        <span class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-700">
          ⚙️
        </span>
        <span class="whitespace-nowrap text-sm font-semibold">设置</span>
      </button>
    </div>
  </aside>
</template>
