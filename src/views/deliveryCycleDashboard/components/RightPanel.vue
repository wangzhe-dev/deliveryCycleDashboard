<template>
  <aside class="rightbar">
    <section class="rightbar-section list">
      <div class="rightbar-head">组立列表</div>
      <div class="rightbar-list">
        <button
          v-for="item in assemblies"
          :key="item.file"
          class="rightbar-item"
          :class="{ active: item.file === activeAssembly }"
          @click="emit('select-assembly', item.file)"
        >
          <svg-icon icon-class="3D-lj" class="rightbar-icon" />
          {{ item.label }}
        </button>
      </div>
    </section>

    <section class="rightbar-section info">
      <div class="rightbar-head">组立信息</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">名称</span>
          <span class="info-value">{{ activeModelTitle }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">长</span>
          <span class="info-value">{{ modelSizeDetail.x }} u</span>
        </div>
        <div class="info-row">
          <span class="info-label">宽</span>
          <span class="info-value">{{ modelSizeDetail.y }} u</span>
        </div>
        <div class="info-row">
          <span class="info-label">高</span>
          <span class="info-value">{{ modelSizeDetail.z }} u</span>
        </div>
        <div class="info-row">
          <span class="info-label">重量</span>
          <span class="info-value">{{ modelWeightText }}</span>
        </div>
      </div>

      <div class="rightbar-head">标记信息</div>
      <div class="mark-block">
        <div class="mark-title">标距 ({{ markMeasures.length }})</div>
        <div v-if="markMeasures.length === 0" class="empty">暂无</div>
        <div v-for="item in markMeasures" :key="item.id" class="mark-item">{{ item.text || '-' }}</div>
      </div>
      <div class="mark-block">
        <div class="mark-title">尺寸 ({{ markDims.length }})</div>
        <div v-if="markDims.length === 0" class="empty">暂无</div>
        <div v-for="item in markDims" :key="item.id" class="mark-item">{{ item.text || '-' }}</div>
      </div>
      <div class="mark-block">
        <div class="mark-title">标点 ({{ markNotes.length }})</div>
        <div v-if="markNotes.length === 0" class="empty">暂无</div>
        <div v-for="item in markNotes" :key="item.id" class="mark-item">{{ item.text || '-' }}</div>
      </div>
    </section>
  </aside>
</template>

<script setup>
defineProps({
  assemblies: { type: Array, default: () => [] },
  activeAssembly: { type: String, default: '' },
  activeModelTitle: { type: String, default: '' },
  modelSizeDetail: {
    type: Object,
    default: () => ({ x: '-', y: '-', z: '-' }),
  },
  modelWeightText: { type: String, default: '-' },
  markMeasures: { type: Array, default: () => [] },
  markDims: { type: Array, default: () => [] },
  markNotes: { type: Array, default: () => [] },
});

const emit = defineEmits(['select-assembly']);
</script>

<style scoped>
.rightbar {
  width: 300px;
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 30px rgba(2, 8, 23, 0.08);
  overflow: hidden;
  min-height: 0;
}
.rightbar-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  min-height: 0;
}
.rightbar-section.list {
  flex: 0 0 45%;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.rightbar-section.info {
  flex: 1;
  overflow: auto;
}
.rightbar-head {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.rightbar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  padding-right: 4px;
  min-height: 0;
}
.rightbar-item {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(248, 250, 252, 0.9);
  color: #0f172a;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rightbar-icon {
  font-size: 14px;
  color: #1e3a8a;
}
.rightbar-item.active {
  border-color: rgba(43, 108, 255, 0.35);
  background: rgba(43, 108, 255, 0.12);
  color: #1e3a8a;
}
.rightbar-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(2, 8, 23, 0.08);
}
.info-grid {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 6px 10px;
  font-size: 12px;
  color: #0f172a;
}
.info-row {
  display: contents;
}
.info-label {
  color: rgba(15, 23, 42, 0.6);
}
.info-value {
  text-align: right;
}
.mark-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mark-title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}
.mark-item {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.78);
  padding: 4px 6px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 8px;
}
.empty {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.45);
}
</style>
