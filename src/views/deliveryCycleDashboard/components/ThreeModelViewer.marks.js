import * as THREE from 'three';

export function createMarks(ctx) {
  const {
    CSS2DObject,
    markRaw,
    props,
    marksGroupRef,
    markStore,
    meshByUuid,
    modelMetrics,
    UP,
    getToolMode,
    getMeasureUnitScale,
    getMeasureLineRadius,
    getWorldUnitsPerPixelAt,
    getNoteLeaderLineRadius,
    getNotePointColor,
    getMeasurePointColor,
    getMeasureLineColor,
    getNoteLabelColor,
    getMeasureLabelColor,
    getNotePointScale,
    getMeasurePointScale,
    getNoteLabelOffsetScale,
    getNoteMarkerSize,
    getMeasureMarkerSize,
    getHitboxSize,
    getMarkSizeBase,
    getDefaultNoteLabelOffset,
    resolveNoteLabelOffset,
    makeBind,
    bindToWorld,
    setBindWorldPosition,
    getMeshCode,
    getBBoxCenterWorldSafe,
    getBBoxDeltaFromCenter,
    emit,
    getMeasurePending,
    setMeasurePending,
    getMeasureIndex,
    setMeasureIndex,
    getNoteIndex,
    setNoteIndex,
  } = ctx;

  function makeLabel(text) {
    const el = document.createElement('div');
    el.className = 'mv-label';
    el.textContent = text;
    return el;
  }
  const asRaw = (obj) => (typeof markRaw === 'function' ? markRaw(obj) : obj);

  function addPointMarker(p, size, color) {
    const g = new THREE.SphereGeometry(size, 14, 14);
    const m = new THREE.MeshBasicMaterial({ color });
    const s = asRaw(new THREE.Mesh(g, m));
    s.position.copy(p);
    s.userData.__mark = true;
    marksGroupRef.value.add(s);
    return s;
  }

  function updateLineMesh(line, a, b, radius) {
    if (!line || !a || !b) return;
    const dir = b.clone().sub(a);
    const len = dir.length();
    if (!Number.isFinite(len) || len <= 0.000001) {
      line.visible = false;
      return;
    }
    const mid = a.clone().add(b).multiplyScalar(0.5);
    line.visible = true;
    line.position.copy(mid);
    dir.normalize();
    line.quaternion.setFromUnitVectors(UP, dir);
    const r = Math.max(0.0005, radius);
    line.scale.set(r, len, r);
  }

  function getMeasurePixelRadiusAt(p, px = 1) {
    if (!p || typeof getWorldUnitsPerPixelAt !== 'function') return getMeasureMarkerSize();
    const unit = getWorldUnitsPerPixelAt(p);
    if (!Number.isFinite(unit) || unit <= 0) return getMeasureMarkerSize();
    return Math.max(0.000001, unit * (px * 0.5));
  }

  function getMeasureLineRadiusAt(a, b, px = 1) {
    if (!a || !b) return getMeasureLineRadius();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    return getMeasurePixelRadiusAt(mid, px);
  }

  function addLine(a, b, color) {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color });
    const line = asRaw(new THREE.Mesh(geo, mat));
    line.userData.__mark = true;
    marksGroupRef.value.add(line);
    updateLineMesh(line, a, b, getMeasureLineRadius());
    return line;
  }

  function addLeaderLine(a, b, color) {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false });
    const line = asRaw(new THREE.Mesh(geo, mat));
    line.userData.__mark = true;
    marksGroupRef.value.add(line);
    updateLineMesh(line, a, b, getNoteLeaderLineRadius());
    return line;
  }

  function addMeasureLeaderLine(a, b, color) {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false });
    const line = asRaw(new THREE.Mesh(geo, mat));
    line.userData.__mark = true;
    marksGroupRef.value.add(line);
    updateLineMesh(line, a, b, getMeasureLineRadius());
    return line;
  }

  function addDragHitbox(p, size) {
    const g = new THREE.SphereGeometry(Math.max(0.001, size), 10, 10);
    const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const s = asRaw(new THREE.Mesh(g, m));
    s.position.copy(p);
    s.userData.__mark = true;
    marksGroupRef.value.add(s);
    return s;
  }

  function setMarkerRadius(mesh, radius, segments = 14) {
    if (!mesh) return;
    const r = Math.max(0.001, radius);
    try {
      mesh.geometry?.dispose?.();
    } catch (e) {}
    mesh.geometry = new THREE.SphereGeometry(r, segments, segments);
  }

  function setMeshColor(mesh, color) {
    if (!mesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      if (!m || !m.color) return;
      m.color.setHex(color);
      m.needsUpdate = true;
    });
  }

  function setLabelColor(labelObj, color) {
    if (!labelObj?.element) return;
    labelObj.element.style.color = color;
  }

  function resolveNotePosition(data) {
    if (Array.isArray(data?.position) && data.position.length >= 3) {
      return new THREE.Vector3(data.position[0], data.position[1], data.position[2]);
    }
    if (Array.isArray(data?.bboxDelta) && data.bboxDelta.length >= 3) {
      const center = getBBoxCenterWorldSafe();
      const delta = new THREE.Vector3(data.bboxDelta[0], data.bboxDelta[1], data.bboxDelta[2]);
      return center.clone().add(delta);
    }
    return null;
  }

  function resolveMeasurePoint(worldArr, deltaArr, centerArr) {
    if (Array.isArray(worldArr) && worldArr.length >= 3) {
      return new THREE.Vector3(worldArr[0], worldArr[1], worldArr[2]);
    }
    if (Array.isArray(deltaArr) && deltaArr.length >= 3) {
      const base = Array.isArray(centerArr) && centerArr.length >= 3
        ? new THREE.Vector3(centerArr[0], centerArr[1], centerArr[2])
        : getBBoxCenterWorldSafe();
      return base.clone().add(new THREE.Vector3(deltaArr[0], deltaArr[1], deltaArr[2]));
    }
    return null;
  }

  function addNoteFromData(data) {
    const p = resolveNotePosition(data);
    if (!p || !marksGroupRef.value) return null;

    const id = typeof data?.id === 'number' ? data.id : allocMarkId();
    if (Number.isFinite(id) && ctx.markIdSeq.value <= id) ctx.markIdSeq.value = id + 1;
    const seq = typeof data?.seq === 'number' ? data.seq : getNoteIndex() + 1;
    setNoteIndex(Math.max(getNoteIndex(), seq));

    const marker = addPointMarker(p, getNoteMarkerSize(), getNotePointColor());
    const markerHit = addDragHitbox(p, getHitboxSize(getNotePointScale()));
    const labelObj = asRaw(new CSS2DObject(makeLabel(data?.text || '')));
    labelObj.userData.__mark = true;
    setLabelColor(labelObj, getNoteLabelColor());
    marksGroupRef.value.add(labelObj);
    const labelOffset = resolveNoteLabelOffset({ labelOffset: data?.labelOffset });
    const labelPos = p.clone().add(labelOffset);
    labelObj.position.copy(labelPos);
    const labelLine = addLeaderLine(p, labelPos, getNoteLabelColor());

    markerHit.userData.__dragHandle = 'note';
    markerHit.userData.__markId = id;

    markStore.set(id, {
      id,
      type: 'note',
      seq,
      bind: { world: p.toArray() },
      marker,
      markerHit,
      label: labelObj,
      labelLine,
      labelOffset: labelOffset.toArray(),
      text: typeof data?.text === 'string' ? data.text : '',
      code: data?.code || '',
    });

    updateBoundMarks();
    return id;
  }

  function addMeasureFromData(data) {
    const baseCenter = data?.centerWorld;
    const a = resolveMeasurePoint(data?.a, data?.aDelta, baseCenter);
    const b = resolveMeasurePoint(data?.b, data?.bDelta, baseCenter);
    if (!a || !b || !marksGroupRef.value) return null;

    const id = typeof data?.id === 'number' ? data.id : allocMarkId();
    if (Number.isFinite(id) && ctx.markIdSeq.value <= id) ctx.markIdSeq.value = id + 1;
    const seq = typeof data?.seq === 'number' ? data.seq : getMeasureIndex() + 1;
    setMeasureIndex(Math.max(getMeasureIndex(), seq));

    const markerA = addPointMarker(a, getMeasureMarkerSize(), getMeasurePointColor());
    const markerAHit = addDragHitbox(a, getHitboxSize(getMeasurePointScale()));
    const markerB = addPointMarker(b, getMeasureMarkerSize(), getMeasurePointColor());
    const markerBHit = addDragHitbox(b, getHitboxSize(getMeasurePointScale()));
    const line = addLine(a, b, getMeasureLineColor());

    const dist = a.distanceTo(b);
    const distScaled = dist * (typeof getMeasureUnitScale === 'function' ? getMeasureUnitScale() : 1);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const labelObj = asRaw(new CSS2DObject(makeLabel(`${distScaled.toFixed(3)}`)));
    labelObj.userData.__mark = true;
    setLabelColor(labelObj, getMeasureLabelColor());
    const labelOffset = Array.isArray(data?.labelOffset) && data.labelOffset.length >= 3
      ? new THREE.Vector3(data.labelOffset[0], data.labelOffset[1], data.labelOffset[2])
      : new THREE.Vector3();
    const labelPos = mid.clone().add(labelOffset);
    labelObj.position.copy(labelPos);
    marksGroupRef.value.add(labelObj);
    const a2 = a.clone().add(labelOffset);
    const b2 = b.clone().add(labelOffset);
    const labelLineA = addMeasureLeaderLine(a, a2, getMeasureLabelColor());
    const labelLineB = addMeasureLeaderLine(b, b2, getMeasureLabelColor());

    markerAHit.userData.__dragHandle = 'a';
    markerBHit.userData.__dragHandle = 'b';
    markerAHit.userData.__markId = id;
    markerBHit.userData.__markId = id;

    markStore.set(id, {
      id,
      type: 'measure',
      seq,
      bindA: { world: a.toArray() },
      bindB: { world: b.toArray() },
      markerA,
      markerAHit,
      markerB,
      markerBHit,
      line,
      label: labelObj,
      labelLineA,
      labelLineB,
      labelOffset: labelOffset.toArray(),
      customText: typeof data?.text === 'string' && data.text.trim() ? data.text : null,
    });

    updateBoundMarks();
    return id;
  }

  function clearMeasurePending() {
    const measurePending = getMeasurePending();
    if (!measurePending) return;
    try {
      if (marksGroupRef.value && measurePending.marker) disposeAndRemove(marksGroupRef.value, measurePending.marker);
      if (marksGroupRef.value && measurePending.markerHit) disposeAndRemove(marksGroupRef.value, measurePending.markerHit);
    } catch (e) {}
    setMeasurePending(null);
  }

  function handleMeasureClick(p, mesh, code = '') {
    const bind = makeBind(mesh, p);
    if (!bind) return;

    let measurePending = getMeasurePending();
    if (!measurePending) {
      const marker = addPointMarker(p, getMeasureMarkerSize(), getMeasurePointColor());
      const markerHit = addDragHitbox(p, getHitboxSize(getMeasurePointScale()));
      markerHit.userData.__dragHandle = null;
      markerHit.userData.__markId = -1;
      setMeasurePending({ bind, marker, markerHit, code });
      return;
    }

    const bindA = measurePending.bind;
    const bindB = bind;

    const a = bindToWorld(bindA);
    const b = bindToWorld(bindB);
    if (!a || !b) {
      clearMeasurePending();
      return;
    }

    const markerA = measurePending.marker;
    const markerAHit = measurePending.markerHit;
    markerA.position.copy(a);
    markerAHit.position.copy(a);

    const markerB = addPointMarker(b, getMeasureMarkerSize(), getMeasurePointColor());
    const markerBHit = addDragHitbox(b, getHitboxSize(getMeasurePointScale()));

    const line = addLine(a, b, getMeasureLineColor());

    const dist = a.distanceTo(b);
    const distScaled = dist * (typeof getMeasureUnitScale === 'function' ? getMeasureUnitScale() : 1);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const bboxDelta = getBBoxDeltaFromCenter(mid);
    const center = getBBoxCenterWorldSafe();
    const aDelta = a.clone().sub(center);
    const bDelta = b.clone().sub(center);
    const labelObj = asRaw(new CSS2DObject(makeLabel(`${distScaled.toFixed(3)}`)));
    labelObj.userData.__mark = true;
    setLabelColor(labelObj, getMeasureLabelColor());
    labelObj.position.copy(mid);
    marksGroupRef.value.add(labelObj);
    const a2 = a.clone();
    const b2 = b.clone();
    const labelLineA = addMeasureLeaderLine(a, a2, getMeasureLabelColor());
    const labelLineB = addMeasureLeaderLine(b, b2, getMeasureLabelColor());

    const id = allocMarkId();
    markerAHit.userData.__dragHandle = 'a';
    markerBHit.userData.__dragHandle = 'b';
    markerAHit.userData.__markId = id;
    markerBHit.userData.__markId = id;

    setMeasureIndex(getMeasureIndex() + 1);

    markStore.set(id, {
      id,
      type: 'measure',
      seq: getMeasureIndex(),
      bindA,
      bindB,
      markerA,
      markerAHit,
      markerB,
      markerBHit,
      line,
      label: labelObj,
      labelLineA,
      labelLineB,
      labelOffset: [0, 0, 0],
      customText: null,
    });

    emit('measure', {
      id,
      seq: getMeasureIndex(),
      index: getMeasureIndex(),
      distance: distScaled,
      a: a.toArray(),
      b: b.toArray(),
      bboxDelta: bboxDelta ? bboxDelta.toArray() : null,
      aDelta: aDelta.toArray(),
      bDelta: bDelta.toArray(),
      aCode: measurePending.code || '',
      bCode: code || '',
      labelOffset: [0, 0, 0],
      text: '',
    });

    setMeasurePending(null);
    updateBoundMarks();
  }

  function handleNoteClick(p, mesh, code = '') {
    const bind = makeBind(mesh, p);
    if (!bind) return;

    setNoteIndex(getNoteIndex() + 1);

    const marker = addPointMarker(p, getNoteMarkerSize(), getNotePointColor());
    const markerHit = addDragHitbox(p, getHitboxSize(getNotePointScale()));

    const defaultText = `Note-${getNoteIndex()}`;
    const labelObj = asRaw(new CSS2DObject(makeLabel(defaultText)));
    labelObj.userData.__mark = true;
    setLabelColor(labelObj, getNoteLabelColor());
    marksGroupRef.value.add(labelObj);
    const labelOffset = getDefaultNoteLabelOffset();
    const labelPos = p.clone().add(labelOffset);
    labelObj.position.copy(labelPos);
    const labelLine = addLeaderLine(p, labelPos, getNoteLabelColor());

    const id = allocMarkId();
    markerHit.userData.__dragHandle = 'note';
    markerHit.userData.__markId = id;

    markStore.set(id, {
      id,
      type: 'note',
      seq: getNoteIndex(),
      bind,
      marker,
      markerHit,
      label: labelObj,
      labelLine,
      labelOffset: labelOffset.toArray(),
      text: defaultText,
      code,
    });

    emit('note-added', {
      id,
      seq: getNoteIndex(),
      code,
      position: p.toArray(),
      bboxDelta: getBBoxDeltaFromCenter(p)?.toArray() || null,
      text: defaultText,
      labelOffset: labelOffset.toArray(),
    });

    updateBoundMarks();
  }

  function clearMarks() {
    clearMeasurePending();
    for (const [id, it] of markStore.entries()) {
      if (it?.type === 'note' || it?.type === 'measure') markStore.delete(id);
    }
    if (!marksGroupRef.value) return;
    const toRemove = [...marksGroupRef.value.children];
    toRemove.forEach((obj) => disposeAndRemove(marksGroupRef.value, obj));
  }

  function updateBoundMarks() {
    if (!getRootGroup() || !modelMetrics.ready) return;
    const filter = props.markFilter || 'all';
    let showNote = filter === 'all' || filter === 'note';
    let showMeasure = filter === 'all' || filter === 'dim';
    const toolMode = typeof getToolMode === 'function' ? getToolMode() : '';
    if (toolMode === 'note') showNote = true;
    if (toolMode === 'measure') showMeasure = true;

    const measurePending = getMeasurePending();
    if (measurePending?.bind && measurePending?.marker) {
      const wp = bindToWorld(measurePending.bind);
      if (wp) {
        measurePending.marker.position.copy(wp);
        measurePending.markerHit?.position?.copy(wp);
        setMarkerRadius(measurePending.marker, getMeasurePixelRadiusAt(wp, 1));
      }
      if (measurePending.marker) measurePending.marker.visible = showMeasure;
      if (measurePending.markerHit) measurePending.markerHit.visible = showMeasure;
    }

    for (const it of markStore.values()) {
      if (!it) continue;

      if (it.type === 'note') {
        const wp = bindToWorld(it.bind);
        const mesh = meshByUuid.get(it.bind?.meshUuid);
        const visible = (mesh ? isObjectVisibleDeep(mesh) : true) && showNote;

        if (wp) {
          it.marker.position.copy(wp);
          it.markerHit.position.copy(wp);

          const labelPos = wp.clone().add(resolveNoteLabelOffset(it));
          it.label.position.copy(labelPos);
          if (it.labelLine) {
            updateLineMesh(it.labelLine, wp, labelPos, getNoteLeaderLineRadius());
            it.labelLine.visible = visible;
          }

          it.marker.visible = visible;
          it.markerHit.visible = visible;
          it.label.visible = visible;

          setText(it.label, it.text ?? '');
        }
      }

      if (it.type === 'measure') {
        const a = bindToWorld(it.bindA);
        const b = bindToWorld(it.bindB);

        const meshA = meshByUuid.get(it.bindA?.meshUuid);
        const meshB = meshByUuid.get(it.bindB?.meshUuid);
        const visible =
          (meshA ? isObjectVisibleDeep(meshA) : true) && (meshB ? isObjectVisibleDeep(meshB) : true) && showMeasure;

        if (a && b) {
          it.markerA.position.copy(a);
          it.markerAHit.position.copy(a);
          it.markerB.position.copy(b);
          it.markerBHit.position.copy(b);
          setMarkerRadius(it.markerA, getMeasurePixelRadiusAt(a, 1));
          setMarkerRadius(it.markerB, getMeasurePixelRadiusAt(b, 1));

          const dist = a.distanceTo(b);
          const distScaled = dist * (typeof getMeasureUnitScale === 'function' ? getMeasureUnitScale() : 1);
          const mid = a.clone().add(b).multiplyScalar(0.5);
          const offset = Array.isArray(it.labelOffset) && it.labelOffset.length >= 3
            ? new THREE.Vector3(it.labelOffset[0], it.labelOffset[1], it.labelOffset[2])
            : new THREE.Vector3();
          const a2 = a.clone().add(offset);
          const b2 = b.clone().add(offset);
          if (it.line) {
            updateLineMesh(it.line, a2, b2, getMeasureLineRadiusAt(a2, b2, 1));
            it.line.visible = visible;
          }
          const labelPos = mid.clone().add(offset);
          it.label.position.copy(labelPos);
          if (it.labelLineA) {
            updateLineMesh(it.labelLineA, a, a2, getMeasurePixelRadiusAt(a, 1));
            it.labelLineA.visible = visible;
          }
          if (it.labelLineB) {
            updateLineMesh(it.labelLineB, b, b2, getMeasurePixelRadiusAt(b, 1));
            it.labelLineB.visible = visible;
          }
          const autoTxt = `${distScaled.toFixed(3)}`;
          const txt = it.customText && String(it.customText).trim() ? it.customText : autoTxt;
          setText(it.label, txt);

          it.markerA.visible = visible;
          it.markerAHit.visible = visible;
          it.markerB.visible = visible;
          it.markerBHit.visible = visible;
          it.line.visible = visible;
          it.label.visible = visible;
        }
      }
    }
  }

  function updateNoteMeta(id, patch) {
    const it = markStore.get(id);
    if (!it || it.type !== 'note') return;
    const p = patch || {};
    if (Object.prototype.hasOwnProperty.call(p, 'seq')) it.seq = p.seq;
    if (Object.prototype.hasOwnProperty.call(p, 'text')) {
      it.text = String(p.text ?? '');
      setText(it.label, it.text);
    }
  }

  function updateMeasureMeta(id, patch) {
    const it = markStore.get(id);
    if (!it || it.type !== 'measure') return;
    const p = patch || {};
    if (Object.prototype.hasOwnProperty.call(p, 'seq')) it.seq = p.seq;
    if (Object.prototype.hasOwnProperty.call(p, 'text')) {
      const v = String(p.text ?? '').trim();
      it.customText = v ? v : null;
      updateBoundMarks();
    }
  }

  function updateNotePositionByDelta(id, deltaArr) {
    const it = markStore.get(id);
    if (!it || it.type !== 'note') return;
    if (!Array.isArray(deltaArr) || deltaArr.length < 3) return;
    const center = getBBoxCenterWorldSafe();
    const delta = new THREE.Vector3(deltaArr[0], deltaArr[1], deltaArr[2]);
    const wp = center.clone().add(delta);
    setBindWorldPosition(it.bind, wp);
    updateBoundMarks();
  }

  function updateMeasurePositionByDelta(id, deltaArr) {
    const it = markStore.get(id);
    if (!it || it.type !== 'measure') return;
    if (!Array.isArray(deltaArr) || deltaArr.length < 3) return;
    const a = bindToWorld(it.bindA);
    const b = bindToWorld(it.bindB);
    if (!a || !b) return;
    const center = getBBoxCenterWorldSafe();
    const newMid = center.clone().add(new THREE.Vector3(deltaArr[0], deltaArr[1], deltaArr[2]));
    const curMid = a.clone().add(b).multiplyScalar(0.5);
    const shift = newMid.sub(curMid);
    setBindWorldPosition(it.bindA, a.clone().add(shift));
    setBindWorldPosition(it.bindB, b.clone().add(shift));
    updateBoundMarks();
  }

  function updateMeasurePointByDelta(id, pointKey, deltaArr) {
    const it = markStore.get(id);
    if (!it || it.type !== 'measure') return;
    if (!Array.isArray(deltaArr) || deltaArr.length < 3) return;
    const center = getBBoxCenterWorldSafe();
    const wp = center.clone().add(new THREE.Vector3(deltaArr[0], deltaArr[1], deltaArr[2]));
    if (pointKey === 'a') setBindWorldPosition(it.bindA, wp);
    else if (pointKey === 'b') setBindWorldPosition(it.bindB, wp);
    updateBoundMarks();
  }

  function removeMarkById(id) {
    const it = markStore.get(id);
    if (!it || !marksGroupRef.value) return;
    if (it.type === 'note') {
      disposeAndRemove(marksGroupRef.value, it.marker);
      disposeAndRemove(marksGroupRef.value, it.markerHit);
      disposeAndRemove(marksGroupRef.value, it.label);
      if (it.labelLine) disposeAndRemove(marksGroupRef.value, it.labelLine);
    } else if (it.type === 'measure') {
      disposeAndRemove(marksGroupRef.value, it.markerA);
      disposeAndRemove(marksGroupRef.value, it.markerAHit);
      disposeAndRemove(marksGroupRef.value, it.markerB);
      disposeAndRemove(marksGroupRef.value, it.markerBHit);
      disposeAndRemove(marksGroupRef.value, it.line);
      disposeAndRemove(marksGroupRef.value, it.label);
      if (it.labelLineA) disposeAndRemove(marksGroupRef.value, it.labelLineA);
      if (it.labelLineB) disposeAndRemove(marksGroupRef.value, it.labelLineB);
    }
    markStore.delete(id);
  }

  function emitNoteUpdatedById(id) {
    const it = markStore.get(id);
    if (!it || it.type !== 'note') return;
    const wp = bindToWorld(it.bind);
    const bboxDelta = wp ? getBBoxDeltaFromCenter(wp) : null;
    emit('note-updated', {
      id: it.id,
      text: it.text ?? '',
      code: it.code || '',
      position: wp ? wp.toArray() : null,
      bboxDelta: bboxDelta ? bboxDelta.toArray() : null,
      labelOffset: Array.isArray(it.labelOffset) ? it.labelOffset : null,
    });
  }

  function emitMeasureUpdatedById(id) {
    const it = markStore.get(id);
    if (!it || it.type !== 'measure') return;
    const a = bindToWorld(it.bindA);
    const b = bindToWorld(it.bindB);
    if (!a || !b) return;
    const center = getBBoxCenterWorldSafe();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const bboxDelta = getBBoxDeltaFromCenter(mid);
    const aDelta = a.clone().sub(center);
    const bDelta = b.clone().sub(center);
    const text = it.customText && String(it.customText).trim() ? it.customText : '';
    emit('measure-updated', {
      id: it.id,
      distance: a.distanceTo(b) * (typeof getMeasureUnitScale === 'function' ? getMeasureUnitScale() : 1),
      a: a.toArray(),
      b: b.toArray(),
      bboxDelta: bboxDelta ? bboxDelta.toArray() : null,
      aDelta: aDelta.toArray(),
      bDelta: bDelta.toArray(),
      labelOffset: Array.isArray(it.labelOffset) ? it.labelOffset : null,
      text,
    });
  }

  function focusNote(id) {
    const it = markStore.get(id);
    if (!it || it.type !== 'note') return;
    const wp = it.marker?.position?.clone() || bindToWorld(it.bind);
    if (!wp) return;
    focusPoint(wp, 0.45);
  }

  function focusMeasure(id) {
    const it = markStore.get(id);
    if (!it || it.type !== 'measure') return;
    const a = bindToWorld(it.bindA);
    const b = bindToWorld(it.bindB);
    if (!a || !b) return;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    focusPoint(mid, 1.35);
  }

  function focusPoint(p, ratio = 1.3) {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;
    const box = new THREE.Box3().setFromObject(rootGroup);
    if (p) {
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxSize = Math.max(size.x, size.y, size.z);
      const center = p.clone();
      const half = Math.max(maxSize / 2, 0.01) * ratio;
      box.min.copy(center.clone().addScalar(-half));
      box.max.copy(center.clone().addScalar(half));
    }
    fitBox(box);
  }

  function getMeasureBaseCenterWorld() {
    return getBBoxCenterWorldSafe().toArray();
  }

  function getMeasureWorldPoints(id) {
    const it = markStore.get(id);
    if (!it || it.type !== 'measure') return null;
    const a = bindToWorld(it.bindA);
    const b = bindToWorld(it.bindB);
    if (!a || !b) return null;
    return { a: a.toArray(), b: b.toArray() };
  }

  function applyMarkSizing() {
    const noteScale = getNotePointScale();
    const measureScale = getMeasurePointScale();
    const noteMarkerSize = getMarkSizeBase() * 1.25 * noteScale;
    const noteHitSize = getHitboxSize(noteScale);
    const measureMarkerSize = getMeasureMarkerSize();
    const measureHitSize = getHitboxSize(measureScale);

    const measurePending = getMeasurePending();
    if (measurePending?.marker) setMarkerRadius(measurePending.marker, measureMarkerSize);
    if (measurePending?.markerHit) setMarkerRadius(measurePending.markerHit, measureHitSize, 10);

    for (const it of markStore.values()) {
      if (!it) continue;
      if (it.type === 'note') {
        setMarkerRadius(it.marker, noteMarkerSize);
        setMarkerRadius(it.markerHit, noteHitSize, 10);
      } else if (it.type === 'measure') {
        setMarkerRadius(it.markerA, measureMarkerSize);
        setMarkerRadius(it.markerB, measureMarkerSize);
        setMarkerRadius(it.markerAHit, measureHitSize, 10);
        setMarkerRadius(it.markerBHit, measureHitSize, 10);
      }
    }
  }

  function applyMarkColors() {
    const notePointColor = getNotePointColor();
    const noteLabelColor = getNoteLabelColor();
    const measurePointColor = getMeasurePointColor();
    const measureLineColor = getMeasureLineColor();
    const measureLabelColor = getMeasureLabelColor();

    const measurePending = getMeasurePending();
    if (measurePending?.marker) setMeshColor(measurePending.marker, measurePointColor);

    for (const it of markStore.values()) {
      if (!it) continue;
      if (it.type === 'note') {
        setMeshColor(it.marker, notePointColor);
        setLabelColor(it.label, noteLabelColor);
        if (it.labelLine) setMeshColor(it.labelLine, noteLabelColor);
      } else if (it.type === 'measure') {
        setMeshColor(it.markerA, measurePointColor);
        setMeshColor(it.markerB, measurePointColor);
        setMeshColor(it.line, measureLineColor);
        setLabelColor(it.label, measureLabelColor);
        if (it.labelLineA) setMeshColor(it.labelLineA, measureLabelColor);
        if (it.labelLineB) setMeshColor(it.labelLineB, measureLabelColor);
      }
    }
  }

  function allocMarkId() {
    const id = ctx.markIdSeq.value;
    ctx.markIdSeq.value += 1;
    return id;
  }

  function setText(labelObj, txt) {
    if (!labelObj?.element) return;
    labelObj.element.textContent = txt;
  }

  function disposeAndRemove(parent, obj) {
    if (!parent || !obj) return;
    parent.remove(obj);
    try {
      if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
      if (obj.material) {
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose && mm.dispose());
        else m.dispose && m.dispose();
      }
    } catch (e) {}
  }

  function isObjectVisibleDeep(obj) {
    let cur = obj;
    while (cur) {
      if (cur.visible === false) return false;
      cur = cur.parent;
    }
    return true;
  }

  function getRootGroup() {
    return ctx.getRootGroup();
  }

  function fitBox(box) {
    return ctx.fitBox(box);
  }

  return {
    makeLabel,
    addNoteFromData,
    addMeasureFromData,
    handleMeasureClick,
    handleNoteClick,
    clearMarks,
    clearMeasurePending,
    updateBoundMarks,
    updateNoteMeta,
    updateMeasureMeta,
    updateNotePositionByDelta,
    updateMeasurePositionByDelta,
    updateMeasurePointByDelta,
    removeMarkById,
    emitNoteUpdatedById,
    emitMeasureUpdatedById,
    focusNote,
    focusMeasure,
    getMeasureBaseCenterWorld,
    getMeasureWorldPoints,
    applyMarkSizing,
    applyMarkColors,
    updateLineMesh,
    setMeshColor,
    setLabelColor,
    addDragHitbox,
    addPointMarker,
    addLine,
    addLeaderLine,
  };
}
