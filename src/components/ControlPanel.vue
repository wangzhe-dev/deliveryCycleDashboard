<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button, Card, CardHeader, CardTitle, CardContent, Slider, Input } from '@/components/ui'

interface Props {
  rotationSpeed: number
  cubeColor: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:rotationSpeed': [value: number]
  'update:cubeColor': [value: string]
  resetView: []
}>()

const localSpeed = ref(props.rotationSpeed * 1000) // 转换为更友好的范围
const localColor = ref(props.cubeColor)

watch(localSpeed, (val) => {
  emit('update:rotationSpeed', val / 1000)
})

watch(localColor, (val) => {
  emit('update:cubeColor', val)
})

const presetColors = [
  '#6366f1', // 靛蓝
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#f59e0b', // 橙色
  '#22c55e', // 绿色
  '#06b6d4', // 青色
]
</script>

<template>
  <Card class="w-72">
    <CardHeader>
      <CardTitle>🎮 模型控制</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- 旋转速度 -->
      <div class="space-y-2">
        <label class="text-sm text-muted-foreground">旋转速度</label>
        <Slider v-model="localSpeed" :min="0" :max="50" :step="1" />
        <div class="text-xs text-muted-foreground text-right">{{ localSpeed }}%</div>
      </div>

      <!-- 颜色选择 -->
      <div class="space-y-2">
        <label class="text-sm text-muted-foreground">模型颜色</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="color in presetColors"
            :key="color"
            :style="{ backgroundColor: color }"
            :class="[
              'w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110',
              localColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
            ]"
            @click="localColor = color"
          />
        </div>
        <Input v-model="localColor" placeholder="#000000" class="mt-2" />
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1" @click="emit('resetView')">
          重置视角
        </Button>
        <Button class="flex-1">
          导出模型
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
