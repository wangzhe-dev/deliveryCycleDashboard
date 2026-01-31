<template>
  <div class="viewer-stage" ref="stageRef">
    <div
      class="viewer-page"
      :style="{
        '--page-width': `${DESIGN_WIDTH}px`,
        '--page-height': `${DESIGN_HEIGHT}px`,
        '--page-scale': pageScale,
      }"
    >
      <!-- 顶部栏 -->
      <TopBar
        :title="title"
        :ship-options="shipOptions"
        :bom-list="bomList"
        :flow-options="flowOptions"
        :selected-ship="selectedShip"
        :selected-part="selectedPart"
        :selected-flow="selectedFlow"
        :can-save-marks="canSaveMarks"
        @update:selected-ship="selectedShip = $event"
        @update:selected-part="selectedPart = $event"
        @flow-toggle="toggleFlow"
        @save="saveMarksToAssembly"
      />

      <!-- 主体 -->
      <main
        class="main"
        :class="{
          'main--right-collapsed': rightCollapsed,
        }"
      >
        <!-- 左侧操作栏 -->
        <LeftBarV2
          :mode="mode"
          :explodeOn="explodeOn"
          :toolMode="toolMode"
          :colorIsolated="colorIsolated"
          @set-mode="handleSetMode"
          @set-tool="handleSetTool"
          @toggle-explode="toggleExplode"
          @toggle-param="toggleParam"
          @fit-view="fitView"
          @toggle-color-isolation="toggleColorIsolation"
          @clear-marks="handleClearAllMarks"
        />

        <!-- 左侧文件栏（保留） -->
        <!--
      <section class="left-panel" :class="{ 'left-panel--collapsed': leftCollapsed }">
        <div class="left-panel__body">
          <LeftPanel
            v-model="leftTab"
            :mode="mode"
            :explodeOn="explodeOn"
            :toolMode="toolMode"
            :colorIsolated="colorIsolated"
            :colorIsolatedOpacity="colorIsolatedOpacity"
            :colorIsolatedPartOpacity="colorIsolatedPartOpacity"
            :baseOpacity="baseOpacity"
            :partOpacity="partOpacity"
            :explodeFactor="explodeFactor"
            :notePointScale="notePointScale"
            :noteLabelOffset="noteLabelOffset"
            :noteLineWidth="noteLineWidth"
            :measurePointScale="measurePointScale"
            :measureLineWidth="measureLineWidth"
            :measureUnitScale="1000"
            :notePointColor="notePointColor"
            :noteLabelColor="noteLabelColor"
            :measurePointColor="measurePointColor"
            :measureLineColor="measureLineColor"
            :measureLabelColor="measureLabelColor"
            :showCenterMarks="showCenterMarks"
            :centerColor="centerColor"
            :centerAxisWidth="centerAxisWidth"
            :partPdfFiles="partPdfFiles"
            :excelList="excelList"
            @set-color-isolated-opacity="colorIsolatedOpacity = $event"
            @set-color-isolated-part-opacity="colorIsolatedPartOpacity = $event"
            @set-base-opacity="baseOpacity = $event"
            @set-part-opacity="partOpacity = $event"
            @set-explode-factor="explodeFactor = $event"
            @set-note-point-scale="notePointScale = $event"
            @set-note-label-offset="noteLabelOffset = $event"
            @set-note-line-width="noteLineWidth = $event"
            @set-measure-point-scale="measurePointScale = $event"
            @set-measure-line-width="measureLineWidth = $event"
            @set-note-point-color="notePointColor = $event"
            @set-note-label-color="noteLabelColor = $event"
            @set-measure-point-color="measurePointColor = $event"
            @set-measure-line-color="measureLineColor = $event"
            @set-measure-label-color="measureLabelColor = $event"
            @set-center-visible="showCenterMarks = $event"
            @set-center-color="centerColor = $event"
            @set-center-axis-width="centerAxisWidth = $event"
          />
        </div>
      </section>
      -->

        <!-- 中间：模型 -->
        <section class="center">
          <div class="center__canvas">
            <ThreeModelViewer
              ref="viewerRef"
              :modelUrl="modelUrl"
              :mode="mode"
              :explode="explodeOn"
              :toolMode="toolMode"
              :selectedCode="selectedNodeCode"
              :explodeFactor="explodeFactor"
              :activeGroupFilter="activeGroupFilter"
              :colorIsolated="colorIsolated"
              :colorIsolatedOpacity="activeColorIsolatedOpacity"
              :baseOpacity="activeBaseOpacity"
              :notePointScale="notePointScale"
              :noteLabelOffset="noteLabelOffset"
              :noteLineWidth="noteLineWidth"
              :measurePointScale="measurePointScale"
              :measureLineWidth="measureLineWidth"
              :notePointColor="notePointColor"
              :noteLabelColor="noteLabelColor"
              :measurePointColor="measurePointColor"
              :measureLineColor="measureLineColor"
              :measureLabelColor="measureLabelColor"
              :showCenterMarks="showCenterMarks"
              :centerColor="centerColor"
              :centerAxisWidth="centerAxisWidth"
              :knownCodes="knownCodes"
              v-model:showMeshLabels="showMeshLabels"
              :meshLabelColor="meshLabelColor"
              :meshLabelSize="meshLabelSize"
              :meshLabelMap="meshLabelMap"
              :showLeftDims="!isPartModel || !!activeGroupFilter"
              :showLeftBaseline="!!activeGroupFilter"
              :partNameMapList="mockData"
              v-model:markFilter="markFilter"
              @picked="handleModelPicked"
              @note-added="onNoteAdded"
              @note-updated="onNoteUpdated"
              @measure="onMeasure"
              @measure-updated="onMeasureUpdated"
              @model-loaded="handleModelLoaded"
            />
            <button class="center__right-toggle" type="button" @click="toggleRightCollapsed">
              <span>{{ rightCollapsed ? '>>' : '<<' }}</span>
            </button>
            <!-- 左侧文件栏隐藏时，先不显示左侧折叠按钮 -->
            <!--
          <button class="center__left-toggle" type="button" @click="leftCollapsed = !leftCollapsed">
            <span>{{ leftCollapsed ? '<<' : '>>' }}</span>
          </button>
          --></div>
        </section>

        <RightPanelV2
          :right-collapsed="rightCollapsed"
          :right-tree-left="rightTreeLeft"
          :right-tree-right="rightTreeRight"
          :selected-left-code="selectedLeftCode"
          :selected-leaf-code="selectedLeafCode"
          :selected-node="rightInfoNode"
          :hud-tab="hudTab"
          :measure-list="measureList"
          :note-list="noteList"
          :fmt="fmt"
          :fmt-text="fmtText"
          :get-measure-display-text="getMeasureDisplayText"
          :get-delta-val="getDeltaVal"
          :show-detail-panels="!isPartModel || !!activeGroupFilter"
          :on-toggle-collapse="toggleRightCollapsed"
          :on-left-node-click="onLeftNodeClick"
          :on-right-node-click="onRightNodeClick"
          :on-hud-tab-change="setHudTab"
          :on-measure-text-change="handleMeasureTextChange"
          :on-measure-point-delta-change="handleMeasurePointDeltaChange"
          :on-locate-measure="locateMeasure"
          :on-remove-measure="removeMeasure"
          :on-note-text-change="handleNoteTextChange"
          :on-note-delta-change="handleNoteDeltaChange"
          :on-locate-note="locateNote"
          :on-remove-note="removeNote"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { showError, showSuccess } from '@/utils/utils';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LeftBarV2 from './components/LeftBarV2.vue';
import { M101P } from './components/M101P.js';
import { M102P } from './components/M102P.js';
import { M315P } from './components/M315P.js';
import RightPanelV2 from './components/RightPanelV2.vue';
import ThreeModelViewer from './components/ThreeModelViewer.vue';
import TopBar from './components/TopBar.vue';
import { fetchMaster3dByCode, updateMaster3dJson } from './services.js';

const title = ref('三维作业指导书');
const searchText = ref('');
const leftTab = ref('PART');

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const pageScale = ref(1);
const stageRef = ref(null);
const updatePageScale = () => {
  const el = stageRef.value;
  const w = el ? el.clientWidth : window.innerWidth || DESIGN_WIDTH;
  const h = el ? el.clientHeight : window.innerHeight || DESIGN_HEIGHT;
  const scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT, 1);
  pageScale.value = Number.isFinite(scale) ? scale : 1;
};

/** 当前分段 */
const selectedPart = ref('M315P');
/** 船号 */
const selectedShip = ref('W0287');
const shipOptions = ref(['W0287']);
/** 流向 */
const selectedFlow = ref('T1');
const flowOptions = ref(['T1', 'C1', 'S1', 'N1']);
const mockData = computed(() => {
  const code = String(selectedPart.value || '').trim();
  if (code.includes('M101P')) return M101P;
  if (code.includes('M315P')) return M315P;
  return M102P;
});

const partNameTree = computed(() => {
  const groupMap = new Map();
  const flow = selectedFlow.value;
  (mockData.value || []).forEach((it) => {
    if (flow && String(it?.flowCode1 || '').trim() !== flow) return;
    const name = typeof it?.joint_part_partname === 'string' ? it.joint_part_partname.trim() : '';
    if (!name) return;
    const idx = name.lastIndexOf('-');
    const key = idx > 0 ? name.slice(0, idx) : name;
    if (!groupMap.has(key)) groupMap.set(key, new Set());
    groupMap.get(key).add(name);
  });
  return Array.from(groupMap.entries()).map(([groupName, set]) => ({
    groupName,
    children: Array.from(set).map((name) => ({ name, materials_code: name })),
  }));
});

function handleFlowQuery() {}

function toggleFlow(flow) {
  selectedFlow.value = selectedFlow.value === flow ? '' : flow;
  selectedLeftCode.value = '';
  selectedLeafCode.value = '';
  activeGroupFilter.value = '';
  refreshLeftTreeForPart();
  refreshRightTreeForLeft();
}

/** 左树选中的组立 code */
const selectedLeftCode = ref('');
/** info 面板选中的节点 code */
const selectedNodeCode = ref(selectedPart.value);
/** 右侧零件列选中 */
const selectedLeafCode = ref('');

/** three 组件 ref */
const viewerRef = ref(null);

/** 爆炸系数（可调） */
const explodeFactor = ref(0.18);
const notePointScale = ref(0.1);
const noteLabelOffset = ref(1);
const noteLineWidth = ref(0.5);
const measurePointScale = ref(0.1);
const measureLineWidth = ref(0.5);
const showCenterMarks = ref(false);
const centerColor = ref('#ef4444');
const centerAxisWidth = ref(0.5);
const notePointColor = ref('#ef4444');
const noteLabelColor = ref('#ef4444');
const measurePointColor = ref('#111111');
const measureLineColor = ref('#111111');
const measureLabelColor = ref('#111111');
const markFilter = ref('all'); // all | dim | note
const meshLabelColor = ref('#111827');
const meshLabelSize = ref(12);
const rightCollapsed = ref(false);
const leftCollapsed = ref(false);

watch([rightCollapsed, leftCollapsed], async () => {
  await nextTick();
  viewerRef.value?.resizeViewer?.();
});

/** 左侧工具栏状态 */
const mode = ref('normal'); // normal | wire
const toolMode = ref('pick'); // pick | measure | note
const colorIsolated = ref(true);
// 颜色隔离模式下的面透明度（组立）
const colorIsolatedOpacity = ref(1);
// 颜色隔离模式下的面透明度（分段）
const colorIsolatedPartOpacity = ref(1);
// 组立模型的默认面透明度
const baseOpacity = ref(1);
// 分段模型的默认面透明度
const partOpacity = ref(1);
const explodeOn = ref(false);

/** 右下 Tabs */
const hudTab = ref('MEASURE'); // MEASURE | NOTE

/** 列表（用于右下展示 + 编辑） */
const noteList = ref([]); // [{ id, seq, code, position, text, labelOffset }]
const measureList = ref([]); // [{ id, seq, distance, a,b, aCode,bCode, text }]
const canSaveMarks = computed(
  () => !!selectedLeftCode.value || getLevelUnderSelectedPart(selectedNodeCode.value) === '组立',
);

const fmt = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(2) : '-');
const fmtText = (v) => (v == null || v === '' ? '-' : String(v));
const normalizeDelta = (v) => {
  const arr = Array.isArray(v) ? v.slice(0, 3) : [];
  while (arr.length < 3) arr.push(0);
  return arr.map((n) => (typeof n === 'number' && !Number.isNaN(n) ? n : 0));
};
const getDeltaVal = (v, idx) => {
  const arr = normalizeDelta(v);
  return arr[idx] ?? 0;
};
const fmtNum = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(2) : '-');
const fmtVec3 = (v) => {
  const [x, y, z] = normalizeDelta(v);
  return `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
};
const getMeasureDisplayText = (m) => {
  const txt = String(m?.text ?? '').trim();
  if (txt) return txt;
  return fmtNum(m?.distance);
};
const toggleRightCollapsed = () => {
  rightCollapsed.value = !rightCollapsed.value;
};
const setHudTab = (tab) => {
  hudTab.value = tab;
};
const handleMeasureTextChange = (id, v) => {
  updateMeasureField(id, { text: v === '' ? '' : v });
};
const handleMeasurePointDeltaChange = (id, pointKey, axis, v) => {
  updateMeasurePointDeltaAxis(id, pointKey, axis, v);
};
const handleNoteTextChange = (id, v) => {
  updateNoteField(id, { text: v });
};
const handleNoteDeltaChange = (id, axis, v) => {
  updateNoteDeltaAxis(id, axis, v);
};

/** ---------------- BOM 数据（原样） ---------------- */
const bomList = ref([
  {
    materials_code: 'M101P',
    type: 'block',
    weight: 2388.44,
    part_length: 10151,
    part_width: 1100,
    thickness: 40,
    pdfUrl: [
      {
        url: 'http://10.147.128.102:2001/ProductDesignFiles/2026/1/0d7c7937-5998-44b4-8f1e-14b45c1a4ac2.pdf',
        name: 'W0287-M101P分段组立图.pdf',
      },
      {
        url: 'http://10.147.128.102:2001/ProductDesignFiles/2026/1/81fea22d-6b42-4014-a426-4120c96d9df2.pdf',
        name: 'W0287-M101P小组立图.pdf',
      },
    ],
  },
  {
    materials_code: 'M102P',
    type: 'block',
    weight: 2388.44,
    part_length: 10151,
    part_width: 1100,
    thickness: 40,
    pdfUrl: [
      {
        url: 'http://10.147.128.102:2001/ProductDesignFiles/2026/1/a555cbaa-7050-4c28-9904-aa7418aa7feb.pdf',
        name: 'W0287-M102P分段组立图.pdf',
      },
      {
        url: 'http://10.147.128.102:2001/ProductDesignFiles/2026/1/097acdc4-7f14-4075-b2cb-a1b527bca733.pdf',
        name: 'W0287-M102P小组立图.pdf',
      },
    ],
  },
  {
    materials_code: 'M315P',
    type: 'block',
    weight: 2388.44,
    part_length: 10151,
    part_width: 1100,
    thickness: 40,
    pdfUrl: [
      {
        url: 'http://10.147.128.102:2001/ProductDesignFiles/2026/1/c93e3a25-bd6d-49e7-8f02-35d8e00ecccb.pdf',
        name: 'W0287-M315P分段组立图.pdf',
      },
      {
        url: 'http://10.147.128.102:2001/ProductDesignFiles/2026/1/c93e3a25-bd6d-49e7-8f02-35d8e00ecccb.pdf',
        name: 'W0287-M315P小组立图.pdf',
      },
    ],
  },
]);

/** ✅ mock 焊缝/拼接/焊接类型（用于假数据展示） */
let mockWeldIdx = 0;
function applyMockWeldFields(list) {
  (list || []).forEach((item) => {
    mockWeldIdx += 1;
    const baseLen = typeof item.part_length === 'number' ? item.part_length : 0;
    const baseW = typeof item.part_width === 'number' ? item.part_width : 0;
    if (item.weld_length_total == null)
      item.weld_length_total = Math.round(baseLen * 0.08 + baseW * 0.12);
    if (item.splice_length_total == null)
      item.splice_length_total = Math.round(baseLen * 0.05 + baseW * 0.06);
    if (!item.weld_type) item.weld_type = mockWeldIdx % 2 === 0 ? '直角焊' : '角焊';
    if (item.children?.length) applyMockWeldFields(item.children);
  });
}
applyMockWeldFields(bomList.value);

/** 递归查找节点 */
function findNodeByCode(list, code) {
  if (!list || !code) return null;
  for (const item of list) {
    if (item.materials_code === code) return item;
    const hit = findNodeByCode(item.children, code);
    if (hit) return hit;
  }
  return null;
}

/** 找到分段根节点 */
function getPartRoot() {
  return findNodeByCode(bomList.value, selectedPart.value);
}

/** 找某节点父节点 code */
function findParentCode(root, targetCode) {
  if (!root || !targetCode) return '';
  const stack = [{ node: root, parent: null }];
  while (stack.length) {
    const { node, parent } = stack.pop();
    if (node.materials_code === targetCode) return parent ? parent.materials_code : '';
    (node.children || []).forEach((c) => stack.push({ node: c, parent: node }));
  }
  return '';
}

/** 判断层级 */
function getLevelUnderSelectedPart(code) {
  const root = getPartRoot();
  if (!root) return '分段';
  if (code === root.materials_code) return '分段';
  if ((root.children || []).some((c) => c.materials_code === code)) return '组立';
  return findNodeByCode(root.children, code) ? '零件' : '分段';
}

/** info 面板 */
const selectedNode = ref(null);
const selectedLevelText = ref('分段');

function refreshSelectedInfo() {
  selectedNode.value =
    findNodeByCode(bomList.value, selectedNodeCode.value) ||
    findNodeByCode(bomList.value, selectedPart.value) ||
    null;

  selectedLevelText.value = selectedNode.value
    ? getLevelUnderSelectedPart(selectedNode.value.materials_code)
    : '分段';
}

const rightInfoNode = computed(() => {
  if (selectedLeafCode.value) {
    const code = String(selectedLeafCode.value || '').trim();
    const list = mockData.value || [];
    const hit =
      list.find((it) => String(it?.joint_part_partname || '').trim() === code) ||
      list.find((it) => String(it?.materials_code || '').trim() === code) ||
      list.find((it) =>
        String(it?.materials_code || '')
          .trim()
          .endsWith(`-${code}`),
      );
    return hit || findNodeByCode(bomList.value, selectedLeafCode.value) || null;
  }
  if (selectedLeftCode.value) {
    const list = mockData.value || [];
    const groupKey = String(selectedLeftCode.value || '').trim();
    const seen = new Set();
    const sum = list.reduce((acc, it) => {
      const name = String(it?.joint_part_partname || '').trim();
      if (!name) return acc;
      const idx = name.lastIndexOf('-');
      const key = idx > 0 ? name.slice(0, idx) : name;
      if (key !== groupKey) return acc;
      const uniqKey =
        String(it?.joint_part_partname_tb || '').trim() ||
        String(it?.joint_part_partname || '').trim() ||
        String(it?.materials_code || '').trim();
      if (uniqKey && seen.has(uniqKey)) return acc;
      if (uniqKey) seen.add(uniqKey);
      const w = typeof it?.weight === 'number' && !Number.isNaN(it.weight) ? it.weight : 0;
      return acc + w;
    }, 0);
    return {
      materials_code: selectedLeftCode.value,
      weight: sum || 0,
      part_length: null,
      part_width: null,
      thickness: null,
    };
  }
  return selectedNode.value;
});

/** 右侧树数据 */
const rightTreeLeft = ref([]);
const rightTreeRight = ref([]);
const activeGroupFilter = ref('');
const pendingGroupFocus = ref('');

function focusGroupView(code) {
  if (!code) return;
  nextTick(() => {
    requestAnimationFrame(() => {
      viewerRef.value?.showOnlyGroup?.(code);
      viewerRef.value?.fitView?.();
    });
  });
}

function refreshLeftTreeForPart() {
  rightTreeLeft.value = partNameTree.value || [];

  const stillValid = !!rightTreeLeft.value.find((x) => x.groupName === selectedLeftCode.value);
  if (!stillValid) selectedLeftCode.value = '';
}

function refreshRightTreeForLeft() {
  const leftNode = rightTreeLeft.value.find((x) => x.groupName === selectedLeftCode.value);
  const list = leftNode?.children ?? [];
  const seen = new Set();
  rightTreeRight.value = list.filter((it) => {
    const key = String(it?.materials_code || it?.name || '');
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 左树点击：组立 */
function onLeftNodeClick(code) {
  selectedLeftCode.value = code;
  selectedLeafCode.value = '';
  refreshRightTreeForLeft();
  const prevModelUrl = modelUrl.value;
  const modelNode =
    findNodeByCode(bomList.value, code) ||
    findNodeByCode(bomList.value, selectedPart.value) ||
    null;
  // console.log('[3D] 组立点击-模型数据', modelNode);
  activeGroupFilter.value = code;
  viewerRef.value?.dumpMeshAndGroupByCode?.(code);

  const hasNode = !!findNodeByCode(bomList.value, code);
  if (hasNode) {
    selectedNodeCode.value = code;
    refreshSelectedInfo();
    setModelUrlToAssembly(code);
    viewerRef.value?.selectByCode?.(code);
  }

  loadMarksForAssembly(code);

  if (modelUrl.value !== prevModelUrl) pendingGroupFocus.value = code;
  focusGroupView(code);
}

/** 右树点击：零件 */
function onRightNodeClick(code) {
  selectedLeafCode.value = code;
  const hasNode = !!findNodeByCode(bomList.value, code);
  if (hasNode) {
    selectedNodeCode.value = code;
    refreshSelectedInfo();
    viewerRef.value?.selectByCode?.(code);
  }
}

/** 左侧工具栏联动 */
function handleSetMode(m) {
  mode.value = m;
}
function handleSetTool(t) {
  const next = toolMode.value === t ? 'pick' : t;
  toolMode.value = next;
}
function toggleExplode() {
  explodeOn.value = !explodeOn.value;
}
function toggleParam() {
  console.log('toggle-param');
}

/** 清除（仍可通过左侧工具栏触发；右下不再放清除按钮） */
function handleClearAllMarks() {
  viewerRef.value?.clearMarks?.();
  noteList.value = [];
  measureList.value = [];
}

/** 顶部搜索 */
function doSearch() {
  console.log('search:', searchText.value);
}

function getSelectedAssemblyCode() {
  if (selectedLeftCode.value) return selectedLeftCode.value;
  if (getLevelUnderSelectedPart(selectedNodeCode.value) === '组立') return selectedNodeCode.value;
  return '';
}

function getMaterialsCodeWithShip(code) {
  const ship = String(selectedShip.value || '').trim();
  const c = String(code || '').trim();
  if (!ship) return c;
  if (!c) return '';
  if (c.startsWith(`${ship}-`)) return c;
  return `${ship}-${c}`;
}

function buildMarksPayload() {
  const notes = noteList.value.map((n) => ({
    id: n.id,
    seq: n.seq,
    text: n.text,
    code: n.code,
    position: n.position,
    bboxDelta: n.bboxDelta,
    labelOffset: n.labelOffset || null,
  }));
  const measures = measureList.value.map((m) => {
    const wp = viewerRef.value?.getMeasureWorldPoints?.(m.id);
    return {
      id: m.id,
      seq: m.seq,
      text: m.text,
      distance: m.distance,
      a: wp?.a || m.a,
      b: wp?.b || m.b,
      aDelta: m.aDelta,
      bDelta: m.bDelta,
      centerWorld: m.centerWorld,
      labelOffset: m.labelOffset || null,
    };
  });
  return { notes, measures, savedAt: new Date().toISOString() };
}

let syncTimer = null;
function scheduleMarksSync() {
  const code = getSelectedAssemblyCode();
  if (!code) return;
  const payload = buildMarksPayload();
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    updateMaster3dJson(code, JSON.stringify(payload)).catch((err) => {
      console.warn('updateJson failed:', err);
    });
  }, 300);
}

function extractPayloadFromResponse(res) {
  if (!res) return null;
  const raw = res?.data?.json ?? res?.json ?? null;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  if (raw && typeof raw === 'object') return raw;
  if (res?.data && typeof res.data === 'object' && (res.data.notes || res.data.measures))
    return res.data;
  return null;
}

async function saveMarksToAssembly() {
  const code = getSelectedAssemblyCode();
  if (!code) {
    console.warn('saveMarksToAssembly: no assembly selected');
    return;
  }

  const payload = buildMarksPayload();
  try {
    const res = await updateMaster3dJson(getMaterialsCodeWithShip(code), JSON.stringify(payload));
    const ok = res?.success === true || res?.code === 200 || res?.data === true;
    if (ok) showSuccess('保存成功');
    else showError(res?.msg || '保存失败');
  } catch (e) {
    console.warn('saveMarksToAssembly: updateJson failed', e);
    showError('保存失败');
  }

  const node = findNodeByCode(bomList.value, code);
  if (node) node.saved_marks = payload;
  console.log('saved marks to assembly:', code, payload);
  console.log('[marks payload]', payload);
}

async function loadMarksForAssembly(code) {
  viewerRef.value?.clearMarks?.();
  noteList.value = [];
  measureList.value = [];

  let payload = null;
  try {
    const res = await fetchMaster3dByCode(getMaterialsCodeWithShip(code));
    payload = extractPayloadFromResponse(res);
  } catch (e) {
    console.warn('loadMarksForAssembly: fetch failed', e);
    payload = null;
  }

  if (!payload) return;
  if (!payload) return;

  const notes = Array.isArray(payload.notes) ? payload.notes : [];
  const measures = Array.isArray(payload.measures) ? payload.measures : [];

  const loadedNotes = [];
  notes.forEach((n) => {
    const id = viewerRef.value?.addNoteFromData?.(n);
    if (id == null) return;
    loadedNotes.push({
      id,
      seq: typeof n?.seq === 'number' ? n.seq : loadedNotes.length + 1,
      code: n?.code || '',
      position: n?.position || null,
      bboxDelta: n?.bboxDelta || null,
      text: typeof n?.text === 'string' ? n.text : '',
      labelOffset: n?.labelOffset || null,
    });
  });

  const loadedMeasures = [];
  measures.forEach((m) => {
    const id = viewerRef.value?.addMeasureFromData?.(m);
    if (id == null) return;
    loadedMeasures.push({
      id,
      seq: typeof m?.seq === 'number' ? m.seq : loadedMeasures.length + 1,
      distance: m?.distance,
      a: m?.a || null,
      b: m?.b || null,
      aDelta: m?.aDelta || null,
      bDelta: m?.bDelta || null,
      centerWorld: m?.centerWorld || null,
      labelOffset: m?.labelOffset || null,
      text: typeof m?.text === 'string' ? m.text : '',
    });
  });

  noteList.value = loadedNotes;
  measureList.value = loadedMeasures;
}

/** prev/next */
function goPrevPart() {
  const idx = bomList.value.findIndex((x) => x.materials_code === selectedPart.value);
  const nextIdx = Math.max(0, idx - 1);
  selectedPart.value = bomList.value[nextIdx]?.materials_code || selectedPart.value;
}
function goNextPart() {
  const idx = bomList.value.findIndex((x) => x.materials_code === selectedPart.value);
  const nextIdx = Math.min(bomList.value.length - 1, idx + 1);
  selectedPart.value = bomList.value[nextIdx]?.materials_code || selectedPart.value;
}

/** 模型 URL */
const modelUrl = ref('');
const getPartModelUrl = () =>
  selectedPart.value ? `/models/${selectedShip.value}/${selectedPart.value}.gltf` : '';
const normalizeChildModelUrl = (url) => {
  if (!url) return '';
  if (import.meta.env.DEV) return url;
  if (url.startsWith('/cp/')) return url;
  return url.startsWith('/') ? `/cp${url}` : `/cp/${url}`;
};
const setModelUrlToPart = () => {
  modelUrl.value = getPartModelUrl();
};
const setModelUrlToAssembly = (code) => {
  const node = findNodeByCode(bomList.value, code);
  modelUrl.value = normalizeChildModelUrl(node?.modelUrl) || getPartModelUrl();
};

const isPartModel = computed(() => modelUrl.value === getPartModelUrl());
const showMeshLabels = ref(false);
watch(isPartModel, (v) => {
  if (v) showMeshLabels.value = false;
});
const meshLabelMap = computed(() => {
  const map = {};
  const root = selectedNode.value || findNodeByCode(bomList.value, selectedPart.value);
  const walk = (node) => {
    if (!node) return;
    const key = typeof node.jointPartNameTB === 'string' ? node.jointPartNameTB.trim() : '';
    if (key) {
      map[String(key)] = node.name ? String(node.name) : '';
    }
    if (Array.isArray(node.children)) node.children.forEach((child) => walk(child));
  };
  walk(root);
  return map;
});
const activeBaseOpacity = computed(() =>
  isPartModel.value ? partOpacity.value : baseOpacity.value,
);
const activeColorIsolatedOpacity = computed(() =>
  isPartModel.value ? colorIsolatedPartOpacity.value : colorIsolatedOpacity.value,
);

const partPdfFiles = computed(() => {
  const node = findNodeByCode(bomList.value, selectedPart.value);
  return Array.isArray(node?.pdfUrl) ? node.pdfUrl : [];
});
const excelList = computed(() => {
  const node = findNodeByCode(bomList.value, selectedPart.value);
  return Array.isArray(node?.excelList) ? node.excelList : [];
});

/** 给 Three 用的 code 列表 */
function collectCodes(root) {
  const res = [];
  const stack = root ? [root] : [];
  while (stack.length) {
    const n = stack.pop();
    if (n?.materials_code) res.push(String(n.materials_code));
    (n.children || []).forEach((c) => stack.push(c));
  }
  return res;
}
const knownCodes = computed(() => collectCodes(getPartRoot()));

/** Three 拾取回传 -> 同步右侧树 */
function handleModelPicked(payload) {
  const code = payload?.code || payload?.name || '';
  if (!code) return;

  const hit = findNodeByCode(bomList.value, code);
  if (!hit) return;

  selectedNodeCode.value = code;
  refreshSelectedInfo();

  const root = getPartRoot();
  const level = getLevelUnderSelectedPart(code);

  if (level === '分段') {
    selectedLeafCode.value = '';
    return;
  }
  if (level === '组立') {
    selectedLeftCode.value = code;
    selectedLeafCode.value = '';
    refreshRightTreeForLeft();
    return;
  }
  const parentCode = findParentCode(root, code);
  if (parentCode) {
    selectedLeftCode.value = parentCode;
    refreshRightTreeForLeft();
  }
  selectedLeafCode.value = code;
}

function handleModelLoaded() {
  if (colorIsolated.value) viewerRef.value?.randomizeMeshColors?.();
  viewerRef.value?.dumpMeshGroups?.();
  const code = pendingGroupFocus.value || activeGroupFilter.value;
  if (code) {
    focusGroupView(code);
    pendingGroupFocus.value = '';
  }
}

/** ✅ HUD 输入：显式更新列表项 + 同步 Three（解决“不能改”） */
function updateNoteField(id, patch) {
  const idx = noteList.value.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const cur = noteList.value[idx];
  const next = { ...cur, ...patch };
  noteList.value.splice(idx, 1, next);

  viewerRef.value?.updateNoteMeta?.(id, {
    seq: next.seq,
    text: next.text,
  });
  scheduleMarksSync();
}

function updateMeasureField(id, patch) {
  const idx = measureList.value.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const cur = measureList.value[idx];
  const next = { ...cur, ...patch };
  measureList.value.splice(idx, 1, next);

  const text = typeof next.text === 'string' ? next.text : '';
  viewerRef.value?.updateMeasureMeta?.(id, {
    seq: next.seq,
    text, // 空 => 自动距离
  });
}

function updateNoteDeltaAxis(id, axisIdx, value) {
  const idx = noteList.value.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const cur = noteList.value[idx];
  const nextDelta = normalizeDelta(cur.bboxDelta);
  nextDelta[axisIdx] = typeof value === 'number' ? value : 0;
  const next = { ...cur, bboxDelta: nextDelta };
  noteList.value.splice(idx, 1, next);
  viewerRef.value?.updateNotePositionByDelta?.(id, nextDelta);
  scheduleMarksSync();
}

function updateMeasurePointDeltaAxis(id, pointKey, axisIdx, value) {
  const idx = measureList.value.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const cur = measureList.value[idx];
  const src = pointKey === 'a' ? cur.aDelta : cur.bDelta;
  const nextDelta = normalizeDelta(src);
  nextDelta[axisIdx] = typeof value === 'number' ? value : 0;
  const next = { ...cur };
  if (pointKey === 'a') next.aDelta = nextDelta;
  else next.bDelta = nextDelta;
  measureList.value.splice(idx, 1, next);
  viewerRef.value?.updateMeasurePointByDelta?.(id, pointKey, nextDelta);
}

/** ✅ 定位：要求放大（Three 内部做 fitBox） */
function locateNote(n) {
  viewerRef.value?.focusNote?.(n.id);
}
function locateMeasure(m) {
  viewerRef.value?.focusMeasure?.(m.id);
}

function removeNote(id) {
  noteList.value = noteList.value.filter((x) => x.id !== id);
  viewerRef.value?.removeMarkById?.(id);
  scheduleMarksSync();
}
function removeMeasure(id) {
  measureList.value = measureList.value.filter((x) => x.id !== id);
  viewerRef.value?.removeMarkById?.(id);
}

/** Three 回传：标注/测量 -> 进列表 */
function onNoteAdded(e) {
  const item = {
    id: e?.id, // ✅ 必须用 Three 的 id
    seq: e?.seq ?? noteList.value.length + 1,
    code: e?.code || '',
    position: e?.position || null,
    bboxDelta: e?.bboxDelta || null,
    text: typeof e?.text === 'string' ? e.text : '',
    labelOffset: e?.labelOffset || null,
  };
  if (item.id == null) return;

  hudTab.value = 'NOTE';

  const idx = noteList.value.findIndex((x) => x.id === item.id);
  if (idx >= 0) noteList.value[idx] = { ...noteList.value[idx], ...item };
  else noteList.value.unshift(item);
  scheduleMarksSync();
}

function onNoteUpdated(e) {
  if (e?.id == null) return;
  const idx = noteList.value.findIndex((x) => x.id === e.id);
  if (idx < 0) return;
  const next = { ...noteList.value[idx], ...e };
  noteList.value.splice(idx, 1, next);
  scheduleMarksSync();
}

function onMeasure(e) {
  const item = {
    id: e?.id, // ✅ 必须用 Three 的 id
    seq: e?.seq ?? measureList.value.length + 1,
    distance: e?.distance,
    a: e?.a || null,
    b: e?.b || null,
    bboxDelta: e?.bboxDelta || null,
    aDelta: e?.aDelta || null,
    bDelta: e?.bDelta || null,
    aCode: e?.aCode || '',
    bCode: e?.bCode || '',
    labelOffset: e?.labelOffset || null,
    text: typeof e?.text === 'string' ? e.text : '',
    centerWorld: viewerRef.value?.getMeasureBaseCenterWorld?.() || null,
  };
  if (item.id == null) return;

  hudTab.value = 'MEASURE';

  const idx = measureList.value.findIndex((x) => x.id === item.id);
  if (idx >= 0) measureList.value[idx] = { ...measureList.value[idx], ...item };
  else measureList.value.unshift(item);
}

function onMeasureUpdated(e) {
  if (e?.id == null) return;
  const idx = measureList.value.findIndex((x) => x.id === e.id);
  if (idx < 0) return;
  const next = { ...measureList.value[idx], ...e };
  measureList.value.splice(idx, 1, next);
}

/** OrientWidget -> 相机视角 */
function onAxisClick(a) {
  if (!a?.key) return;
  if (a.key === 'up') viewerRef.value?.setView?.('top');
  if (a.key === 'fore') viewerRef.value?.setView?.('front');
  if (a.key === 'port') viewerRef.value?.setView?.('left');
}
function onCubeClick() {
  viewerRef.value?.setView?.('iso');
}

/** 适配 */
function fitView() {
  viewerRef.value?.fitView?.();
}

function toggleColorIsolation() {
  colorIsolated.value = !colorIsolated.value;
  if (colorIsolated.value) viewerRef.value?.randomizeMeshColors?.();
  else viewerRef.value?.resetMeshColors?.();
}

watch(
  () => activeColorIsolatedOpacity.value,
  () => {
    if (colorIsolated.value) viewerRef.value?.randomizeMeshColors?.();
  },
);

watch(
  () => activeBaseOpacity.value,
  () => {
    if (!colorIsolated.value) viewerRef.value?.resetMeshColors?.();
  },
);

/** watch：切换分段 */
watch(
  () => selectedPart.value,
  () => {
    selectedNodeCode.value = selectedPart.value;
    selectedLeafCode.value = '';
    activeGroupFilter.value = '';
    refreshLeftTreeForPart();
    refreshRightTreeForLeft();
    refreshSelectedInfo();
    setModelUrlToPart();
    fitView();

    // 切分段：清空测量/标注列表（更符合分段隔离）
    noteList.value = [];
    measureList.value = [];
    viewerRef.value?.clearMarks?.();
    viewerRef.value?.showAllMeshes?.();
  },
  { immediate: true },
);

watch(
  () => selectedLeftCode.value,
  (code) => {
    if (!code) {
      selectedLeafCode.value = '';
      rightTreeRight.value = [];
      viewerRef.value?.clearMarks?.();
      activeGroupFilter.value = '';
      viewerRef.value?.showAllMeshes?.();
      noteList.value = [];
      measureList.value = [];
      return;
    }
    refreshRightTreeForLeft();
    if (getLevelUnderSelectedPart(selectedNodeCode.value) === '组立') refreshSelectedInfo();
  },
);

/** 时间（保留） */
const timeText = ref('11:12');
let timer = null;
const pad2 = (n) => String(n).padStart(2, '0');
const tick = () => {
  const d = new Date();
  timeText.value = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
onMounted(() => {
  tick();
  timer = window.setInterval(tick, 30_000);
});
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});

let _stageRo = null;
onMounted(() => {
  updatePageScale();
  window.addEventListener('resize', updatePageScale);
  if (stageRef.value) {
    _stageRo = new ResizeObserver(updatePageScale);
    _stageRo.observe(stageRef.value);
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageScale);
  if (_stageRo) {
    _stageRo.disconnect();
    _stageRo = null;
  }
});
</script>

<style scoped>
.viewer-stage {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.viewer-page {
  height: var(--page-height);
  width: var(--page-width);
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  grid-template-rows: 70px 1fr;
  overflow: hidden;
  padding: 5px;
  transform: translate(-50%, -50%) scale(var(--page-scale));
  transform-origin: center;
}

.icon-btn {
  height: 28px;
  min-width: 28px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.icon-btn:active {
  transform: translateY(1px);
}

/* 主体：4列 */
.main {
  position: relative;
  display: grid;
  grid-template-columns: 100px 1fr 340px;
  gap: 5px;
  padding: 10px;
  overflow: hidden;
  transition: grid-template-columns 0.28s ease;
  --left-shell-bg:
    linear-gradient(
      160deg,
      rgba(100, 116, 139, 0.12) 0%,
      rgba(148, 163, 184, 0.1) 35%,
      rgba(203, 213, 225, 0.1) 70%
    ),
    linear-gradient(180deg, #f6f2eb 0%, #eee7df 100%);
  background: linear-gradient(180deg, #e6e7e5 0%, #dcddda 55%, #d1d2cf 100%);
  border: 1px solid rgba(15, 23, 42, 0.18);
  border-top: 0;
  border-radius: 0 0 22px 22px;
  box-shadow:
    0 22px 60px rgba(6, 18, 38, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.main::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1000px 360px at 18% 0%, rgba(14, 116, 144, 0.18), transparent 55%),
    radial-gradient(900px 300px at 88% 5%, rgba(30, 64, 175, 0.16), transparent 60%);
  opacity: 0.8;
  pointer-events: none;
  z-index: 0;
}
.main::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(12, 24, 52, 0.04),
      rgba(12, 24, 52, 0.04) 1px,
      transparent 1px,
      transparent 140px
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0));
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}
.main > * {
  position: relative;
  z-index: 1;
}
.main--right-collapsed {
  grid-template-columns: 100px 1fr 0px;
}

/* 中间 */
.center {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background:
    radial-gradient(120% 120% at 12% 8%, rgba(14, 116, 144, 0.22), transparent 42%),
    radial-gradient(120% 120% at 88% 0%, rgba(30, 64, 175, 0.18), transparent 46%),
    linear-gradient(180deg, rgba(24, 29, 36, 0.9), rgba(12, 16, 20, 0.95));
  box-shadow:
    0 16px 36px rgba(3, 7, 18, 0.35),
    inset 0 0 46px rgba(15, 23, 42, 0.35);
}
.center__canvas {
  flex: 1;
  min-height: 0;
  position: relative;
  background:
    radial-gradient(120% 120% at 18% 10%, rgba(14, 116, 144, 0.18), transparent 48%),
    linear-gradient(180deg, rgba(22, 27, 34, 0.65), rgba(10, 13, 18, 0.75));
  overflow: hidden;
}
.center__canvas::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.08), transparent 35%),
    repeating-linear-gradient(
      0deg,
      rgba(148, 163, 184, 0.08) 0,
      rgba(148, 163, 184, 0.08) 1px,
      transparent 1px,
      transparent 120px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(148, 163, 184, 0.06) 0,
      rgba(148, 163, 184, 0.06) 1px,
      transparent 1px,
      transparent 120px
    );
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}
.center__canvas::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(70% 70% at 50% 50%, transparent 0%, rgba(2, 6, 23, 0.6) 100%);
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
}
.center__canvas > * {
  position: relative;
  z-index: 1;
}
.center__right-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  height: 32px;
  width: 32px;
  border-radius: 8px 0 0 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.9));
  color: #0f172a;
  font-weight: 800;
  cursor: pointer;
  z-index: 3;
  box-shadow:
    0 6px 14px rgba(15, 23, 42, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.center__right-toggle:active {
  transform: translateY(calc(-50% + 1px));
}
.center__left-toggle {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 32px;
  width: 32px;
  border-radius: 0 8px 8px 0;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.9));
  color: #0f172a;
  font-weight: 800;
  cursor: pointer;
  z-index: 3;
  box-shadow:
    0 6px 14px rgba(15, 23, 42, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.center__left-toggle:active {
  transform: translateY(calc(-50% + 1px));
}

/* 左侧面板 */
.left-panel {
  position: relative;
  height: 100%;
  min-height: 0;
  margin-left: -5px; /* 贴近 LeftBarV2，消掉列间距 */
  transition: all 0.28s ease;
}
.left-panel__body {
  height: 100%;
}
.left-panel--collapsed .left-panel__body {
  opacity: 0;
  pointer-events: none;
}
</style>
