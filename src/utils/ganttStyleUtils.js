/**
 * 计算甘特图色块样式
 * @param {Object} obj - 包含 leftPx 和 widthPx 的定位对象
 * @param {string} bg - 可选自定义颜色（优先级高于 obj.bgColor）
 * @returns {Object} 样式对象
 */
export function calcStyle(obj, bg) {
  const baseColor = bg || obj.bgColor || '';
  const isGray = baseColor.toLowerCase() === 'gray' || baseColor === '#ccc';
  const isHidden = baseColor === '';

  const grayGradient = 'linear-gradient(to right, rgba(100,100,100,0.5), rgba(100,100,100,0.55))';
  const grayShadow = '0 1px 4px rgba(100, 100, 100, 0.3)';

  const style = {
    height: '15px',
    left: obj.leftPx + 'px',
    width: Math.max(obj.widthPx, 1) + 'px',
    position: 'absolute',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.25s ease-in-out',
  };

  if (isHidden) {
    // 隐藏状态（如未分配工段），无背景与阴影
    return style;
  }

  style.background = isGray ? grayGradient : getGradient(baseColor);
  style.boxShadow = isGray ? grayShadow : `0 2px 5px ${lightenColor(baseColor, 0.2)}`;

  return style;
}

/**
 * 生成渐变背景（从当前色到稍亮）
 * @param {string} color - 十六进制颜色
 * @returns {string} CSS 渐变字符串
 */
export function getGradient(color) {
  const darker = lightenColor(color, 0.08);
  return `linear-gradient(90deg, ${darker}, ${color})`;
}

/**
 * 将颜色加亮（适用于 boxShadow 或渐变尾部）
 * @param {string} hex - 颜色（如 "#ff0000"）
 * @param {number} percent - 百分比（如 0.1 表示亮 10%）
 * @returns {string} rgb 格式的亮色
 */
export function lightenColor(hex, percent = 0.1) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.min((num >> 16) + amt, 255);
  const G = Math.min(((num >> 8) & 0xff) + amt, 255);
  const B = Math.min((num & 0xff) + amt, 255);
  return `rgb(${R}, ${G}, ${B})`;
}

/**
 * 将颜色加深（可选函数，当前未使用）
 * @param {string} hex - 颜色（如 "#ff0000"）
 * @param {number} percent - 百分比（如 0.1 表示深 10%）
 * @returns {string} rgb 格式的深色
 */
export function darkenColor(hex, percent = 0.1) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0xff) - amt, 0);
  const B = Math.max((num & 0xff) - amt, 0);
  return `rgb(${R}, ${G}, ${B})`;
}

//  行样式
export function containerRowStyle({ rowWidth }) {
  const style = {
    width: rowWidth + 'px',
    height: '55px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  return style;
}
