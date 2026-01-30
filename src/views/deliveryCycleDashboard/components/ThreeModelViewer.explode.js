import * as THREE from 'three';

export function createExplodeSelection(ctx) {
  const {
    props,
    modelMetrics,
    meshState,
    meshByUuid,
    selectedUuids,
    innerSelectedCode,
    sortedKnownCodes,
    getRootGroup,
    getBaseOpacity,
    getColorIsolatedOpacity,
    BASE_TINT,
    HIGHLIGHT_SELECTED,
    updateBoundMarks,
    updateMeshLabels,
    markLeftDimsDirty,
    updateModelMetricsForView,
  } = ctx;

  let explodeDumped = false;

  let cachedPartNameList = null;
  let cachedPartNameMap = new Map();
  function getPartNameMap() {
    const list = props.partNameMapList || [];
    if (list === cachedPartNameList) return cachedPartNameMap;
    cachedPartNameList = list;
    cachedPartNameMap = new Map();
    list.forEach((it) => {
      const key = typeof it?.joint_part_partname_tb === 'string' ? it.joint_part_partname_tb.trim() : '';
      const val = typeof it?.joint_part_partname === 'string' ? it.joint_part_partname.trim() : '';
      if (key) cachedPartNameMap.set(key, val);
    });
    return cachedPartNameMap;
  }

  function getPartGroupKey(partName) {
    const s = String(partName || '').trim();
    if (!s) return '';
    const first = s.indexOf('-');
    if (first < 0) return s;
    const second = s.indexOf('-', first + 1);
    if (second < 0) return s;
    return s.slice(0, second);
  }

  function resolvePartNameForMesh(mesh) {
    const rootGroup = getRootGroup();
    const map = getPartNameMap();
    if (!mesh || !map.size) return '';
    let p = mesh;
    while (p && p !== rootGroup) {
      if (p.type === 'Group') {
        const groupName = typeof p?.name === 'string' ? p.name.trim() : '';
        if (groupName && map.has(groupName)) return map.get(groupName) || '';
      }
      p = p.parent;
    }
    p = mesh;
    while (p && p !== rootGroup) {
      const name = typeof p?.name === 'string' ? p.name.trim() : '';
      if (name && map.has(name)) return map.get(name) || '';
      p = p.parent;
    }
    return '';
  }

  function resolveCodeFromName(name = '') {
    const n = String(name || '');
    if (!n || !sortedKnownCodes.value.length) return '';
    for (const code of sortedKnownCodes.value) {
      if (n.includes(code)) return code;
    }
    return '';
  }

  function getMeshCode(mesh) {
    if (!mesh) return '';
    const ud = mesh.userData || {};

    if (ud.code) return String(ud.code);
    if (ud.originalName) return String(ud.originalName);
    if (ud.__resolvedCode) return String(ud.__resolvedCode);

    const byName = resolveCodeFromName(mesh?.name || '');
    if (byName) {
      ud.__resolvedCode = byName;
      return byName;
    }

    let p = mesh.parent;
    while (p) {
      if (p.userData?.code) return String(p.userData.code);
      if (p.name) return String(p.name);
      p = p.parent;
    }

    return String(mesh?.name || mesh?.uuid || '');
  }

  function readMatSnapshot(mat) {
    const m = mat;
    return {
      wireframe: typeof m?.wireframe === 'boolean' ? m.wireframe : undefined,
      emissive: m?.emissive ? m.emissive.clone() : null,
      emissiveIntensity: typeof m?.emissiveIntensity === 'number' ? m.emissiveIntensity : undefined,
      color: m?.color ? m.color.clone() : null,
      transparent: typeof m?.transparent === 'boolean' ? m.transparent : undefined,
      opacity: typeof m?.opacity === 'number' ? m.opacity : undefined,
    };
  }

  function cacheMeshState(obj) {
    if (!obj || !obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    meshState.set(obj.uuid, {
      position: obj.position.clone(),
      visible: obj.visible,
      mats: mats.map((m) => readMatSnapshot(m)),
      centerWorld: new THREE.Vector3(),
    });
    meshByUuid.set(obj.uuid, obj);
  }

  function restoreAll() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      const st = meshState.get(obj.uuid);
      if (!st) return;

      obj.visible = true;
      obj.position.copy(st.position);

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m, idx) => {
        const s = st.mats[idx];
        if (!s || !m) return;
        if (typeof s.wireframe === 'boolean') m.wireframe = s.wireframe;
        if (s.emissive && m.emissive) m.emissive.copy(s.emissive);
        if (typeof s.emissiveIntensity === 'number' && typeof m.emissiveIntensity === 'number') {
          m.emissiveIntensity = s.emissiveIntensity;
        }
        if (s.color && m.color) m.color.copy(s.color);
        if (typeof s.transparent === 'boolean') m.transparent = s.transparent;
        if (typeof s.opacity === 'number') m.opacity = s.opacity;
        m.needsUpdate = true;
      });
    });
  }

  function applyHighlight(mesh, hex) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      if (!m) return;
      if (props.colorIsolated) {
        return;
      } else {
        if (m.emissive) {
          m.emissive.setHex(hex);
          if (typeof m.emissiveIntensity === 'number' && m.emissiveIntensity < 1) m.emissiveIntensity = 1;
        }
        if (m.color) m.color.setHex(hex);
      }
      m.needsUpdate = true;
    });
  }

  function restoreMeshMaterials(mesh) {
    if (!mesh || !mesh.isMesh) return;
    const st = meshState.get(mesh.uuid);
    if (!st) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m, idx) => {
      const s = st.mats[idx];
      if (!s || !m) return;
      if (typeof s.wireframe === 'boolean') m.wireframe = s.wireframe;
      if (s.emissive && m.emissive) m.emissive.copy(s.emissive);
      if (typeof s.emissiveIntensity === 'number' && typeof m.emissiveIntensity === 'number') {
        m.emissiveIntensity = s.emissiveIntensity;
      }
      if (s.color && m.color) m.color.copy(s.color);
      if (typeof s.transparent === 'boolean') m.transparent = s.transparent;
      if (typeof s.opacity === 'number') m.opacity = s.opacity;
      m.needsUpdate = true;
    });
  }

  let lastHighlightUuid = '';
  const highlightedUuids = new Set();

  function restoreMeshAppearance(mesh) {
    if (!mesh || !mesh.isMesh) return;
    const st = meshState.get(mesh.uuid);
    if (!st) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m, idx) => {
      const s = st.mats[idx];
      if (!s || !m) return;
      if (s.emissive && m.emissive) m.emissive.copy(s.emissive);
      if (typeof s.emissiveIntensity === 'number' && typeof m.emissiveIntensity === 'number') {
        m.emissiveIntensity = s.emissiveIntensity;
      }
      if (s.color && m.color) m.color.copy(s.color);
      m.needsUpdate = true;
    });
  }

  function clearHighlights() {
    if (!highlightedUuids.size) return;
    highlightedUuids.forEach((uuid) => {
      const mesh = meshByUuid.get(uuid);
      if (mesh) restoreMeshAppearance(mesh);
    });
    highlightedUuids.clear();
  }
  function highlightMeshOnly(mesh) {
    if (!mesh || !mesh.isMesh) return;
    if (lastHighlightUuid && lastHighlightUuid !== mesh.uuid) {
      const prev = meshByUuid.get(lastHighlightUuid);
      if (prev) restoreMeshAppearance(prev);
    }
    applyHighlight(mesh, HIGHLIGHT_SELECTED);
    lastHighlightUuid = mesh.uuid;
  }

  function showAllMeshes() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData?.__mark) return;
      obj.visible = true;
    });
  }

  function getGroupKeyByLastDash(partName) {
    const s = String(partName || '').trim();
    if (!s) return '';
    const idx = s.lastIndexOf('-');
    return idx > 0 ? s.slice(0, idx) : s;
  }

  function showOnlyGroup(groupName) {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;
    const target = String(groupName || '').trim();
    if (!target) {
      showAllMeshes();
      return;
    }
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData?.__mark) return;
      const partName = resolvePartNameForMesh(obj);
      const key = getGroupKeyByLastDash(partName);
      obj.visible = key === target;
    });
  }

  function getShowOnlyGroupKey(mesh) {
    const partName = resolvePartNameForMesh(mesh);
    return getGroupKeyByLastDash(partName);
  }


  function getExplodeGroupKey(mesh) {
    const rootGroup = getRootGroup();
    if (!mesh) return '';

    const partName = resolvePartNameForMesh(mesh);
    if (partName) {
      const key = props.activeGroupFilter ? partName : getPartGroupKey(partName);
      return `partName:${key}`;
    } else if ((props.partNameMapList || []).length) {
      return `noMatch:${mesh.uuid}`;
    }

    const normalizeSeg = (seg) => {
      if (!seg) return seg;
      const s = String(seg).trim();
      let m = s.match(/^([A-Za-z]+\d+[A-Za-z]?)([A-Za-z]\d+.*)$/);
      if (m) return m[1];
      m = s.match(/^([A-Za-z]+\d+[A-Za-z]?)[A-Za-z]+\d.*$/);
      if (m) return m[1];
      if (s.includes('_')) return s.split('_')[0];
      return s;
    };
    const getPrefixFromName = (raw) => {
      if (!raw) return '';
      const base = String(raw).split('/')[0].trim();
      if (!base) return '';
      const parts = base.split('-').filter(Boolean);
      if (parts.length < 2) return '';
      const a = parts[0];
      const b = normalizeSeg(parts[1]);
      return a && b ? `${a}-${b}` : '';
    };

    let p = mesh;
    while (p && p !== rootGroup) {
      const udName = typeof p.userData?.name === 'string' ? p.userData.name.trim() : '';
      const udPrefix = getPrefixFromName(udName);
      if (udPrefix) return `udNamePrefix:${udPrefix}`;
      if (p.userData?.groupName) return `groupName:${String(p.userData.groupName)}`;
      if (p !== mesh && p.type === 'Group') return `group:${p.uuid}`;
      p = p.parent;
    }
    const name = mesh.name || '';
    const namePrefix = getPrefixFromName(name);
    if (namePrefix) return `namePrefix:${namePrefix}`;
    const code = getMeshCode(mesh) || '';
    const codePrefix = getPrefixFromName(code);
    if (codePrefix) return `codePrefix:${codePrefix}`;
    if (mesh.parent) return `parent:${mesh.parent.uuid}`;
    return `mesh:${mesh.uuid}`;
  }

  function dumpExplodeGroups() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;
    const groupMap = new Map();

    rootGroup.traverse((obj) => {
      if (!obj?.isMesh) return;
      const key = getExplodeGroupKey(obj) || 'unknown';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push({
        name: obj.name || '',
        uuid: obj.uuid || '',
        userDataName: obj.userData?.name || '',
      });
    });

    console.log('[ThreeModelViewer] Explode Groups');
    for (const [key, list] of groupMap.entries()) {
      console.log(`${key} (${list.length})`);
    }
  }

  function applyMode() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;

    if (props.mode === 'wire') {
      rootGroup.traverse((obj) => {
        if (!obj.isMesh) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m && typeof m.wireframe === 'boolean') {
            m.wireframe = true;
            m.needsUpdate = true;
          }
        });
      });
    } else {
      rootGroup.traverse((obj) => {
        if (!obj.isMesh) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m && typeof m.wireframe === 'boolean') {
            m.wireframe = false;
            m.needsUpdate = true;
          }
        });
      });
    }

    if (props.explode) {
      if (!modelMetrics.ready) return;

      const factor = Number.isFinite(+props.explodeFactor) ? +props.explodeFactor : 0.18;
      const distWorld = Math.max(0, modelMetrics.base) * factor;

      const groupCenters = new Map();
      rootGroup.traverse((obj) => {
        if (!obj.isMesh) return;
        const st = meshState.get(obj.uuid);
        if (!st) return;
        const key = getExplodeGroupKey(obj);
        let entry = groupCenters.get(key);
        if (!entry) {
          entry = { sum: new THREE.Vector3(), count: 0, center: new THREE.Vector3() };
          groupCenters.set(key, entry);
        }
        entry.sum.add(st.centerWorld);
        entry.count += 1;
      });
      groupCenters.forEach((v) => {
        if (v.count > 0) v.center.copy(v.sum.clone().multiplyScalar(1 / v.count));
      });

      const inv = new THREE.Matrix4();
      const scale = new THREE.Vector3();
      const dirWorld = new THREE.Vector3();
      const dirLocal = new THREE.Vector3();

      rootGroup.traverse((obj) => {
        if (!obj.isMesh) return;
        const st = meshState.get(obj.uuid);
        if (!st) return;

        const key = getExplodeGroupKey(obj);
        const group = groupCenters.get(key);
        const baseCenter = group?.center || st.centerWorld;
        dirWorld.copy(baseCenter).sub(modelMetrics.centerWorld);
        if (dirWorld.lengthSq() < 1e-12) {
          obj.getWorldPosition(dirWorld);
          dirWorld.sub(modelMetrics.centerWorld);
        }
        if (dirWorld.lengthSq() < 1e-12) {
          dirWorld.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        }
        dirWorld.normalize();

        dirLocal.copy(dirWorld);
        const parent = obj.parent;
        let localDist = distWorld;

        if (parent) {
          parent.getWorldScale(scale);
          const avgScale = Math.max(1e-6, (scale.x + scale.y + scale.z) / 3);
          localDist = distWorld / avgScale;

          inv.copy(parent.matrixWorld).invert();
          dirLocal.transformDirection(inv);
        }

        obj.position.copy(st.position.clone().add(dirLocal.multiplyScalar(localDist)));
      });
    }
  }

  function findMeshesByCode(code) {
    const rootGroup = getRootGroup();
    if (!rootGroup || !code) return [];
    const hits = [];
    const c0 = String(code);

    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData?.__mark) return;

      const c = String(getMeshCode(obj) || '');
      const n = String(obj.name || '');

      if (c === c0 || n === c0) {
        hits.push(obj);
        return;
      }
      if (c0.length >= 6 && (c.includes(c0) || n.includes(c0))) hits.push(obj);
    });

    return hits;
  }

  function applySelection() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;

    clearHighlights();
    if (selectedUuids.size) {
      selectedUuids.forEach((uuid) => {
        const m = meshByUuid.get(uuid);
        if (m && m.isMesh && m.visible && !m.userData?.__mark) {
          applyHighlight(m, HIGHLIGHT_SELECTED);
          highlightedUuids.add(uuid);
        }
      });
      return;
    }

    const code = props.selectedCode || innerSelectedCode.value;
    if (!code) return;

    const hits = findMeshesByCode(code);
    hits.forEach((m) => {
      applyHighlight(m, HIGHLIGHT_SELECTED);
      highlightedUuids.add(m.uuid);
    });
  }

  function applyAll() {
    const rootGroup = getRootGroup();
    restoreAll();
    if (!rootGroup) return;
    if (props.activeGroupFilter) showOnlyGroup(props.activeGroupFilter);
    rootGroup.updateMatrixWorld(true);
    if (typeof updateModelMetricsForView === 'function') updateModelMetricsForView();
    applyMode();
    if (props.colorIsolated) randomizeMeshColors();
    rootGroup && rootGroup.updateMatrixWorld(true);
    applySelection();

    rootGroup && rootGroup.updateMatrixWorld(true);

    updateBoundMarks();
    updateMeshLabels();
    markLeftDimsDirty();
  }

  function applySelectionOnly() {
    applySelection();
    updateBoundMarks();
    updateMeshLabels();
    markLeftDimsDirty();
  }

  function tintMeshToBaseBlue(mesh) {
    const baseOpacity = getBaseOpacity();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      if (!m || !m.color) return;

      m.color.setHex(BASE_TINT);
      if (m.emissive) m.emissive.setHex(0x000000);
      if (typeof m.emissiveIntensity === 'number') m.emissiveIntensity = Math.min(m.emissiveIntensity, 0.0);

      if (typeof m.metalness === 'number') m.metalness = Math.min(m.metalness, 0.1);
      if (typeof m.roughness === 'number') m.roughness = Math.max(m.roughness, 0.65);

      if (baseOpacity < 1) {
        m.transparent = true;
        m.opacity = baseOpacity;
      } else {
        m.transparent = false;
        m.opacity = 1;
      }
      m.needsUpdate = true;
    });
  }

  function hashStringToColor(str, strong = false) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i += 1) {
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }

    if (strong) {
      const HUES = [0, 60, 120, 180, 240, 300];
      const idx = hash % HUES.length;
      const hue = HUES[idx];
      const sat = 1;
      const light = (hash >>> 5) % 2 === 0 ? 0.48 : 0.64;
      const color = new THREE.Color();
      color.setHSL(hue / 360, sat, light);
      return color.getHex();
    }

    const PINK_START = 290;
    const PINK_END = 340;
    const PINK_WIDTH = PINK_END - PINK_START;
    const ALLOWED = 360 - PINK_WIDTH;

    let hue = (hash * 137.508) % ALLOWED;
    if (hue >= PINK_START) hue += PINK_WIDTH;

    const color = new THREE.Color();
    color.setHSL(hue / 360, 1, 0.6);
    return color.getHex();
  }

  function randomizeMeshColors() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;
    const opacity = getColorIsolatedOpacity();
    const colorMap = new Map();
    const strong = !!props.activeGroupFilter;
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData?.__mark) return;

      const groupKey = getExplodeGroupKey(obj) || obj.uuid;
      if (!colorMap.has(groupKey)) {
        colorMap.set(groupKey, hashStringToColor(groupKey, strong));
      }
      const color = colorMap.get(groupKey);
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!m || !m.color) return;
        m.color.setHex(color);
        if (opacity < 1) {
          m.transparent = true;
          m.opacity = opacity;
        } else {
          m.transparent = false;
          m.opacity = 1;
        }
        m.needsUpdate = true;
      });

      const st = meshState.get(obj.uuid);
      if (st?.mats?.length) {
        st.mats.forEach((m) => {
          if (m?.color) m.color.setHex(color);
        });
      }
    });
  }

  function resetMeshColors() {
    const rootGroup = getRootGroup();
    if (!rootGroup) return;
    const baseOpacity = getBaseOpacity();
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.userData?.__mark) return;

      tintMeshToBaseBlue(obj);
      const st = meshState.get(obj.uuid);
      if (st) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (!m) return;
          if (baseOpacity < 1) {
            m.transparent = true;
            m.opacity = baseOpacity;
          } else {
            m.transparent = false;
            m.opacity = 1;
          }
          m.needsUpdate = true;
        });
        if (st.mats?.length) {
          st.mats.forEach((m) => {
            if (m?.color) m.color.setHex(BASE_TINT);
          });
        }
      }
    });
  }

  return {
    getMeshCode,
    cacheMeshState,
    restoreAll,
    highlightMeshOnly,
    showAllMeshes,
    showOnlyGroup,
    applyAll,
    applyMode,
    applySelection,
    randomizeMeshColors,
    resetMeshColors,
    tintMeshToBaseBlue,
    getExplodeGroupKey,
    getShowOnlyGroupKey,
    dumpExplodeGroups,
  };
}
