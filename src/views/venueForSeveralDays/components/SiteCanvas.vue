<template>
  <div class="site-canvas" :style="{ backgroundColor: background }">
    <svg
      v-if="bgPoints.length >= 3"
      class="svg"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      height="100%"
      width="100%"
      role="img"
      aria-label="site layout"
    >
      <defs>
        <!-- 屏幕像素网格：patternUnits="userSpaceOnUse"，以坐标单位平铺 -->
        <pattern :id="gridId" :width="gridPx" :height="gridPx" patternUnits="userSpaceOnUse">
          <!-- 只画上边与左边，避免重复边缘更粗 -->
          <path
            :d="`M ${gridPx} 0 H 0 V ${gridPx}`"
            :stroke="gridColor"
            :stroke-width="gridLineWidth"
            :opacity="gridOpacity"
            fill="none"
          />
        </pattern>
      </defs>

      <!-- 背景网格（在最底层，覆盖整个 viewBox） -->
      <rect
        v-if="showGrid"
        :x="minX"
        :y="minY"
        :width="vbWidth"
        :height="vbHeight"
        :fill="`url(#${gridId})`"
      />

      <!-- 背景图形（场地） -->
      <polygon
        :points="bgPointsAttr"
        :fill="bgFill"
        :stroke="bgStroke"
        :stroke-width="bgStrokeWidth"
        vector-effect="non-scaling-stroke"
      />

      <!-- 任务覆盖图形（points 相对“场地左上角”） -->
      <template v-for="(t, idx) in tasksList" :key="t.id ?? idx">
        <polygon
          :points="taskPointsAttr(t)"
          :fill="taskFill(t)"
          :stroke="taskStroke(t)"
          :stroke-width="taskStrokeWidth"
          opacity="0.9"
          vector-effect="non-scaling-stroke"
        />
        <text
          v-if="showTaskName && taskCentroid(t)"
          :x="taskCentroid(t).x"
          :y="taskCentroid(t).y"
          :fill="labelColor"
          :font-size="labelFontSize"
          text-anchor="middle"
          alignment-baseline="middle"
          style="pointer-events: none;"
        >
          {{ t.segmentName || t.name || t.segmentNo || t.id }}
        </text>
      </template>
    </svg>
    <div v-else class="empty">无有效背景点</div>
  </div>
</template>

<script>
export default {
  name: 'SiteCanvas',
  props: {
    /** 场地对象（轮廓与比例设置） */
    site: { type: Object, required: true },
    /** 任务数组（新格式） */
    tasks: { type: Array, default: () => [] },
    /** 容器背景色（不是多边形填充） */
    background: { type: String, default: 'transparent' },

    /** 背景多边形样式 */
    bgFill: { type: String, default: 'rgba(33, 150, 243, 0.2)' },
    bgStroke: { type: String, default: 'rgba(33, 150, 243,1)' },
    bgStrokeWidth: { type: Number, default: 1 },

    /** 任务多边形样式 */
    taskFillColorMap: {
      type: Object,
      default: () => ({
        0: { fill: 'rgba(158,158,158,0.5)' },
        1: { fill: 'rgba(158,158,158,0.5)' }
      })
    },
    taskFillFn: { type: Function, default: null },
    taskStrokeColor: { type: String, default: '#455a64' },
    taskStrokeWidth: { type: Number, default: 0.8 },

    /** 标签（保留开关，若需要可在模板中插入 text） */
    showLabels: { type: Boolean, default: true },
    labelColor: { type: String, default: '#263238' },
    labelFontSize: { type: Number, default: 3 },
    /** 是否显示任务名称 */
    showTaskName: { type: Boolean, default: false },

    /** 额外内边距（以点坐标单位） */
    padding: { type: Number, default: 0 },

    /** 网格相关（以坐标单位近似像素） */
    showGrid: { type: Boolean, default: true },
    gridPx: { type: Number, default: 5 },
    gridColor: { type: String, default: '#e2e8f0' },
    gridLineWidth: { type: Number, default: 1 },
    gridOpacity: { type: Number, default: 1 }
  },
  data() {
    return {
      gridId: `grid-${Math.random().toString(36).slice(2, 9)}`
    };
  },
  computed: {
    // 背景点优先来自 site.tx.points（如果存在），否则 site.points
    bgPoints() {
      const p = this.site?.tx?.points || this.site?.points || [];
      return Array.isArray(p) ? p : [];
    },
    // 兼容：优先使用外部传入的 tasks；若为空则回退到 site.task
    tasksList() {
      if (Array.isArray(this.tasks) && this.tasks.length) return this.tasks;
      return Array.isArray(this.site?.task) ? this.site.task : [];
    },
    // 背景边界 & viewBox（使“场地左上角”在 viewBox 左上）
    minX() {
      return Math.min(...this.bgPoints.map(p => p.x)) - this.padding;
    },
    maxX() {
      return Math.max(...this.bgPoints.map(p => p.x)) + this.padding;
    },
    minY() {
      return Math.min(...this.bgPoints.map(p => p.y)) - this.padding;
    },
    maxY() {
      return Math.max(...this.bgPoints.map(p => p.y)) + this.padding;
    },
    vbWidth() {
      return this.maxX - this.minX;
    },
    vbHeight() {
      return this.maxY - this.minY;
    },
    viewBox() {
      return `${this.minX} ${this.minY} ${this.vbWidth} ${this.vbHeight}`;
    },

    // 背景点字符串（背景多边形本身仍用原始坐标）
    bgPointsAttr() {
      return this.bgPoints.map(p => `${p.x},${p.y}`).join(' ');
    }
  },
  methods: {
    taskFill(t) {
      // 如果外面传了自定义函数，优先用外面的
      if (this.taskFillFn) return this.taskFillFn(t);

      const map = this.taskFillColorMap || {};

      // t.status 可能是数字/字符串，都可以当 key 用
      const statusKey = t && t.status != null ? t.status : 'default';

      // 先按具体状态找，没有就用 default，再没有就空对象
      const cfg = map[statusKey] || map.default || {};

      // 最终返回 fill，还是保留一个兜底色
      return cfg.fill || 'rgba(0,0,0,0.35)';
    },

    taskStroke() {
      return this.taskStrokeColor;
    },

    /**
     * 任务点绘制：
     * - 新数据：t.points 为【相对场地左上角】坐标 → p.x + minX, p.y + minY
     * - 旧数据兼容：t.tx.points 为绝对坐标 → 直接用
     */
    taskPointsAttr(t) {
      if (Array.isArray(t?.points) && t.points.length) {
        // 相对坐标：基于场地左上角 (minX, minY)
        const offsetX = this.minX;
        const offsetY = this.minY;
        return t.points
          .map(p => `${p.x + offsetX},${p.y + offsetY}`)
          .join(' ');
      }

      // 兼容旧格式：tx.points 视为绝对坐标
      const pts = t?.tx?.points || [];
      return pts.map(p => `${p.x},${p.y}`).join(' ');
    },

    // 用于在图上居中放标签（如果启用的话）
    taskCentroid(t) {
      let rawPts = [];
      let offsetX = 0;
      let offsetY = 0;

      if (Array.isArray(t?.points) && t.points.length) {
        // 相对场地左上角
        rawPts = t.points;
        offsetX = this.minX;
        offsetY = this.minY;
      } else if (Array.isArray(t?.tx?.points) && t.tx.points.length) {
        // 绝对坐标旧格式
        rawPts = t.tx.points;
      } else {
        return null;
      }

      const pts = rawPts.map(p => ({
        x: p.x + offsetX,
        y: p.y + offsetY
      }));

      if (pts.length < 3) return null;

      let area = 0;
      let cx = 0;
      let cy = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const f = pts[j].x * pts[i].y - pts[i].x * pts[j].y;
        area += f;
        cx += (pts[j].x + pts[i].x) * f;
        cy += (pts[j].y + pts[i].y) * f;
      }
      area *= 0.5;
      if (Math.abs(area) < 1e-6) return null;
      cx /= 6 * area;
      cy /= 6 * area;
      return { x: cx, y: cy };
    }
  }
};
</script>

<style scoped>
.site-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.svg {
  display: block;
  height: 100%;
  width: 100%;
  max-width: 100%;
}
.empty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #9e9e9e;
}
</style>
