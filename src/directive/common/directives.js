// v-table-mobile：在移动端把表头文字插到每个 <td> 最前面
export default {
  mounted(el, { value }) {
    setTimeout(() => addHeaderLabels(el, value), 50);
  },
  updated(el, { value }) {
    setTimeout(() => addHeaderLabels(el, value), 50);
  },
};

function addHeaderLabels(el, { enabled }) {
  if (!enabled) {
    return false;
  }

  // ===== Element Plus 选择器 =====
  const headerThs = el.querySelectorAll('.el-table__header-wrapper thead th');
  const bodyTds = el.querySelectorAll('.el-table__body-wrapper tbody td');

  // 关闭横向滚动条（可选）
  const bodyWrap = el.querySelector('.el-table__body-wrapper');
  if (bodyWrap) bodyWrap.style.overflowX = 'hidden';
  bodyTds.forEach((td, index) => {
    const ci = index % headerThs.length;
    const headerText = headerThs[ci].innerText.trim();

    // 排除多选列（带 el-checkbox）
    if (td.querySelector('.el-checkbox')) return;

    const cellDiv = td.querySelector('.cell');

    if (!cellDiv) return;

    // 首次插入
    if (!cellDiv.querySelector('.custom-div')) {
      const div = document.createElement('div');
      div.textContent = headerText;
      div.className = 'custom-div';
      cellDiv.insertBefore(div, cellDiv.firstChild);
    }
  });
}
