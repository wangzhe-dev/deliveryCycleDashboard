import * as THREE from 'three';

export function createInteraction(ctx) {
  const {
    props,
    hostRef,
    tip,
    emit,
    markStore,
    meshByUuid,
    marksGroupRef,
    getRenderer,
    getCamera,
    getRaycaster,
    getPointer,
    getRootGroup,
    getDragThreshold,
    getMeshCode,
    getGroupNameForMesh,
    getPartNameForMesh,
    getPartTitleForMesh,
    isObjectVisibleDeep,
    makeBind,
    bindToWorld,
    setBindWorldPosition,
    resolveNoteLabelOffset,
    updateBoundMarks,
    clearMeasurePending,
    handleMeasureClick,
    handleNoteClick,
    setControlsEnabled,
    openLeftDimEditor,
    openMarkEditorById,
    cancelEdit,
    hitLeftDimText,
    fitView,
    fitViewMesh,
    setSelectedMesh,
    applyAll,
    highlightMeshOnly,
    showAllMeshes,
    emitNoteUpdatedById,
    emitMeasureUpdatedById,
    getScene,
  } = ctx;

  let dragState = null;
  let leftDimsHoverKey = null;

  function getPointerNDC(ev) {
    const renderer = getRenderer();
    const pointer = getPointer();
    if (!renderer || !pointer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function intersectFirstMesh(ev) {
    const renderer = getRenderer();
    const camera = getCamera();
    const raycaster = getRaycaster();
    const pointer = getPointer();
    const rootGroup = getRootGroup();
    if (!renderer || !camera || !raycaster || !pointer || !rootGroup) return null;
    getPointerNDC(ev);
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObject(rootGroup, true);
    for (const h of hits) {
      const o = h.object;
      if (!o) continue;
      if (!o.isMesh) continue;
      if (!o.visible) continue;
      if (o.userData?.__mark) continue;
      return h;
    }
    return null;
  }

  function intersectDragHandle(ev) {
    const renderer = getRenderer();
    const camera = getCamera();
    const raycaster = getRaycaster();
    const pointer = getPointer();
    const marksGroup = marksGroupRef.value;
    if (!renderer || !camera || !raycaster || !pointer || !marksGroup) return null;

    getPointerNDC(ev);
    raycaster.setFromCamera(pointer, camera);

    const thr = getDragThreshold();
    raycaster.params.Points.threshold = thr;

    const hits = raycaster.intersectObject(marksGroup, true);
    hits.sort((a, b) => a.distance - b.distance);

    for (const h of hits) {
      const o = h.object;
      if (!o?.userData?.__mark) continue;
      if (!o.userData?.__dragHandle) continue;
      if (typeof o.userData?.__markId !== 'number') continue;
      return h;
    }
    return null;
  }

  function hitLabelMarkIdByDomRect(ev) {
    const x = ev.clientX;
    const y = ev.clientY;

    for (const it of markStore.values()) {
      const obj = it?.label;
      const el = obj?.element;
      if (!obj || !el) continue;
      if (obj.visible === false) continue;

      if (it.type === 'note') {
        const mesh = meshByUuid.get(it.bind?.meshUuid);
        if (mesh && !isObjectVisibleDeep(mesh)) continue;
      }
      if (it.type === 'measure') {
        const meshA = meshByUuid.get(it.bindA?.meshUuid);
        const meshB = meshByUuid.get(it.bindB?.meshUuid);
        if ((meshA && !isObjectVisibleDeep(meshA)) || (meshB && !isObjectVisibleDeep(meshB))) continue;
      }

      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { id: it.id, axis: null };
    }
    return null;
  }

  function intersectPointerPlane(ev, plane) {
    const renderer = getRenderer();
    const camera = getCamera();
    const raycaster = getRaycaster();
    const pointer = getPointer();
    if (!renderer || !camera || !raycaster || !pointer || !plane) return null;
    getPointerNDC(ev);
    raycaster.setFromCamera(pointer, camera);
    const out = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, out) ? out : null;
  }

  function startDrag(id, handle, ev) {
    const it = markStore.get(id);
    if (!it) return;

    if (it.type === 'note') {
      dragState = { id, kind: 'note', endpoint: 'note', pointerId: ev.pointerId };
    } else if (it.type === 'measure') {
      dragState = { id, kind: 'measure', endpoint: handle === 'a' ? 'a' : 'b', pointerId: ev.pointerId };
    } else {
      return;
    }

    setControlsEnabled(false);
    const renderer = getRenderer();
    renderer?.domElement?.setPointerCapture?.(ev.pointerId);
    renderer?.domElement && (renderer.domElement.style.cursor = 'grabbing');
  }

  function startLabelDrag(id, ev) {
    const it = markStore.get(id);
    const camera = getCamera();
    if (!it || !camera) return;
    let labelPos = null;
    if (it.type === 'note') {
      const wp = bindToWorld(it.bind) || it.marker?.position?.clone();
      if (!wp) return;
      labelPos = it.label?.position?.clone() || wp.clone().add(resolveNoteLabelOffset(it));
    } else if (it.type === 'measure') {
      const a = bindToWorld(it.bindA);
      const b = bindToWorld(it.bindB);
      if (!a || !b) return;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const offset = Array.isArray(it.labelOffset) && it.labelOffset.length >= 3
        ? new THREE.Vector3(it.labelOffset[0], it.labelOffset[1], it.labelOffset[2])
        : new THREE.Vector3();
      labelPos = it.label?.position?.clone() || mid.clone().add(offset);
    } else {
      return;
    }
    const normal = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, labelPos);
    const hit = intersectPointerPlane(ev, plane);
    const grabOffset = hit ? labelPos.clone().sub(hit) : new THREE.Vector3();

    dragState = { id, kind: it.type === 'measure' ? 'measure-label' : 'note-label', pointerId: ev.pointerId, plane, grabOffset };
    setControlsEnabled(false);
    const renderer = getRenderer();
    renderer?.domElement?.setPointerCapture?.(ev.pointerId);
    renderer?.domElement && (renderer.domElement.style.cursor = 'grabbing');
  }

  function doDragUpdate(ev) {
    if (!dragState) return;
    const it = markStore.get(dragState.id);
    if (!it) return;

    if (dragState.kind === 'note-label' && it.type === 'note') {
      const wp = bindToWorld(it.bind) || it.marker?.position?.clone();
      if (!wp) return;
      const hit = intersectPointerPlane(ev, dragState.plane);
      if (!hit) return;
      const labelPos = hit.clone().add(dragState.grabOffset || new THREE.Vector3());
      it.labelOffset = labelPos.clone().sub(wp).toArray();
      updateBoundMarks();
      return;
    }
    if (dragState.kind === 'measure-label' && it.type === 'measure') {
      const a = bindToWorld(it.bindA);
      const b = bindToWorld(it.bindB);
      if (!a || !b) return;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const hit = intersectPointerPlane(ev, dragState.plane);
      if (!hit) return;
      const labelPos = hit.clone().add(dragState.grabOffset || new THREE.Vector3());
      it.labelOffset = labelPos.clone().sub(mid).toArray();
      updateBoundMarks();
      return;
    }

    const hit = intersectFirstMesh(ev);
    if (!hit) return;

    const mesh = hit.object;
    const p = hit.point.clone();

    const bind = makeBind(mesh, p);
    if (!bind) return;

    if (dragState.kind === 'note' && it.type === 'note') {
      it.bind = bind;
      it.code = getMeshCode(mesh);
      updateBoundMarks();
      return;
    }

    if (dragState.kind === 'measure' && it.type === 'measure') {
      if (dragState.endpoint === 'a') it.bindA = bind;
      else it.bindB = bind;
      updateBoundMarks();
    }
  }

  function handlePointerLeave() {
    if (dragState) {
      dragState = null;
      setControlsEnabled(true);
    }
    tip.show = false;
    leftDimsHoverKey = null;
    emit('hovered', null);
    const renderer = getRenderer();
    if (renderer?.domElement) renderer.domElement.style.cursor = 'default';
  }

  function handlePointerMove(ev) {
    if (!getRootGroup()) return;
    const renderer = getRenderer();

    if (dragState) {
      renderer?.domElement && (renderer.domElement.style.cursor = 'grabbing');
      tip.show = false;
      doDragUpdate(ev);
      return;
    }

    const baselineHit = hitLeftDimText(ev);
    if (baselineHit) {
      leftDimsHoverKey = baselineHit.key || null;
      renderer?.domElement && (renderer.domElement.style.cursor = 'pointer');
      tip.show = false;
      emit('hovered', null);
      return;
    } else if (leftDimsHoverKey) {
      leftDimsHoverKey = null;
    }

    const labelHit = hitLabelMarkIdByDomRect(ev);
    if (labelHit != null) {
      renderer?.domElement && (renderer.domElement.style.cursor = 'move');
      tip.show = false;
      emit('hovered', null);
      return;
    }

    const dh = intersectDragHandle(ev);
    if (renderer?.domElement && dh) renderer.domElement.style.cursor = 'pointer';

    const hit = intersectFirstMesh(ev);
    const mesh = hit?.object || null;

    if (renderer?.domElement && !dh) {
      const mode = props.toolMode;
      renderer.domElement.style.cursor =
        mode === 'measure'
          ? 'crosshair'
          : mode === 'note'
            ? 'cell'
            : mesh
              ? 'pointer'
              : 'default';
    }

    if (!mesh) {
      tip.show = false;
      emit('hovered', null);
      return;
    }

    const rootRect = hostRef.value.getBoundingClientRect();
    tip.x = ev.clientX - rootRect.left + 10;
    tip.y = ev.clientY - rootRect.top + 10;
    tip.show = true;

    const partTitle = getPartTitleForMesh ? getPartTitleForMesh(mesh) : '';
    const partName = getPartNameForMesh ? getPartNameForMesh(mesh) : '';
    const rawName = mesh.name || '';
    tip.title = partTitle || rawName || '—';
    tip.sub = partName || rawName || '—';

    const code = getMeshCode(mesh);
    emit('hovered', { code, name: mesh.name || '', uuid: mesh.uuid || '' });
  }

  function handlePointerDown(ev) {
    if (!getRootGroup()) return;

    const baselineHit = hitLeftDimText(ev);
    if (baselineHit) {
      openLeftDimEditor(baselineHit, ev);
      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();
      return;
    }

    const labelHit = hitLabelMarkIdByDomRect(ev);
    if (labelHit != null) {
      if (ev.detail && ev.detail >= 2) {
        openMarkEditorById(labelHit.id, ev, labelHit.axis);
        return;
      }
      startLabelDrag(labelHit.id, ev);
      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();
      return;
    }

    const dh = intersectDragHandle(ev);
    if (dh?.object?.userData?.__markId != null) {
      clearMeasurePending();
      const id = dh.object.userData.__markId;
      const handle = dh.object.userData.__dragHandle;
      startDrag(id, handle, ev);

      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();
      return;
    }

    if (ctx.editor?.show) cancelEdit();

    const hit = intersectFirstMesh(ev);
    if (!hit) return;

    const mesh = hit.object;
    const point = hit.point.clone();
    const code = getMeshCode(mesh);

    if (props.toolMode === 'pick') {
      setSelectedMesh(mesh);
      ctx.innerSelectedCode.value = code || ctx.innerSelectedCode.value;
      applyAll();
      emit('picked', { code, name: mesh?.name || '', uuid: mesh?.uuid || '' });
      return;
    }
    const dumpVisibility = (tag) => {
      const root = getRootGroup();
      const scene = typeof getScene === 'function' ? getScene() : null;
      let meshCount = 0;
      let visibleCount = 0;
      let sample = null;
      if (root) {
        root.traverse((o) => {
          if (!o?.isMesh || o.userData?.__mark) return;
          meshCount += 1;
          if (o.visible) visibleCount += 1;
          if (!sample) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            const m0 = mats[0];
            sample = {
              name: o.name || '',
              visible: o.visible,
              transparent: m0?.transparent,
              opacity: m0?.opacity,
            };
          }
        });
      }
      console.log('[ThreeModelViewer] measure/note click', {
        tag,
        toolMode: props.toolMode,
        hasRoot: !!root,
        rootChildren: root?.children?.length,
        inScene: scene ? scene.children?.includes?.(root) : undefined,
        meshCount,
        visibleCount,
        sample,
      });
    };

    if (props.toolMode === 'measure') {
      dumpVisibility('before-measure');
      showAllMeshes && showAllMeshes();
      highlightMeshOnly && highlightMeshOnly(mesh);
      const res = handleMeasureClick(point, mesh, code);
      dumpVisibility('after-measure');
      return res;
    }
    if (props.toolMode === 'note') {
      dumpVisibility('before-note');
      showAllMeshes && showAllMeshes();
      highlightMeshOnly && highlightMeshOnly(mesh);
      const res = handleNoteClick(point, mesh, code);
      dumpVisibility('after-note');
      return res;
    }
  }

  function handlePointerUp(ev) {
    if (!dragState) return;
    if (dragState.kind === 'note' || dragState.kind === 'note-label') emitNoteUpdatedById(dragState.id);
    if (dragState.kind === 'measure' || dragState.kind === 'measure-label') emitMeasureUpdatedById(dragState.id);
    try {
      const renderer = getRenderer();
      renderer?.domElement?.releasePointerCapture?.(dragState.pointerId);
    } catch (e) {}
    dragState = null;
    setControlsEnabled(true);
    const renderer = getRenderer();
    renderer?.domElement && (renderer.domElement.style.cursor = 'default');
  }

  function handleDoubleClick(ev) {
    const baselineHit = hitLeftDimText(ev);
    if (baselineHit) {
      openLeftDimEditor(baselineHit, ev);
      return;
    }
    const labelHit = hitLabelMarkIdByDomRect(ev);
    if (labelHit != null) {
      openMarkEditorById(labelHit.id, ev, labelHit.axis);
      return;
    }
    const hit = intersectFirstMesh(ev);
    const mesh = hit?.object || null;
    if (mesh) fitViewMesh(mesh);
    else fitView();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      clearMeasurePending();
      cancelEdit();
      dragState = null;
      setControlsEnabled(true);
      return;
    }
    if (e.key === 'f' || e.key === 'F') {
      fitView();
    }
  }

  return {
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    handleDoubleClick,
    handlePointerLeave,
    handleKeydown,
    resetInteractionState: () => {
      dragState = null;
      leftDimsHoverKey = null;
    },
  };
}
