// 你的配色表（自己改成想要的颜色）
const SERIES_COLOR = {
  板材预处理线: '#5470C6', // 你之前没给颜色，我先放默认蓝
  型材预处理线: '#91CC75',
  板材切割线: '#FAC858',
  型材切割线: '#EE6666',
  智能T排生产装焊线: '#73C0DE',
  智能小组立生产装焊线: '#3BA272',
  平面片体激光复合焊接线: '#FC8452',
  智能片体分段焊接线: '#9A60B4',
};
// 统一的渐变生成
const barGradient = (base, topBright = 0.35, midBright = 0.15, bottomDark = -0.2) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0.0, color: shade(base, topBright) },
    { offset: 0.2, color: shade(base, midBright) },
    { offset: 0.55, color: base },
    { offset: 1.0, color: shade(base, bottomDark) },
  ],
  global: false,
});

// 新增：悬浮态（划过）样式
function makeBarEmphasis(base) {
  return {
    scale: true,
    focus: 'series',
    itemStyle: {
      shadowBlur: 24,
      shadowOffsetY: 10,
      shadowColor: 'rgba(32,82,183,0.5)',
      borderColor: '#ffffffcc',
      // 悬浮时更亮一点的渐变
      color: barGradient(base, 0.5, 0.3, -0.1),
    },
    // 需要的话给 label 上色；不想改动可删掉
    label: {
      show: true,
      position: 'top',
      distance: 6,
      color: shade(base, 0.2),
      fontWeight: 600,
      formatter: '{c}',
    },
  };
}

function shade(hex, p) {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255,
    t = p < 0 ? 0 : 255,
    P = Math.abs(p);
  r = Math.round((t - r) * P) + r;
  g = Math.round((t - g) * P) + g;
  b = Math.round((t - b) * P) + b;
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
function rgba(hex, a) {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  const n = parseInt(c, 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
function makeBarItemStyle(base) {
  return {
    borderRadius: [8, 8, 0, 0],
    shadowBlur: 14,
    shadowOffsetY: 8,
    shadowColor: rgba(base, 0.35),
    borderWidth: 0.2,
    borderColor: 'rgba(255,255,255,0.6)',
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1, // 垂直渐变
      colorStops: [
        { offset: 0.0, color: shade(base, 0.35) },
        { offset: 0.2, color: shade(base, 0.15) },
        { offset: 0.55, color: base },
        { offset: 1.0, color: shade(base, -0.2) },
      ],
      global: false,
    },
  };
}

const applyMetalBarStyle = (series, opt) =>
  series.map((s) => {
    const base = s.color || '#5470C6';
    const defEmphasis = makeBarEmphasis(base);
    const userEmphasis = s.emphasis || {};

    return {
      showBackground: opt?.showBackground || true,
      backgroundStyle: { color: '#EFF2F7', borderRadius: [8, 8, 0, 0] },
      clip: true,
      type: s.type || 'bar',
      data: s.data || [],
      ...s,
      // 默认态
      itemStyle: { ...(s.itemStyle || {}), ...makeBarItemStyle(base) },
      // 关键：不让其它柱子变淡
      blur: { itemStyle: { opacity: 1 } },
      // 关键：不要固定 barWidth
      barWidth: opt?.barWidth || null, // 或者直接删掉这个字段
      barMinWidth: 6, // 可选：太窄时的下限
      barMaxWidth: 60, // 可选：太宽时的上限

      // 同一类目内多系列的间距（组内）
      barGap: opt?.barGap || '15%',

      // 类目与类目之间的间距（组间）
      barCategoryGap: opt?.barCategoryGap || '25%', // 可调 15%~35% 看视觉
      // 悬浮态（深合并 itemStyle/label）
      emphasis: {
        ...defEmphasis,
        ...userEmphasis,
        itemStyle: { ...(defEmphasis.itemStyle || {}), ...(userEmphasis.itemStyle || {}) },
        label: {
          ...(defEmphasis.label || {}),
          ...(userEmphasis.label || {}),
          formatter: function (params) {
            return Math.round(params.value); // 四舍五入整数
          },
        },

        // label: { ...(defEmphasis.label || {}), ...(userEmphasis.label || {}) },
      },
    };
  });

export default applyMetalBarStyle;
