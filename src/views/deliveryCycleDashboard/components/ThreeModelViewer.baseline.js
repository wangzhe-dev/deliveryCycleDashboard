import * as THREE from 'three';

export function createBaselineDims(ctx) {
  const {
    props,
    hostRef,
    overlayRef,
    getCamera,
    getRootGroup,
    getGroupNameForMesh,
    getShowLeftDims,
    modelMetrics,
    getMarkSizeBase,
    clampNumber,
    clampInt,
    normalizeColor,
  } = ctx;

  let leftDimsAxisCache = 'x';
  let leftDimsDatumCache = 0;
  let overlayCtx = null;
  let overlayDpr = 1;
  let overlayCleared = false;
  let leftDimsDirty = true;
  let leftDimsCache = []; // { aWorld,bWorld,value,key }
  let leftDimsHitCache = []; // { left,right,top,bottom,key,text }
  const leftDimsTextOverrides = new Map();

  function pickLongestAxisXZ(box) {
    const size = new THREE.Vector3();
    box.getSize(size);
    return size.x >= size.z ? 'x' : 'z';
  }

  function axisVal(v, axis) {
    return axis === 'x' ? v.x : axis === 'y' ? v.y : v.z;
  }

  function markLeftDimsDirty() {
    leftDimsDirty = true;
  }

  function resizeOverlayCanvas() {
    if (!overlayRef.value || !hostRef.value) return;
    const w = hostRef.value.clientWidth || 1;
    const h = hostRef.value.clientHeight || 1;

    overlayDpr = Math.min(window.devicePixelRatio || 1, 2);
    overlayRef.value.width = Math.floor(w * overlayDpr);
    overlayRef.value.height = Math.floor(h * overlayDpr);
    overlayRef.value.style.width = `${w}px`;
    overlayRef.value.style.height = `${h}px`;

    overlayCtx = overlayRef.value.getContext('2d');
    if (overlayCtx) overlayCtx.setTransform(overlayDpr, 0, 0, overlayDpr, 0, 0);

    markLeftDimsDirty();
  }

  function worldToScreen(v3) {
    const camera = getCamera();
    if (!camera || !hostRef.value) return null;
    const w = hostRef.value.clientWidth || 1;
    const h = hostRef.value.clientHeight || 1;

    const ndc = v3.clone().project(camera);
    return {
      x: (ndc.x * 0.5 + 0.5) * w,
      y: (-ndc.y * 0.5 + 0.5) * h,
      z: ndc.z,
    };
  }

  function getVisibleBBoxWorldSafe() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));

    const box = new THREE.Box3();
    let has = false;

    rootGroup.updateMatrixWorld(true);
    rootGroup.traverse((obj) => {
      if (!obj?.isMesh) return;
      if (obj.userData?.__mark) return;
      if (!obj.visible) return;

      const geo = obj.geometry;
      if (!geo) return;
      if (!geo.boundingBox) geo.computeBoundingBox();

      const bb = geo.boundingBox.clone();
      bb.applyMatrix4(obj.matrixWorld);

      if (!has) {
        box.copy(bb);
        has = true;
      } else {
        box.union(bb);
      }
    });

    if (!has) return new THREE.Box3().setFromObject(rootGroup);
    return box;
  }

  function formatDimValue(v) {
    const decimals = clampInt(props.leftDimsDecimals, 0, 6, 0);
    return Number.isFinite(v) ? v.toFixed(decimals) : '';
  }

  function drawLeftBaselineLine(ctx2d, visBox) {
    const min = visBox.min;
    const max = visBox.max;
    const axis = leftDimsAxisCache;
    const datum = leftDimsDatumCache;

    const corners =
      axis === 'x'
        ? [
            new THREE.Vector3(datum, min.y, min.z),
            new THREE.Vector3(datum, max.y, min.z),
            new THREE.Vector3(datum, max.y, max.z),
            new THREE.Vector3(datum, min.y, max.z),
          ]
        : [
            new THREE.Vector3(min.x, min.y, datum),
            new THREE.Vector3(max.x, min.y, datum),
            new THREE.Vector3(max.x, max.y, datum),
            new THREE.Vector3(min.x, max.y, datum),
          ];

    let minX = Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const c of corners) {
      const s = worldToScreen(c);
      if (!s) continue;
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) return;

    const out = 0;
    const pad = 6;

    const color = normalizeColor(props.leftDimsColor, '#111111');
    const lineW = clampNumber(props.leftDimsLineWidth, 1, 4, 1);

    ctx2d.save();
    ctx2d.strokeStyle = color;
    ctx2d.lineWidth = lineW;
    ctx2d.globalAlpha = 0.95;

    ctx2d.beginPath();
    ctx2d.moveTo(minX - out, minY - pad);
    ctx2d.lineTo(minX - out, maxY + pad);
    ctx2d.stroke();

    ctx2d.restore();
  }

  function rebuildLeftDimsCache() {
    leftDimsCache = [];
    const showDims = typeof getShowLeftDims === 'function' ? getShowLeftDims() : props.showLeftDims;
    if (!showDims || !getRootGroup() || !modelMetrics.ready) return;

    const visBox = getVisibleBBoxWorldSafe();
    leftDimsAxisCache = pickLongestAxisXZ(visBox);
    leftDimsDatumCache = axisVal(visBox.min, leftDimsAxisCache);

    const base = modelMetrics.base || 1;
    const minSize = base * clampNumber(props.leftDimsMinSizeRatio, 0, 0.1, 0.002);
    const maxCount = clampInt(props.leftDimsMaxCount, 1, 2000, 120);

    const unitScale = clampNumber(props.leftDimsUnitScale, 0.000001, 1e9, 1000);
    const axis = leftDimsAxisCache;
    const datum = leftDimsDatumCache;

    const items = [];
    const rootGroup = getRootGroup();
    const useGroup = !!props.activeGroupFilter && typeof getGroupNameForMesh === 'function';
    if (useGroup) {
      const groupBoxMap = new Map();
      rootGroup.updateMatrixWorld(true);
      rootGroup.traverse((obj) => {
        if (!obj?.isMesh) return;
        if (obj.userData?.__mark) return;
        if (!obj.visible) return;
        const key = String(getGroupNameForMesh(obj) || '').trim();
        if (!key) return;
        const geo = obj.geometry;
        if (!geo) return;
        if (!geo.boundingBox) geo.computeBoundingBox();
        if (!geo.boundingBox) return;
        const bb = geo.boundingBox.clone();
        bb.applyMatrix4(obj.matrixWorld);
        const entry = groupBoxMap.get(key);
        if (!entry) groupBoxMap.set(key, bb);
        else entry.union(bb);
      });
      groupBoxMap.forEach((mb, key) => {
        const ms = new THREE.Vector3();
        mb.getSize(ms);
        if (Math.max(ms.x, ms.y, ms.z) < minSize) return;

        const meshMin = axisVal(mb.min, axis);
        const dist = (meshMin - datum) * unitScale;
        if (!Number.isFinite(dist)) return;

        const y =
          props.leftDimsAnchor === 'bottom'
            ? mb.min.y
            : props.leftDimsAnchor === 'center'
              ? (mb.min.y + mb.max.y) * 0.5
              : mb.max.y;

        const k = `${key}:${axis}`;
        if (axis === 'x') {
          const z = (mb.min.z + mb.max.z) * 0.5;
          const aWorld = new THREE.Vector3(datum, y, z);
          const bWorld = new THREE.Vector3(meshMin, y, z);
          items.push({ aWorld, bWorld, value: dist, key: k });
        } else {
          const x = (mb.min.x + mb.max.x) * 0.5;
          const aWorld = new THREE.Vector3(x, y, datum);
          const bWorld = new THREE.Vector3(x, y, meshMin);
          items.push({ aWorld, bWorld, value: dist, key: k });
        }
      });
    } else {
      rootGroup.traverse((obj) => {
        if (!obj?.isMesh) return;
        if (obj.userData?.__mark) return;
        if (!obj.visible) return;

        const mb = new THREE.Box3().setFromObject(obj);
        const ms = new THREE.Vector3();
        mb.getSize(ms);
        if (Math.max(ms.x, ms.y, ms.z) < minSize) return;

        const meshMin = axisVal(mb.min, axis);
        const dist = (meshMin - datum) * unitScale;
        if (!Number.isFinite(dist)) return;

        const y =
          props.leftDimsAnchor === 'bottom'
            ? mb.min.y
            : props.leftDimsAnchor === 'center'
              ? (mb.min.y + mb.max.y) * 0.5
              : mb.max.y;

        const key = `${obj.uuid || 'mesh'}:${axis}`;
        if (axis === 'x') {
          const z = (mb.min.z + mb.max.z) * 0.5;
          const aWorld = new THREE.Vector3(datum, y, z);
          const bWorld = new THREE.Vector3(meshMin, y, z);
          items.push({ aWorld, bWorld, value: dist, key });
        } else {
          const x = (mb.min.x + mb.max.x) * 0.5;
          const aWorld = new THREE.Vector3(x, y, datum);
          const bWorld = new THREE.Vector3(x, y, meshMin);
          items.push({ aWorld, bWorld, value: dist, key });
        }
      });
    }

    items.sort((p, q) => p.value - q.value);
    leftDimsCache = items.slice(0, maxCount);
  }

  function drawLeftDimsOverlay() {
    if (!overlayCtx || !overlayRef.value || !hostRef.value) return;

    const showDims = typeof getShowLeftDims === 'function' ? getShowLeftDims() : props.showLeftDims;
    if (!showDims) {
      if (!overlayCleared) {
        overlayCtx.clearRect(0, 0, hostRef.value.clientWidth || 1, hostRef.value.clientHeight || 1);
        overlayCleared = true;
      }
      leftDimsHitCache = [];
      return;
    }
    overlayCleared = false;

    if (!getRootGroup() || !modelMetrics.ready) {
      overlayCtx.clearRect(0, 0, hostRef.value.clientWidth || 1, hostRef.value.clientHeight || 1);
      leftDimsHitCache = [];
      return;
    }

    if (leftDimsDirty) {
      rebuildLeftDimsCache();
      leftDimsDirty = false;
    }

    const ctx2d = overlayCtx;
    const w = hostRef.value.clientWidth || 1;
    const h = hostRef.value.clientHeight || 1;

    ctx2d.clearRect(0, 0, w, h);

    const color = normalizeColor(props.leftDimsColor, '#111111');
    const fontSize = clampNumber(props.leftDimsFontSize, 10, 24, 12);
    const lineW = clampNumber(props.leftDimsLineWidth, 1, 4, 1);
    const arrow = clampNumber(props.leftDimsArrowSize, 6, 18, 8);
    const baseOffset = clampNumber(props.leftDimsBaseOffsetPx, 8, 120, 18);
    const laneStep = clampNumber(props.leftDimsLaneStepPx, 10, 60, 14);

    const visBox = getVisibleBBoxWorldSafe();
    const centerWorld = visBox.getCenter(new THREE.Vector3());
    const centerScreen = worldToScreen(centerWorld) || { x: w * 0.5, y: h * 0.5 };
    const arrowLen = arrow * 2.0;
    const arrowHalf = arrow * 0.28;

    ctx2d.lineWidth = lineW;
    ctx2d.strokeStyle = color;
    ctx2d.fillStyle = color;
    ctx2d.globalAlpha = 0.9;

    const drawLine = (x1, y1, x2, y2) => {
      ctx2d.beginPath();
      ctx2d.moveTo(x1, y1);
      ctx2d.lineTo(x2, y2);
      ctx2d.stroke();
    };

    const drawArrow = (tip, dir) => {
      const dx = dir.x, dy = dir.y;
      const px = -dy, py = dx;
      const bx = tip.x + dx * arrowLen;
      const by = tip.y + dy * arrowLen;
      const l = { x: bx + px * arrowHalf, y: by + py * arrowHalf };
      const r = { x: bx - px * arrowHalf, y: by - py * arrowHalf };

      ctx2d.save();
      ctx2d.fillStyle = color;
      ctx2d.beginPath();
      ctx2d.moveTo(tip.x, tip.y);
      ctx2d.lineTo(l.x, l.y);
      ctx2d.lineTo(r.x, r.y);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.restore();
    };

    const font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    const drawTextRot = (p, angle, text, isHover = false) => {
      let a = angle;
      if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;

      ctx2d.save();
      ctx2d.translate(p.x, p.y);
      ctx2d.rotate(a);

      ctx2d.font = font;
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';

      if (isHover) {
        const textW = ctx2d.measureText(text).width;
        const textH = fontSize;
        const padX = 6;
        const padY = 3;
        ctx2d.fillStyle = 'rgba(37, 99, 235, 0.18)';
        ctx2d.strokeStyle = 'rgba(37, 99, 235, 0.5)';
        ctx2d.lineWidth = 1;
        ctx2d.fillRect(-textW / 2 - padX, -textH / 2 - padY, textW + padX * 2, textH + padY * 2);
        ctx2d.strokeRect(-textW / 2 - padX, -textH / 2 - padY, textW + padX * 2, textH + padY * 2);
      }

      ctx2d.lineWidth = Math.max(3, lineW + 2);
      ctx2d.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx2d.strokeText(text, 0, 0);

      ctx2d.lineWidth = 1;
      ctx2d.fillStyle = isHover ? '#1d4ed8' : color;
      ctx2d.fillText(text, 0, 0);

      ctx2d.restore();
      return a;
    };

    const hasMultipleDims = leftDimsCache.length > 1;

    leftDimsHitCache = [];
    const hostRect = hostRef.value?.getBoundingClientRect?.();
    if (!hasMultipleDims) return;
    leftDimsCache.forEach((it, idx) => {
      const A = worldToScreen(it.aWorld);
      const B = worldToScreen(it.bWorld);
      if (!A || !B) return;

      const vx = B.x - A.x;
      const vy = B.y - A.y;
      const vLen = Math.hypot(vx, vy);
      if (vLen < 8) return;

      const dx = vx / vLen;
      const dy = vy / vLen;

      let nx = -dy;
      let ny = dx;

      const mx = (A.x + B.x) * 0.5;
      const my = (A.y + B.y) * 0.5;
      const t1x = mx + nx * 10, t1y = my + ny * 10;
      const t2x = mx - nx * 10, t2y = my - ny * 10;
      const d1 = (t1x - centerScreen.x) ** 2 + (t1y - centerScreen.y) ** 2;
      const d2 = (t2x - centerScreen.x) ** 2 + (t2y - centerScreen.y) ** 2;
      if (d1 < d2) { nx = -nx; ny = -ny; }

      const off = baseOffset + idx * laneStep;
      const A2 = { x: A.x + nx * off, y: A.y + ny * off };
      const B2 = { x: B.x + nx * off, y: B.y + ny * off };

      drawLine(A.x, A.y, A2.x, A2.y);
      drawLine(B.x, B.y, B2.x, B2.y);

      const gapPx = arrow * 1.35;
      if (vLen > gapPx * 2 + 2) {
        const A3 = { x: A2.x + dx * gapPx, y: A2.y + dy * gapPx };
        const B3 = { x: B2.x - dx * gapPx, y: B2.y - dy * gapPx };
        drawLine(A3.x, A3.y, B3.x, B3.y);
      } else {
        const maskLen = Math.max(0, arrowLen - Math.max(1, lineW));
        if (vLen > maskLen * 2 + 2) {
          const A3 = { x: A2.x + dx * maskLen, y: A2.y + dy * maskLen };
          const B3 = { x: B2.x - dx * maskLen, y: B2.y - dy * maskLen };
          drawLine(A3.x, A3.y, B3.x, B3.y);
        } else {
          drawLine(A2.x, A2.y, B2.x, B2.y);
        }
      }

      drawArrow({ x: A2.x, y: A2.y }, { x: dx, y: dy });
      drawArrow({ x: B2.x, y: B2.y }, { x: -dx, y: -dy });

      const mid = { x: (A2.x + B2.x) * 0.5, y: (A2.y + B2.y) * 0.5 };
      const override = it.key ? leftDimsTextOverrides.get(it.key) : null;
      const text = override && String(override).trim() ? String(override) : formatDimValue(it.value);
      const angle = drawTextRot(mid, Math.atan2(dy, dx), text, false);

      if (hostRect) {
        ctx2d.font = font;
        const textW = ctx2d.measureText(text).width;
        const textH = fontSize;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const bboxW = Math.abs(textW * cos) + Math.abs(textH * sin);
        const bboxH = Math.abs(textW * sin) + Math.abs(textH * cos);
        const pad = 6;
        const left = hostRect.left + mid.x - bboxW / 2 - pad;
        const right = hostRect.left + mid.x + bboxW / 2 + pad;
        const top = hostRect.top + mid.y - bboxH / 2 - pad;
        const bottom = hostRect.top + mid.y + bboxH / 2 + pad;
        leftDimsHitCache.push({ left, right, top, bottom, key: it.key, text });
      }
    });

    ctx2d.globalAlpha = 1;
  }

  function hitLeftDimText(ev) {
    if (!leftDimsHitCache.length) return null;
    const x = ev.clientX;
    const y = ev.clientY;
    for (const it of leftDimsHitCache) {
      if (x >= it.left && x <= it.right && y >= it.top && y <= it.bottom) return it;
    }
    return null;
  }

  function setLeftDimTextOverride(key, text) {
    if (!key) return;
    const v = String(text ?? '').trim();
    if (v) leftDimsTextOverrides.set(key, v);
    else leftDimsTextOverrides.delete(key);
  }

  return {
    resizeOverlayCanvas,
    drawLeftDimsOverlay,
    markLeftDimsDirty,
    hitLeftDimText,
    setLeftDimTextOverride,
    worldToScreen,
    getVisibleBBoxWorldSafe,
  };
}
