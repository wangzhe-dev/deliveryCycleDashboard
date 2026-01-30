<template>
  <div
    class="svg-box"
    :style="{ backgroundColor: background, width: '100%', height: '100%' }"
  >
    <svg
      v-if="hasPoints"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      role="img"
      aria-label="Scaled polygon"
    >
      <!-- Optional grid -->
      <g v-if="showGrid" opacity="0.35">
        <template v-for="x in gridXs" :key="`gx-${x}`">
          <line :x1="x" :y1="vbMinY" :x2="x" :y2="vbMaxY" stroke="currentColor" stroke-width="0.2" stroke-dasharray="2 2"/>
        </template>
        <template v-for="y in gridYs" :key="`gy-${y}`">
          <line :x1="vbMinX" :y1="y" :x2="vbMaxX" :y2="y" stroke="currentColor" stroke-width="0.2" stroke-dasharray="2 2"/>
        </template>
      </g>

      <!-- Polygon shape -->
      <polygon
        :points="pointsAttr"
        :fill="fill"
        :stroke="stroke"
        :stroke-width="strokeWidth"
        :vector-effect="'non-scaling-stroke'"
      />

      <!-- Optional vertex markers -->
      <g v-if="showVertices">
        <circle
          v-for="(p, i) in normalizedPoints"
          :key="`v-${i}`"
          :cx="p.x"
          :cy="p.y"
          :r="vertexRadius"
          :fill="stroke"
        />
      </g>
    </svg>
    <div v-else class="empty">暂无地形图</div>
  </div>
</template>

<script>
export default {
  name: 'ResponsivePolygon',
  props: {
    /**
     * Array of points: [{x: Number, y: Number}, ...]
     */
    points: { type: Array, required: true, default: () => [] },

    /**
     * Background color coming from parent, e.g. '#f8f8f8' or 'var(--panel)'
     */
    background: { type: String, default: 'transparent' },

    /**
     * Optional padding around content within the viewBox (in same units as points)
     */
    padding: { type: Number, default: 0 },

    /**
     * Polygon stroke and fill styles
     */
    stroke: { type: String, default: '#333' },
    strokeWidth: { type: Number, default: 0.8 },
    fill: { type: String, default: 'rgba(0,0,0,0.12)' },

    /** Show helpers */
    showGrid: { type: Boolean, default: true },
    showVertices: { type: Boolean, default: true },

    /** Grid spacing (same units as points) */
    gridStep: { type: Number, default: 1 },
  },
  computed: {
    hasPoints() {
      return Array.isArray(this.points) && this.points.length >= 3;
    },
    // Compute bounds
    vbMinX() {
      return Math.min(...this.points.map(p => p.x)) - this.padding;
    },
    vbMaxX() {
      return Math.max(...this.points.map(p => p.x)) + this.padding;
    },
    vbMinY() {
      return Math.min(...this.points.map(p => p.y)) - this.padding;
    },
    vbMaxY() {
      return Math.max(...this.points.map(p => p.y)) + this.padding;
    },
    vbWidth() { return this.vbMaxX - this.vbMinX; },
    vbHeight() { return this.vbMaxY - this.vbMinY; },
    viewBox() {
      return `${this.vbMinX} ${this.vbMinY} ${this.vbWidth} ${this.vbHeight}`;
    },
    // Normalize points directly in viewBox coordinates
    normalizedPoints() {
      return this.points.map(p => ({ x: p.x, y: p.y }));
    },
    pointsAttr() {
      return this.normalizedPoints.map(p => `${p.x},${p.y}`).join(' ');
    },
    gridXs() {
      if (!this.showGrid) return [];
      const xs = [];
      const start = Math.ceil(this.vbMinX / this.gridStep) * this.gridStep;
      for (let x = start; x <= this.vbMaxX + 1e-6; x += this.gridStep) xs.push(+x.toFixed(6));
      return xs;
    },
    gridYs() {
      if (!this.showGrid) return [];
      const ys = [];
      const start = Math.ceil(this.vbMinY / this.gridStep) * this.gridStep;
      for (let y = start; y <= this.vbMaxY + 1e-6; y += this.gridStep) ys.push(+y.toFixed(6));
      return ys;
    },
    vertexRadius() {
      // Keep a small radius relative to box size
      return Math.max(Math.min(this.vbWidth, this.vbHeight) * 0.01, 0.2);
    }
  }
};
</script>

<style scoped>
.svg-box {
  display: block;
  position: relative;
}
.empty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #999;
  font-size: 11px;
}
</style>