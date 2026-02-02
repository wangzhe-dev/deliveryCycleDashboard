<script setup lang="ts">
import { computed } from 'vue'

interface Milestone {
  key?: string
  name: string
  date: string
  status: 'done' | 'current' | 'todo'
  icon?: string
}

const props = defineProps<{
  milestones: Milestone[]
  extraKpi?: {
    installRate?: string
    weldPassRate?: string
    onDuty?: string
    buildCycle?: string
  }
}>()

const iconOrder = ['🚀', '🛠️', '⚓', '🏗️', '🚢', '🧪', '🛳️']

const msWithIcons = computed(() =>
  props.milestones.map((m, idx) => ({
    ...m,
    icon: m.icon || iconOrder[idx] || '⛵',
  })),
)

const kpiList = computed(() => {
  const k = props.extraKpi || {}
  return [
    { key: 'install', icon: '🛠️', label: '总段安装效率', main: (k.installRate || '2.8个/天').replace(/个\/天|\/天|天/g, ''), unit: '个/天', color: 'text-teal-600' },
    { key: 'weld', icon: '⚡', label: '焊接合格率', main: (k.weldPassRate || '98.5%').replace('%', ''), unit: '%', color: 'text-blue-600' },
    { key: 'staff', icon: '👥', label: '在岗人员', main: (k.onDuty || '156人').replace(/人/g, ''), unit: '人', color: 'text-violet-600' },
    { key: 'cycle', icon: '📅', label: '建造周期', main: (k.buildCycle || '532天').replace(/天/g, ''), unit: '天', color: 'text-orange-600' },
  ]
})

const cardBg: Record<string, string> = {
  done: 'bg-blue-50/80 border-blue-200/60',
  current: 'bg-amber-50/80 border-amber-200/60',
  todo: 'bg-slate-50/80 border-slate-200/60',
}

const badgeStyle: Record<string, string> = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-amber-500 text-white',
  todo: 'bg-slate-300 text-slate-500',
}

const dotStyle: Record<string, string> = {
  done: 'bg-emerald-500 border-emerald-400',
  current: 'bg-amber-500 border-amber-400',
  todo: 'bg-slate-200 border-slate-300',
}
</script>

<template>
  <div class="rounded-xl border bg-card p-5 shadow-sm">
    <div class="text-sm font-semibold mb-4">建造里程碑时间线</div>

    <!-- 里程碑卡片 -->
    <div class="grid gap-2.5" :style="{ gridTemplateColumns: `repeat(${msWithIcons.length}, minmax(0, 1fr))` }">
      <div
        v-for="(m, idx) in msWithIcons"
        :key="m.key || idx"
        class="rounded-lg border p-3 relative"
        :class="cardBg[m.status]"
      >
        <div
          class="absolute top-2 right-2 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold leading-none"
          :class="badgeStyle[m.status]"
        >
          <span v-if="m.status === 'done'">✓</span>
          <span v-else-if="m.status === 'current'">●</span>
          <span v-else>·</span>
        </div>
        <div class="w-10 h-10 mx-auto my-2 rounded-lg bg-white/90 border border-white flex items-center justify-center text-lg shadow-sm">
          {{ m.icon }}
        </div>
        <div class="text-center">
          <div class="text-[11px] font-semibold text-foreground leading-tight">{{ m.name }}</div>
          <div class="text-[10px] text-muted-foreground mt-0.5 font-mono">{{ m.date }}</div>
        </div>
      </div>
    </div>

    <!-- 时间轴 -->
    <div class="relative mx-6 my-2.5 h-3 flex items-center">
      <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px border-t border-dashed border-slate-300" />
      <div class="relative w-full flex justify-between">
        <div
          v-for="(m, idx) in msWithIcons"
          :key="m.key || idx"
          class="w-2.5 h-2.5 rounded-full border-2 shadow-sm"
          :class="dotStyle[m.status]"
        />
      </div>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-4 gap-3 mt-4">
      <div
        v-for="k in kpiList"
        :key="k.key"
        class="rounded-lg border bg-white p-3.5"
      >
        <div class="flex items-center gap-2 mb-2.5">
          <div class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm">
            {{ k.icon }}
          </div>
          <span class="text-[11px] font-medium text-muted-foreground leading-tight">{{ k.label }}</span>
        </div>
        <div class="h-px bg-slate-100 mb-2.5" />
        <div class="flex items-baseline gap-1">
          <span class="text-xl font-extrabold tabular-nums" :class="k.color">{{ k.main }}</span>
          <span class="text-[11px] text-muted-foreground">{{ k.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
