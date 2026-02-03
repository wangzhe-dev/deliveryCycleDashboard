<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui'
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
    { key: 'install', icon: '🛠️', label: '总段安装效率', main: (k.installRate || '2.8个/天').replace(/个\/天|\/天|天/g, ''), unit: '个/天', color: 'text-primary' },
    { key: 'weld', icon: '⚡', label: '焊接合格率', main: (k.weldPassRate || '98.5%').replace('%', ''), unit: '%', color: 'text-secondary-foreground' },
    { key: 'staff', icon: '👥', label: '在岗人员', main: (k.onDuty || '156人').replace(/人/g, ''), unit: '人', color: 'text-foreground' },
    { key: 'cycle', icon: '📅', label: '建造周期', main: (k.buildCycle || '532天').replace(/天/g, ''), unit: '天', color: 'text-destructive' },
  ]
})

const cardBg: Record<string, string> = {
  done: 'bg-primary/10 border-primary/30',
  current: 'bg-secondary/35 border-secondary/50',
  todo: 'bg-muted/70 border-border',
}

const badgeStyle: Record<string, string> = {
  done: 'bg-primary text-primary-foreground',
  current: 'bg-destructive text-destructive-foreground',
  todo: 'bg-muted text-muted-foreground',
}

const dotStyle: Record<string, string> = {
  done: 'bg-primary border-primary/70',
  current: 'bg-destructive border-destructive/70',
  todo: 'bg-muted border-border',
}
</script>

<template>
  <Card class="shadow-sm">
    <CardHeader class="relative z-10 flex-row items-center gap-2 space-y-0 px-4 py-3 text-foreground">
      <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25zM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25z" />
      </svg>
      <span class="text-sm font-medium text-foreground">建造里程碑时间线</span>
    </CardHeader>
    <CardContent class="flex-1 overflow-y-auto p-3">
      <!-- 里程碑卡片 -->
      <div class="grid gap-2.5" :style="{ gridTemplateColumns: `repeat(${msWithIcons.length}, minmax(0, 1fr))` }">
        <div
          v-for="(m, idx) in msWithIcons"
          :key="m.key || idx"
          class="rounded-lg border p-3 relative"
          :class="cardBg[m.status]"
        >
          <div
            class="absolute top-2 right-2 w-4 h-4 rounded-full ui-micro flex items-center justify-center font-bold leading-none"
            :class="badgeStyle[m.status]"
          >
            <span v-if="m.status === 'done'">✓</span>
            <span v-else-if="m.status === 'current'">●</span>
            <span v-else>·</span>
          </div>
          <div class="w-10 h-10 mx-auto my-2 rounded-lg bg-card/90 border border-border flex items-center justify-center text-lg shadow-sm">
            {{ m.icon }}
          </div>
          <div class="text-center">
            <div class="ui-meta font-semibold text-foreground leading-tight">{{ m.name }}</div>
            <div class="ui-micro text-muted-foreground mt-0.5 font-mono">{{ m.date }}</div>
          </div>
        </div>
      </div>

      <!-- 时间轴 -->
      <div class="relative mx-6 my-2.5 h-3 flex items-center">
        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px border-t border-dashed border-border" />
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
          class="rounded-lg border border-border bg-card p-3.5"
        >
          <div class="flex items-center gap-2 mb-2.5">
            <div class="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm">
              {{ k.icon }}
            </div>
            <span class="ui-meta font-medium text-muted-foreground leading-tight">{{ k.label }}</span>
          </div>
          <div class="h-px bg-border mb-2.5" />
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-extrabold tabular-nums" :class="k.color">{{ k.main }}</span>
            <span class="ui-meta text-muted-foreground">{{ k.unit }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.ui-meta {
  font-size: 12px;
  line-height: 1.4;
}

.ui-micro {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
