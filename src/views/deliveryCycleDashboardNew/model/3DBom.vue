<template>
  <div class="viewer-app" :data-collapsed="sidebarCollapsed ? '1' : '0'" :data-param="paramOpen ? '1' : '0'">
    <!-- ===== 顶部栏 ===== -->
    <div class="topbar">
      <!-- 视图模式（仅：原始 / 透明框线） -->
      <div class="group">
        <div class="label">视图</div>
        <div class="seg">
          <button class="seg-btn" :class="{ active: mode === 'normal' }" @click="setMode('normal')">
            <svg-icon icon-class="3D-ys" />
            原始
          </button>
          <button class="seg-btn" :class="{ active: mode === 'wire' }" @click="setMode('wire')">
            <svg-icon icon-class="3D-ts" />
            透明框线
          </button>
        </div>
      </div>

      <!-- 工具模式（爆炸图按钮放在“尺寸”后面） -->
      <div class="group">
        <div class="label">工具</div>
        <div class="seg">
          <button class="seg-btn" :class="{ active: toolMode === 'pick' }" @click="setTool('pick')">
            <svg-icon icon-class="3D-xq" />
            选取
          </button>
          <button class="seg-btn" :class="{ active: toolMode === 'measure' }" @click="setTool('measure')">
            <svg-icon icon-class="3D-jl" />
            标距
          </button>
          <button class="seg-btn" :class="{ active: toolMode === 'note' }" @click="setTool('note')">
            <svg-icon icon-class="3D-dbz" />
            标点
          </button>
          <button class="seg-btn" :class="{ active: toolMode === 'dim' }" @click="setTool('dim')">
            <svg-icon icon-class="3D-cc" />
            尺寸
          </button>

          <!-- ✅ 爆炸图按钮：放在尺寸后面；保持“透明框线”风格联动 -->
          <button class="seg-btn" :class="{ active: mode === 'explode' }" @click="toggleExplode">
            <svg-icon icon-class="3D-bz" />
            爆炸图
          </button>
        </div>
      </div>

      <button class="btn primary" @click="toggleParam">
        <svg-icon icon-class="3D-cs" />
        参数
      </button>

      <button class="btn danger" @click="clearMarksAndResetModel">
        <svg-icon icon-class="3D-qk" />
        清空标记并还原
      </button>
    </div>

    <!-- ===== 主区 ===== -->
    <div class="main">
      <!-- ===== 视窗 ===== -->
      <div class="viewer">
        <div ref="container" class="viewer-root"></div>

        <div class="dock">
          <button class="dock-btn" :class="{ active: isolateSelected }" @click="toggleIsolate">
            👁️ {{ isolateSelected ? '显示全部' : '显示选中' }}
          </button>
          <button class="dock-btn" @click="fitView">🧭 自适应</button>
        </div>

        <!-- 参数浮层 -->
        <div class="param">
          <div class="param-card">
            <div class="param-head">
              <div class="param-title">
                参数面板
                <span class="pill">{{ mode === 'explode' ? '爆炸' : toolModeText }}</span>
              </div>
              <button class="btn" @click="toggleParam">收起</button>
            </div>

            <div class="param-grid">
              <div v-if="mode === 'explode'" class="row">
                <label>
                  爆炸系数
                  <span>0~300</span>
                </label>
                <input type="range" min="0" max="300" step="0.01" v-model.number="explodeFactor" />
                <input type="number" min="0" max="300" step="0.01" v-model.number="explodeFactor" />
              </div>

              <div class="row">
                <label>
                  点大小
                  <span>世界单位</span>
                </label>
                <input type="range" min="0.002" max="0.03" step="0.001" v-model.number="MARK_CFG.markerRadius" />
                <input type="number" min="0.0001" max="0.03" step="0.0001" v-model.number="MARK_CFG.markerRadius" />
              </div>

              <div class="row">
                <label>
                  文案距离
                  <span>世界单位</span>
                </label>
                <input type="range" min="0.004" max="0.12" step="0.002" v-model.number="MARK_CFG.labelLiftWorld" />
                <input type="number" min="0.004" max="0.12" step="0.002" v-model.number="MARK_CFG.labelLiftWorld" />
              </div>

              <div class="row">
                <label>
                  线宽
                  <span>px</span>
                </label>
                <input type="range" min="1" max="10" step="1" v-model.number="MARK_CFG.lineWidthPx" />
                <input type="number" min="1" max="10" step="1" v-model.number="MARK_CFG.lineWidthPx" />
              </div>

              <div class="row">
                <label>
                  尺寸线距模型
                  <span>世界单位</span>
                </label>
                <input type="range" min="0.002" max="0.2" step="0.001" v-model.number="MARK_CFG.dimOffsetWorld" />
                <input type="number" min="0.002" max="0.2" step="0.001" v-model.number="MARK_CFG.dimOffsetWorld" />
              </div>
            </div>

            <div class="param-foot">
              <button class="btn danger" @click="resetAllToOriginal">清空标记并还原</button>
            </div>

            <div class="param-tip" v-if="toolMode === 'measure'">
              标距：点两下 → 实时显示两点距离；可拖拽两端点微调；ESC 取消草稿
            </div>
            <div class="param-tip" v-else-if="toolMode === 'note'">
              标点：点一下 → 输入文字；可拖拽圆点移动；点击标点修改
            </div>
            <div class="param-tip" v-else-if="toolMode === 'dim'">
              尺寸：点一个零件 → 仅显示该零件长/宽/高；点击尺寸 label 修改
            </div>
          </div>
        </div>

        <div class="hud">
          <span class="kbd">左键</span>
          <div class="hud-text">{{ hudText }}</div>
        </div>
      </div>

      <!-- ===== 侧栏 ===== -->
      <aside class="sidebar mb10">
        <div class="group row-between mb10">
          <div class="label fw fs14">零件信息({{ filteredPartList.length }})</div>
          <div class="seg">
            <button class="seg-btn" :class="{ active: sideTab === 'parts' }" @click="sideTab = 'parts'">
              <svg-icon icon-class="3D-lj" />
              零件
            </button>
            <button class="seg-btn" :class="{ active: sideTab === 'anno' }" @click="sideTab = 'anno'">
              <svg-icon icon-class="3D-dbz" />
              标点
            </button>
            <button class="seg-btn" :class="{ active: sideTab === 'detail' }" @click="sideTab = 'detail'">
              <svg-icon icon-class="3D-xqt" />
              详情
            </button>
          </div>
        </div>

        <div class="sidebar-body">
          <!-- Tab：零件 -->
          <div v-show="sideTab === 'parts'">
            <div class="parts">
              <div
                v-for="item in filteredPartList"
                :key="item.key"
                class="part"
                :class="{
                  active:
                    item.key === selectedKey ||
                    item.partName === selectedKey ||
                    item.jointPartNameTB === selectedKey,
                }"
                @click="selectFromList(item)"
              >
                <div class="part-top">
                  <div class="part-no fs14">
                    <svg-icon icon-class="3D-lj" class="fs20 mr5" />
                    {{ item.partName }}
                  </div>
                  <div class="part-w">{{ Number(item.partWeight || 0).toFixed(1) }} kg</div>
                </div>
                <div class="part-btm">
                  <div class="tags">
                    <span class="chip">{{ item.material || '-' }}</span>
                    <span class="chip">{{ item.processFlow || '-' }}</span>
                  </div>
                  <div class="dimstr">
                    {{ item.partLength }}mm × {{ item.partWidth }}mm × {{ item.thickness }}mm
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab：标点 -->
          <div v-show="sideTab === 'anno'">
            <div class="section-title">
              <span>标点（{{ notes.length }}）</span>
              <span class="muted">点击可定位/编辑；拖拽圆点移动</span>
            </div>

            <div v-if="notes.length === 0" class="empty2">暂无标点</div>
            <div v-for="(n, idx) in notes" :key="n.id" class="mrow">
              <div class="mleft">
                <div class="idx">#{{ idx + 1 }}</div>
                <div class="val">{{ n.text }}</div>
              </div>
              <div class="ops">
                <button class="iconbtn primary" @click="focusMark(n.world)">
                  <svg-icon icon-class="3D-dbz" />
                  定位
                </button>
                <button class="iconbtn" @click="editNote(n.id)">
                  <svg-icon icon-class="3D-xg" />
                  修改
                </button>
                <button class="iconbtn danger" @click="removeNote(n.id)">
                  <svg-icon icon-class="3D-qk" />
                  删除
                </button>
              </div>
            </div>
          </div>

          <!-- Tab：尺寸/详情 -->
          <div v-show="sideTab === 'detail'">
            <div class="section-title">
              <span>选中信息</span>
              <span class="muted">{{ selectedInfo ? '已加载' : '未选择' }}</span>
            </div>

            <div v-if="selectedInfo" class="detail-card">
              <div class="detail-head">
                <div class="k">
                  <div class="name">{{ selectedInfo.name || '-' }}</div>
                  <div class="meta" v-if="selectedBiz">
                    <span class="chip">材质 {{ selectedBiz.material || '-' }}</span>
                    <span class="chip">流向 {{ selectedBiz.processFlow || '-' }}</span>
                    <span class="chip">重量 {{ selectedBiz.partWeight || '-' }} kg</span>
                  </div>
                </div>
              </div>

              <div class="kv3" v-if="selectedBiz">
                <div class="kv-item">
                  <div class="t">长×宽×高（mm）</div>
                  <div class="v mono">
                    {{ selectedBiz.partLength }} × {{ selectedBiz.partWidth }} × {{ selectedBiz.thickness }}
                  </div>
                </div>
                <div class="kv-item">
                  <div class="t">套料文件</div>
                  <div class="v mono">{{ selectedBiz.nestingFileName || '-' }}</div>
                </div>
                <div class="kv-item">
                  <div class="t">TB名</div>
                  <div class="v mono">{{ selectedBiz.jointPartNameTB || '-' }}</div>
                </div>
              </div>

              <div class="sep"></div>

              <div class="grid2">
                <div class="box">
                  <div class="k">焊缝长度（合计）</div>
                  <div class="v mono">{{ selectedInfo.weldLength ?? '-' }}</div>
                </div>
                <div class="box">
                  <div class="k">拼接长度（合计）</div>
                  <div class="v mono">{{ selectedInfo.jointLength ?? '-' }}</div>
                </div>
              </div>

              <div class="box" style="margin-top: 10px">
                <div class="k">焊接类型</div>
                <div class="v">{{ selectedInfo.weldTypeText ?? '-' }}</div>
              </div>

              <div class="sep"></div>

              <div class="section-title">
                <span>标距（{{ measures.length }}）</span>
                <span class="muted">可定位/删除；端点可拖拽；点击 label 修改</span>
              </div>
              <div v-if="measures.length === 0" class="empty2">暂无</div>
              <div v-for="(m, idx) in measures" :key="m.id" class="mrow">
                <div class="mleft">
                  <div class="val">{{ m.displayText }}</div>
                </div>
                <div class="ops">
                  <button class="iconbtn primary" @click="focusMark(m.midWorld)">
                    <svg-icon icon-class="3D-dbz" />
                    定位
                  </button>
                  <button class="iconbtn danger" @click="removeMeasure(m.id)">
                    <svg-icon icon-class="3D-qk" />
                    删除
                  </button>
                </div>
              </div>

              <div class="section-title" style="margin-top: 12px">
                <span>尺寸（{{ dims.length }}）</span>
                <span class="muted">仅显示当前零件；点击 label 修改</span>
              </div>
              <div v-if="dims.length === 0" class="empty2">暂无</div>
              <div v-for="(d, idx) in dimsVisibleList" :key="d.id" class="mrow">
                <div class="mleft">
                  <div class="val">{{ d.displayText }}</div>
                </div>
                <div class="ops">
                  <button class="iconbtn primary" @click="focusMark(d.midWorld)">
                    <svg-icon icon-class="3D-dbz" />
                    定位
                  </button>
                  <button class="iconbtn" @click="editDim(d.id)">
                    <svg-icon icon-class="3D-xg" />
                    修改
                  </button>
                  <button class="iconbtn danger" @click="removeDim(d.id)">
                    <svg-icon icon-class="3D-qk" />
                    删除
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="empty">点击左侧模型或右侧列表选择零件</div>
          </div>
        </div>
      </aside>
    </div>

    <!-- ✅ 输入弹窗 -->
    <div v-if="inputDlg.visible" class="dlg-mask" @mousedown.self="cancelInput">
      <div class="dlg">
        <div class="dlg-hd">
          <div class="dlg-title">{{ inputDlg.title }}</div>
          <button class="dlg-x" @click="cancelInput">✕</button>
        </div>

        <div class="dlg-bd">
          <input
            class="dlg-input"
            v-model="inputDlg.value"
            :placeholder="inputDlg.placeholder"
            @keydown.enter.prevent="confirmInput"
            autofocus
          />
          <div class="dlg-hint" v-if="inputDlg.hint">{{ inputDlg.hint }}</div>
          <div v-if="inputDlg.subHint" class="dlg-subhint">{{ inputDlg.subHint }}</div>
        </div>

        <div class="dlg-ft">
          <button class="dlg-btn ghost" @click="cancelInput">取消</button>
          <button class="dlg-btn" @click="confirmInput">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed, reactive } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const emit = defineEmits(['pick']);

/** ✅ 示例数据（保持你原结构，不删除） */
const RAW_ROWS = [
  {
    serialNumber: '43',
    nestingFileName: 'D710P_AH36100_CNF01',
    thickness: '10',
    width: '2300',
    length: '10200',
    material: 'AH36',
    steelWeight: '1841.61',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '1',
    partName: 'D710P-BM147A-K3',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'K3',
    partLength: '8639',
    partWidth: '580',
    partWeight: '373.6',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-2P',
    type: 100,
    jointLength: 580,
    weldLength: 1160,
  },
  {
    serialNumber: '43',
    nestingFileName: 'D710P_AH36100_CNF01',
    thickness: '10',
    width: '2300',
    length: '10200',
    material: 'AH36',
    steelWeight: '1841.61',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '1',
    partName: 'D710P-BM147A-K3',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'K3',
    partLength: '8639',
    partWidth: '580',
    partWeight: '373.6',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-2P',
    type: 200,
    jointLength: 8611,
    weldLength: 17222,
  },
  {
    serialNumber: '56',
    nestingFileName: 'D710P_AH36170_CNF01',
    thickness: '17',
    width: '1800',
    length: '6000',
    material: 'AH36',
    steelWeight: '1441.26',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '5',
    partName: 'D710P-BM147A-K4',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'K4',
    partLength: '1512',
    partWidth: '580',
    partWeight: '93.2',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-1P',
    type: 200,
    jointLength: 1489,
    weldLength: 2978,
  },
  {
    serialNumber: '56',
    nestingFileName: 'D710P_AH36170_CNF01',
    thickness: '17',
    width: '1800',
    length: '6000',
    material: 'AH36',
    steelWeight: '1441.26',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '5',
    partName: 'D710P-BM147A-K4',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'K4',
    partLength: '1512',
    partWidth: '580',
    partWeight: '93.2',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-1P',
    type: 200,
    jointLength: 611.5,
    weldLength: 1223,
  },
  {
    serialNumber: '70',
    nestingFileName: 'D710P_AH36180_CNK01',
    thickness: '18',
    width: '1600',
    length: '11800',
    material: 'AH36',
    steelWeight: '2667.744',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '12',
    partName: 'D710P-BM147A-W1',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'W1',
    partLength: '10151',
    partWidth: '300',
    partWeight: '430.3',
    processingCode: '',
    processFlow: 'T1',
    jointPart: null,
    jointPartNameTB: 'D710P-BM147A/F1P',
    type: null,
    jointLength: null,
    weldLength: null,
  },
  {
    serialNumber: '572',
    nestingFileName: 'D710P_AH36100_CNH01',
    thickness: '10',
    width: '1600',
    length: '9600',
    material: 'AH36',
    steelWeight: '1205.76',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '57',
    partName: 'D710P-BM147A-W5',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'W5',
    partLength: '591',
    partWidth: '100',
    partWeight: '4.7',
    processingCode: 'H',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A/F2P',
    type: 100,
    jointLength: 100,
    weldLength: 100,
  },
  {
    serialNumber: '598',
    nestingFileName: 'D710P_AH36100_CNH01',
    thickness: '10',
    width: '1600',
    length: '9600',
    material: 'AH36',
    steelWeight: '1205.76',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '83',
    partName: 'D710P-BM147A-W6',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'W6',
    partLength: '591',
    partWidth: '100',
    partWeight: '4.7',
    processingCode: 'H',
    processFlow: 'T1',
    jointPart: null,
    jointPartNameTB: null,
    type: null,
    jointLength: null,
    weldLength: null,
  },
  {
    serialNumber: '789',
    nestingFileName: 'D710P_AH36100_CNK01',
    thickness: '10',
    width: '2000',
    length: '10000',
    material: 'AH36',
    steelWeight: '1570',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '5',
    partName: 'D710P-BM147A-B1',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'B1',
    partLength: '380',
    partWidth: '246',
    partWeight: '5.5',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-1BP',
    type: 200,
    jointLength: 316.5,
    weldLength: 633,
  },
  {
    serialNumber: '789',
    nestingFileName: 'D710P_AH36100_CNK01',
    thickness: '10',
    width: '2000',
    length: '10000',
    material: 'AH36',
    steelWeight: '1570',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '5',
    partName: 'D710P-BM147A-B1',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'B1',
    partLength: '380',
    partWidth: '246',
    partWeight: '5.5',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-1BP',
    type: 200,
    jointLength: 120,
    weldLength: 240,
  },
  {
    serialNumber: '834',
    nestingFileName: 'D710P_AH36100_CNK01',
    thickness: '10',
    width: '2000',
    length: '10000',
    material: 'AH36',
    steelWeight: '1570',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '50',
    partName: 'D710P-BM147A-B2',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'B2',
    partLength: '380',
    partWidth: '246',
    partWeight: '5.5',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-2BP',
    type: 200,
    jointLength: 316.5,
    weldLength: 633,
  },
  {
    serialNumber: '834',
    nestingFileName: 'D710P_AH36100_CNK01',
    thickness: '10',
    width: '2000',
    length: '10000',
    material: 'AH36',
    steelWeight: '1570',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '50',
    partName: 'D710P-BM147A-B2',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'B2',
    partLength: '380',
    partWidth: '246',
    partWeight: '5.5',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-2BP',
    type: 200,
    jointLength: 120,
    weldLength: 240,
  },
  {
    serialNumber: '856',
    nestingFileName: 'D710P_AH36100_CNK01',
    thickness: '10',
    width: '2000',
    length: '10000',
    material: 'AH36',
    steelWeight: '1570',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '72',
    partName: 'D710P-BM147A-B2',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'B2',
    partLength: '380',
    partWidth: '246',
    partWeight: '5.5',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-3BP',
    type: 200,
    jointLength: 316.5,
    weldLength: 633,
  },
  {
    serialNumber: '856',
    nestingFileName: 'D710P_AH36100_CNK01',
    thickness: '10',
    width: '2000',
    length: '10000',
    material: 'AH36',
    steelWeight: '1570',
    cuttingLength: '0.0',
    markingLength: '0.0',
    partNumber: '72',
    partName: 'D710P-BM147A-B2',
    sectionNumber: 'D710P',
    assemblyName: 'BM147A',
    partCode: 'B2',
    partLength: '380',
    partWidth: '246',
    partWeight: '5.5',
    processingCode: '',
    processFlow: 'T1',
    jointPart: 'BM147A',
    jointPartNameTB: 'D710P-BM147A-3BP',
    type: 200,
    jointLength: 120,
    weldLength: 240,
  },
];

/** props */
const props = defineProps({
  modelUrl: { type: String, required: true },
  modelType: { type: String, default: 'auto' }, // 'auto' | 'gltf' | 'fbx'
  resourcePath: { type: String, default: '' },
  crossOrigin: { type: String, default: 'anonymous' },
  withCredentials: { type: Boolean, default: false },
  enableURLModifier: { type: Boolean, default: true },

  enablePick: { type: Boolean, default: true },

  // ✅ 激活（高亮）默认改成橙色
  highlightColor: { type: String, default: 'orange' },
  highlightEmissiveIntensity: { type: Number, default: 1 },
});

const container = ref(null);

/** ====== ✅ 统一标点配置 ====== */
const MARK_CFG = reactive({
  markerRadius: 0.001,
  labelLiftWorld: 0.004,
  lineWidthPx: 3,
  pickTubeRadius: 0.02,
  surfaceLiftFactor: 1.6,
  dimOffsetWorld: 0.008,

  // ✅ dim 专用线宽
  dimExtWidthPx: 1,
  dimMainWidthPx: 2,

  // ✅ 平滑衔接：圆帽大小 & 箭头大小（像素）
  dimJointPx: 5,
  dimArrowPx: 8,
  dimArrowEnable: true,
});

/** ✅ 点位最小像素可见（避免拉远看不见，也避免拾取不到） */
const MARK_MIN_DIAMETER_PX = 10;

const surfaceLift = computed(() => Math.max(MARK_CFG.markerRadius * MARK_CFG.surfaceLiftFactor, 0.002));

/** ====== 业务：零件列表（由 RAW_ROWS 去重生成） ====== */
function normKey(v) { return String(v ?? '').trim(); }
function buildUniqueParts(rows) {
  const mp = new Map();
  (rows || []).forEach((r) => {
    const key = normKey(r.jointPartNameTB) || normKey(r.partName);
    if (!key) return;
    if (!mp.has(key)) {
      mp.set(key, {
        key,
        partName: normKey(r.partName),
        jointPartNameTB: normKey(r.jointPartNameTB),
        nestingFileName: normKey(r.nestingFileName),
        thickness: normKey(r.thickness),
        partLength: normKey(r.partLength),
        partWidth: normKey(r.partWidth),
        material: normKey(r.material),
        partWeight: normKey(r.partWeight),
        processFlow: normKey(r.processFlow),
        processingCode: normKey(r.processingCode),
        serialNumber: normKey(r.serialNumber),
      });
    }
  });
  return Array.from(mp.values());
}

function typeToText(t) {
  const s = String(t ?? '');
  if (s === '100') return '对接';
  if (s === '200') return '角焊';
  return s ? `未知(${s})` : '';
}
function buildWeldAggMap(rows) {
  const mp = new Map();
  (rows || []).forEach((r) => {
    const key = normKey(r.jointPartNameTB) || normKey(r.partName);
    if (!key) return;
    const weld = Number(r.weldLength) || 0;
    const joint = Number(r.jointLength) || 0;
    const type = r.type == null ? '' : String(r.type);
    if (!mp.has(key)) mp.set(key, { weldLength: 0, jointLength: 0, types: new Set() });
    const it = mp.get(key);
    it.weldLength += weld;
    it.jointLength += joint;
    if (type) it.types.add(type);
  });
  const out = new Map();
  mp.forEach((v, k) => {
    const types = Array.from(v.types);
    out.set(k, {
      weldLength: v.weldLength,
      jointLength: v.jointLength,
      weldType: types.join(','),
      weldTypeText: types.map(typeToText).join(' / '),
    });
  });
  return out;
}

const rawRows = ref(RAW_ROWS);
const partList = computed(() => buildUniqueParts(rawRows.value));
const weldAggMap = computed(() => buildWeldAggMap(rawRows.value));

function getWeldAggByAnyKey(key) {
  const k = normKey(key);
  if (!k) return null;
  if (weldAggMap.value.has(k)) return weldAggMap.value.get(k);
  const hit = partList.value.find((p) => p.key === k || p.partName === k || p.jointPartNameTB === k);
  if (!hit) return null;
  return weldAggMap.value.get(hit.key) || null;
}

/** 选中信息 */
const selectedKey = ref('');
const selectedInfo = ref(null);
const selectedBiz = computed(() => {
  const k = normKey(selectedKey.value);
  if (!k) return null;
  return partList.value.find((p) => p.key === k || p.partName === k || p.jointPartNameTB === k) || null;
});

/** ====== three 基础 ====== */
let renderer, scene, camera, controls, animationId;
let labelRenderer;
let onDblClick;
let onKeydown;
let mixer;
let currentRoot;
let marksRoot;
const clock = new THREE.Clock();

/** ✅ 环境贴图（PBR 保色关键） */
let envTexture = null;

/** ✅ 标记刷新调度：OrbitControls 一动就刷新 */
let marksDirty = true;
function requestMarksRefresh() { marksDirty = true; }

/** UI 状态 */
const mode = ref('normal');              // normal | wire | explode
const preExplodeMode = ref('normal');    // ✅ 进入爆炸前的“视图风格”（normal/wire）
const wireOpacity = ref(0.22);
const edgeThreshold = ref(22);
const explodeFactor = ref(200);
const isolateSelected = ref(false);

/** 工具模式 */
const toolMode = ref('pick'); // pick | measure | note | dim

/** 侧栏/参数/Tab/搜索 */
const sidebarCollapsed = ref(false);
const paramOpen = ref(false);
const sideTab = ref('parts');
const keyword = ref('');

const filteredPartList = computed(() => {
  const k = (keyword.value || '').trim().toLowerCase();
  if (!k) return partList.value;
  return partList.value.filter((p) => {
    const s = `${p.partName || ''} ${p.jointPartNameTB || ''} ${p.material || ''} ${p.processFlow || ''} ${p.thickness || ''}`;
    return s.toLowerCase().includes(k);
  });
});

const toolModeText = computed(() => {
  if (toolMode.value === 'pick') return '选取';
  if (toolMode.value === 'measure') return '标距';
  if (toolMode.value === 'note') return '标点';
  if (toolMode.value === 'dim') return '尺寸';
  return '工具';
});

const hudText = computed(() => {
  if (toolMode.value === 'pick') return '选取：点击零件，右侧联动详情。';
  if (toolMode.value === 'measure') return '标距：点两下创建；端点可拖拽微调；点击 label 修改文案。';
  if (toolMode.value === 'note') return '标点：点一下输入文字；拖拽圆点移动；点击可修改。';
  if (toolMode.value === 'dim') return '尺寸：点零件仅显示该零件长/宽/高；点击尺寸 label 可修改。';
  return '';
});

function toggleParam() { paramOpen.value = !paramOpen.value; }

/** ✅ 清空全部标记 + 还原 */
function resetAllToOriginal() {
  hardClearAllMarks();
  isolateSelected.value = false;
  if (currentRoot) currentRoot.traverse((o) => (o.visible = true));
  setMode('normal');
}
function clearMarksAndResetModel() {
  hardClearAllMarks();
  isolateSelected.value = false;
  explodeFactor.value = 0;
  setMode('normal');
}

/** viewer 快捷 */
function fitView() { if (currentRoot) frameObject(currentRoot, 1.25); }

/** ✅ 输入弹窗 */
const inputDlg = reactive({
  visible: false, title: '', placeholder: '', hint: '', subHint: '', value: '', _resolve: null,
});
function openInput({ title, placeholder, hint, subHint = '', defaultValue = '' }) {
  inputDlg.title = title;
  inputDlg.placeholder = placeholder || '';
  inputDlg.hint = hint || '';
  inputDlg.subHint = subHint || '';
  inputDlg.value = defaultValue ?? '';
  inputDlg.visible = true;
  return new Promise((resolve) => { inputDlg._resolve = resolve; });
}
function confirmInput() {
  const r = inputDlg._resolve;
  inputDlg.visible = false;
  inputDlg._resolve = null;
  r?.(String(inputDlg.value ?? '').trim());
}
function cancelInput() {
  const r = inputDlg._resolve;
  inputDlg.visible = false;
  inputDlg._resolve = null;
  r?.(null);
}

/** 本地资源映射 */
const PROJECT_MODEL_URLS = import.meta.glob('/src/assets/**/*.{glb,gltf,fbx,tga,png,jpg,jpeg,webp}', {
  eager: true, query: '?url', import: 'default',
});
function isAbsoluteURL(url) {
  const s = String(url || '');
  return /^([a-z]+:)?\/\//i.test(s) || /^data:/i.test(s) || /^blob:/i.test(s) || s.startsWith('/');
}
function normalizeAssetKey(input) {
  if (!input) return '';
  let s = String(input).trim();
  s = s.split('?')[0].split('#')[0];
  if (s.startsWith('@/')) s = s.replace(/^@\//, '/src/');
  if (s.startsWith('src/')) s = '/' + s;
  s = s.replace(/(\/src\/assets\/)+/g, '/src/assets/');
  return s;
}
function resolveProjectAssetUrl(input) {
  if (!input) return input;
  if (isAbsoluteURL(input)) return input;
  const key = normalizeAssetKey(input);
  const hit = PROJECT_MODEL_URLS[key];
  if (hit) return hit;
  console.error('[ThreeViewer] 未命中本地资源映射：', { input, key });
  return input;
}
function detectModelType(url) {
  const u = String(url || '').toLowerCase();
  if (props.modelType && props.modelType !== 'auto') return props.modelType;
  if (u.endsWith('.glb') || u.endsWith('.gltf')) return 'gltf';
  if (u.endsWith('.fbx')) return 'fbx';
  return 'fbx';
}
function joinURL(base, path) {
  if (!base) return path;
  return base.replace(/\/+$/, '') + '/' + String(path || '').replace(/^\/+/, '');
}

/** 相机框选 */
function frameObject(object, fitOffset = 1.2) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize().multiplyScalar(distance);

  camera.near = Math.max(0.01, distance / 2000);
  camera.far = distance * 2000;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  camera.position.copy(center).add(dir);
  controls.update();

  const radius = size.length() * 0.5;
  controls.minDistance = Math.max(radius * 0.15, 0.01);
  controls.maxDistance = radius * 20;

  requestMarksRefresh();
}

/** 双击对焦 */
function bindDoubleClickFocus() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  onDblClick = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj.parent && obj.parent !== scene) obj = obj.parent;
      frameObject(obj, 1.15);
    }
  };
  renderer.domElement.addEventListener('dblclick', onDblClick);
}

/** ====== 选中高亮（单击） ====== */
const pickRaycaster = new THREE.Raycaster();
const pickMouse = new THREE.Vector2();

let selectedMesh = null;
const originalMaterialMap = new Map();

function applyHighlight(mesh) {
  if (!mesh?.isMesh) return;
  if (!originalMaterialMap.has(mesh)) {
    originalMaterialMap.set(mesh, mesh.material);
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((m) => (m?.clone ? m.clone() : m))
      : mesh.material?.clone ? mesh.material.clone() : mesh.material;
  }
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  mats.forEach((m) => {
    if (!m) return;
    if (m.emissive) {
      m.emissive.set(props.highlightColor);
      m.emissiveIntensity = props.highlightEmissiveIntensity;
    } else if (m.color) {
      m.color.set(props.highlightColor);
    }
    m.needsUpdate = true;
  });
}
function clearHighlight(mesh) {
  if (!mesh) return;
  const orig = originalMaterialMap.get(mesh);
  if (!orig) return;

  const cur = mesh.material;
  const mats = Array.isArray(cur) ? cur : [cur];
  mats.forEach((m) => m?.dispose?.());

  mesh.material = orig;
  originalMaterialMap.delete(mesh);
}
function clearAllHighlights() {
  for (const [mesh] of originalMaterialMap) {
    try { clearHighlight(mesh); } catch {}
  }
  originalMaterialMap.clear();
  selectedMesh = null;
  selectedKey.value = '';
  selectedInfo.value = null;
}

function updateSelectedInfo(mesh) {
  if (!mesh) { selectedInfo.value = null; return; }
  const localPos = mesh.position.clone();
  const worldPos = new THREE.Vector3();
  mesh.getWorldPosition(worldPos);

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const partNameKey = mesh.userData?.originalName || mesh.name || '';
  const jointInfo = getWeldAggByAnyKey(partNameKey);

  selectedInfo.value = {
    uuid: mesh.uuid,
    name: partNameKey,
    visible: mesh.visible,
    localPos,
    worldPos,
    bboxSize: size,
    bboxCenter: center,
    explodeDir: mesh.userData?.__explodeDir || null,

    weldLength: jointInfo ? jointInfo.weldLength : null,
    jointLength: jointInfo ? jointInfo.jointLength : null,
    weldType: jointInfo ? jointInfo.weldType : null,
    weldTypeText: jointInfo ? jointInfo.weldTypeText : null,
  };
}

function setSelected(mesh) {
  if (selectedMesh === mesh) return;
  clearHighlight(selectedMesh);
  selectedMesh = mesh || null;

  if (selectedMesh) {
    selectedKey.value = selectedMesh.userData?.originalName || selectedMesh.name || selectedMesh.uuid;
    applyHighlight(selectedMesh);
  } else {
    selectedKey.value = '';
  }

  updateSelectedInfo(selectedMesh);
  if (isolateSelected.value) applyIsolateVisibility();
  emit('pick', { mesh: selectedMesh, name: selectedMesh?.name, uuid: selectedMesh?.uuid });

  requestMarksRefresh();
}

/** ====== 标点/标距/尺寸：数据 + 渲染 ====== */
function uid() {
  return crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function resolveMeshByUuid(uuid) {
  return currentRoot?.getObjectByProperty?.('uuid', uuid) || null;
}
function anchorToWorld(anchor) {
  const mesh = resolveMeshByUuid(anchor?.uuid);
  if (!mesh || !anchor?.local) return null;

  const p = mesh.localToWorld(anchor.local.clone());
  if (anchor.localNormal) {
    const wn = anchor.localNormal.clone().transformDirection(mesh.matrixWorld).normalize();
    p.addScaledVector(wn, surfaceLift.value);
  }
  return p;
}
function removeCss2DElement(obj) {
  if (!obj) return;
  const el = obj.element;
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

/** ====== ✅ 基础几何（共享） ====== */
const MARKER_GEO = new THREE.SphereGeometry(1, 16, 16);
const TUBE_GEO = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
const LINE_CYL_GEO = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
const LABEL_HIT_GEO = new THREE.PlaneGeometry(1, 1);

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const UP = new THREE.Vector3(0, 1, 0);

/** ✅ dim 圆帽/箭头几何 */
const DIM_JOINT_GEO = new THREE.SphereGeometry(1, 16, 16);
const DIM_ARROW_GEO = new THREE.ConeGeometry(1, 1, 18, 1, true);

/** === 像素 <-> 世界长度（用于 labelHit/圆帽/箭头等） === */
function quantize(v, step = 1e-6) { return Math.round(v / step) * step; }
function pxToWorldLength(px, worldDistToCamera) {
  const h = container.value?.clientHeight || 1;
  const fov = THREE.MathUtils.degToRad(camera?.fov || 60);
  const unitsPerPixel = (2 * worldDistToCamera * Math.tan(fov / 2)) / h;
  return Math.max(quantize(unitsPerPixel * px, 1e-6), 0.0003);
}
function pxToWorldRadius(px, worldDistToCamera) {
  return Math.max(quantize(pxToWorldLength(px, worldDistToCamera) / 2, 1e-6), 0.0003);
}

/** ✅ marker：增加最小像素可见保护（也更好拾取/拖拽） */
function applyMarkerScale(markerMesh, worldPoint) {
  if (!markerMesh || !camera || !worldPoint) return;
  const dist = camera.position.distanceTo(worldPoint);
  const minWorld = pxToWorldRadius(MARK_MIN_DIAMETER_PX, dist);
  markerMesh.scale.setScalar(Math.max(MARK_CFG.markerRadius, minWorld));
}

/** ✅ label 可点击：3D 透明拾取面板（不依赖 CSS pointer-events） */
function makeLabelHit(meta) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.0,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(LABEL_HIT_GEO, mat);
  m.renderOrder = 2100;
  m.frustumCulled = false;
  m.userData.__mark = meta;
  return m;
}
function setLabelHitFromLabel(hitMesh, labelObj) {
  if (!hitMesh || !labelObj || !camera) return;
  const el = labelObj.element;

  let wPx = 84;
  let hPx = 30;

  if (el) {
    const rect = el.getBoundingClientRect?.();
    const rw = rect?.width || el.offsetWidth;
    const rh = rect?.height || el.offsetHeight;
    if (rw) wPx = rw + 14;
    if (rh) hPx = rh + 10;
  }

  const dist = camera.position.distanceTo(labelObj.position);
  const w = Math.max(pxToWorldLength(wPx, dist), 0.002);
  const h = Math.max(pxToWorldLength(hPx, dist), 0.002);

  hitMesh.position.copy(labelObj.position);
  hitMesh.quaternion.copy(camera.quaternion);
  hitMesh.scale.set(w, h, 1);
  hitMesh.visible = true;
}

function makeDimCap(color = 0x2563eb, opacity = 0.95) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -2;
  mat.polygonOffsetUnits = -2;

  const m = new THREE.Mesh(DIM_JOINT_GEO, mat);
  m.renderOrder = 1400;
  m.frustumCulled = false;
  return m;
}
function makeDimArrow(color = 0x2563eb, opacity = 0.95) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -2;
  mat.polygonOffsetUnits = -2;

  const m = new THREE.Mesh(DIM_ARROW_GEO, mat);
  m.renderOrder = 1390;
  m.frustumCulled = false;
  return m;
}
function setCapAt(cap, point, px) {
  const dist = camera.position.distanceTo(point);
  const r = pxToWorldRadius(px, dist);
  cap.position.copy(point);
  cap.scale.setScalar(r);
}

function makeLineMesh(color = 0xef4444, opacity = 0.95, widthPx = 3) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
  });
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -2;
  mat.polygonOffsetUnits = -2;

  const mesh = new THREE.Mesh(LINE_CYL_GEO, mat);
  mesh.renderOrder = 1200;
  mesh.frustumCulled = false;
  mesh.userData.__widthPx = widthPx;
  return mesh;
}
function setLineMeshFromTo(mesh, p1, p2, widthPxOverride) {
  if (!mesh || !p1 || !p2 || !camera) return;
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 1e-8) { mesh.visible = false; return; }
  mesh.visible = true;

  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const distToCam = camera.position.distanceTo(mid);

  const widthPx = Number(widthPxOverride ?? mesh.userData.__widthPx ?? 3);
  const radius = pxToWorldRadius(widthPx, distToCam);

  const quat = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir.clone().normalize());
  mesh.position.copy(mid);
  mesh.quaternion.copy(quat);
  mesh.scale.set(radius, len, radius);
}

function makeMarker(color = 0xef4444) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
    depthWrite: false,
  });
  const s = new THREE.Mesh(MARKER_GEO, mat);
  s.renderOrder = 9999;
  s.frustumCulled = false;
  s.scale.setScalar(MARK_CFG.markerRadius);
  return s;
}
function makePickTube() {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.0,
    depthTest: false,
    depthWrite: false,
  });
  const m = new THREE.Mesh(TUBE_GEO, mat);
  m.renderOrder = 9998;
  m.frustumCulled = false;
  return m;
}
function makeLabel(text, cls = 'measure') {
  const el = document.createElement('div');
  el.className = `mark-label ${cls}`;
  el.textContent = text;
  el.style.willChange = 'transform';
  el.style.transform = 'translateZ(0)';
  el.style.backfaceVisibility = 'hidden';
  return new CSS2DObject(el);
}
function orientPickTube(tube, p1, p2, radius) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 1e-8) { tube.visible = false; return; }
  tube.visible = true;

  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  tube.position.copy(mid);

  const quat = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir.clone().normalize());
  tube.quaternion.copy(quat);

  tube.scale.set(radius, len, radius);
}

/** ✅ 可拾取标点对象列表 */
const markPickables = new Set();
function addPickable(obj) { if (obj) markPickables.add(obj); }
function clearPickablesByGroup(g) { if (!g) return; g.traverse((o) => markPickables.delete(o)); }

function isUnderMarksRoot(obj) {
  let p = obj;
  while (p) { if (p === marksRoot) return true; p = p.parent; }
  return false;
}
function isWorldVisible(obj) {
  let p = obj;
  while (p) { if (p.visible === false) return false; p = p.parent; }
  return true;
}

/** ====== 数据 ====== */
const measures = ref([]);
const notes = ref([]);
const dims = ref([]);

/** ✅ 当前“显示中的尺寸目标” */
const activeDimTargetUuid = ref('');
const dimsVisibleList = computed(() => {
  const u = activeDimTargetUuid.value;
  if (!u) return dims.value;
  return dims.value.filter((d) => d.targetUuid === u);
});
function showOnlyDimsFor(uuid) {
  activeDimTargetUuid.value = uuid || '';
  dims.value.forEach((d) => { if (d?.g) d.g.visible = !uuid ? true : d.targetUuid === uuid; });
  requestMarksRefresh();
}

/** ====== 标距临时态 ====== */
let measureDraft = { a: null, lastHover: null, g: null, m1: null, line: null, tube: null, label: null, labelHit: null };
function clearMeasureDraft() {
  if (!measureDraft.g) {
    measureDraft = { a: null, lastHover: null, g: null, m1: null, line: null, tube: null, label: null, labelHit: null };
    return;
  }
  clearPickablesByGroup(measureDraft.g);
  marksRoot?.remove(measureDraft.g);
  try { measureDraft.m1?.material?.dispose?.(); } catch {}
  try { measureDraft.line?.material?.dispose?.(); } catch {}
  try { measureDraft.tube?.material?.dispose?.(); } catch {}
  try { measureDraft.labelHit?.material?.dispose?.(); } catch {}
  try { removeCss2DElement(measureDraft.label); } catch {}
  measureDraft = { a: null, lastHover: null, g: null, m1: null, line: null, tube: null, label: null, labelHit: null };
  requestMarksRefresh();
}

/** ====== 清理 ====== */
function disposeMaterialSafe(mat) {
  if (!mat) return;
  for (const k in mat) {
    const v = mat[k];
    if (v && v.isTexture) v.dispose?.();
  }
  mat.dispose?.();
}
function disposeMarkNode(node) {
  if (!node) return;
  node.traverse((o) => {
    if (o.isCSS2DObject && o.element && o.element.parentNode) {
      o.element.parentNode.removeChild(o.element);
    }
    const geo = o.geometry;
    if (
      geo &&
      geo !== MARKER_GEO &&
      geo !== TUBE_GEO &&
      geo !== LINE_CYL_GEO &&
      geo !== LABEL_HIT_GEO &&
      geo !== DIM_JOINT_GEO
    ) {
      geo.dispose?.();
    }

    const m = o.material;
    if (Array.isArray(m)) m.forEach(disposeMaterialSafe);
    else disposeMaterialSafe(m);
  });
}
function hardClearAllMarks() {
  if (!marksRoot) return;
  clearMeasureDraft();

  const children = [...marksRoot.children];
  for (const c of children) {
    marksRoot.remove(c);
    disposeMarkNode(c);
  }
  measures.value = [];
  notes.value = [];
  dims.value = [];
  activeDimTargetUuid.value = '';
  markPickables.clear();
  requestMarksRefresh();
}

/** ====== 拾取：模型表面点 ====== */
function pickHitOnModel(e) {
  if (!currentRoot || !renderer || !camera) return null;
  const rect = renderer.domElement.getBoundingClientRect();
  pickMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pickMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  pickRaycaster.setFromCamera(pickMouse, camera);

  const hits = pickRaycaster.intersectObject(currentRoot, true);
  const hit = hits.find((h) => h.object && h.object.isMesh);
  if (!hit) return null;

  const mesh = hit.object;
  const world = hit.point.clone();
  const local = mesh.worldToLocal(world.clone());
  const localNormal = hit.face?.normal ? hit.face.normal.clone().normalize() : new THREE.Vector3(0, 1, 0);

  return { uuid: mesh.uuid, local, localNormal, world, mesh };
}

/** ====== 拾取：标点 ====== */
function markExists(meta) {
  if (!meta?.id || !meta?.type) return false;
  if (meta.type === 'measure') return measures.value.some((m) => m.id === meta.id);
  if (meta.type === 'note') return notes.value.some((n) => n.id === meta.id);
  if (meta.type === 'dim') return dims.value.some((d) => d.id === meta.id);
  if (meta.type === 'measure_draft') return true;
  return false;
}
function pickMarkHit(e) {
  if (!renderer || !camera || markPickables.size === 0) return null;
  const rect = renderer.domElement.getBoundingClientRect();
  pickMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pickMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  pickRaycaster.setFromCamera(pickMouse, camera);

  const pickArray = Array.from(markPickables).filter((o) => o && isUnderMarksRoot(o) && isWorldVisible(o));
  if (pickArray.length === 0) return null;

  const hits = pickRaycaster.intersectObjects(pickArray, true);
  for (const h of hits) {
    const meta = h.object?.userData?.__mark;
    if (!meta) continue;
    if (!markExists(meta)) continue;
    return { meta, hitObject: h.object };
  }
  return null;
}

function setTool(t) {
  toolMode.value = t;
  if (t !== 'measure') clearMeasureDraft();
  if (t === 'dim' && selectedMesh) createDimsForMesh(selectedMesh);
  requestMarksRefresh();
}

/** ✅ 爆炸开关：如果爆炸前是透明框线，则爆炸也保持透明框线 */
function toggleExplode() {
  if (mode.value === 'explode') {
    setMode(preExplodeMode.value || 'normal');
    return;
  }
  if (mode.value === 'wire' || mode.value === 'normal') {
    preExplodeMode.value = mode.value;
  }
  setMode('explode');
}

/** ====== 实时距离（只显示实时） ====== */
function fmtMm(v) {
  if (!Number.isFinite(v)) return '0';
  return Number(v).toFixed(1).replace(/\.0$/, '');
}

/** 计算：同一零件时优先换算 mm，否则用世界单位 u */
function getBizDimsForMesh(mesh) {
  const key = normKey(mesh?.userData?.originalName) || normKey(mesh?.name);
  if (!key) return null;
  const biz = partList.value.find((p) => p.key === key || p.partName === key || p.jointPartNameTB === key);
  if (!biz) return null;
  const L = Number(biz.partLength);
  const W = Number(biz.partWidth);
  const T = Number(biz.thickness);
  return { L: Number.isFinite(L) ? L : null, W: Number.isFinite(W) ? W : null, T: Number.isFinite(T) ? T : null };
}

/** 给 mesh 计算一次：哪个轴是长宽高（按 bbox 世界长度排序） */
function getAxisKeys(mesh) {
  if (!mesh?.isMesh) return null;
  if (mesh.userData.__axisKeys) return mesh.userData.__axisKeys;

  const geom = mesh.geometry;
  if (!geom) return null;
  if (!geom.boundingBox) geom.computeBoundingBox();
  const localSize = new THREE.Vector3();
  geom.boundingBox.getSize(localSize);

  const scl = new THREE.Vector3();
  mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scl);
  const lenX = Math.abs(localSize.x * scl.x);
  const lenY = Math.abs(localSize.y * scl.y);
  const lenZ = Math.abs(localSize.z * scl.z);

  const axes = [
    { k: 'x', len: lenX },
    { k: 'y', len: lenY },
    { k: 'z', len: lenZ },
  ].sort((a, b) => b.len - a.len);

  const keys = { Lk: axes[0].k, Wk: axes[1].k, Tk: axes[2].k };
  mesh.userData.__axisKeys = keys;
  return keys;
}

function calcRealtimeDistance(aAnchor, bAnchor) {
  const p1 = anchorToWorld(aAnchor);
  const p2 = anchorToWorld(bAnchor);
  if (!p1 || !p2) return { unit: 'u', value: 0 };

  let unit = 'u';
  let value = p1.distanceTo(p2);

  if (aAnchor?.uuid && bAnchor?.uuid && aAnchor.uuid === bAnchor.uuid) {
    const mesh = resolveMeshByUuid(aAnchor.uuid);
    const biz = mesh ? getBizDimsForMesh(mesh) : null;
    const keys = mesh ? getAxisKeys(mesh) : null;
    if (mesh?.geometry && biz && keys) {
      const geom = mesh.geometry;
      if (!geom.boundingBox) geom.computeBoundingBox();
      const size = new THREE.Vector3();
      geom.boundingBox.getSize(size);

      const dir = bAnchor.local.clone().sub(aAnchor.local);
      const ax = Math.abs(dir.x), ay = Math.abs(dir.y), az = Math.abs(dir.z);
      const dom = ax >= ay && ax >= az ? 'x' : (ay >= ax && ay >= az ? 'y' : 'z');

      const axisName = dom === keys.Lk ? 'L' : dom === keys.Wk ? 'W' : 'T';
      const bizMm = axisName === 'L' ? biz.L : axisName === 'W' ? biz.W : biz.T;
      const geomLen = size[dom];

      if (Number.isFinite(bizMm) && Number.isFinite(geomLen) && geomLen > 1e-8) {
        value = (Math.abs(dir[dom]) / geomLen) * bizMm;
        unit = 'mm';
      }
    }
  }

  return { unit, value };
}

function measureLabelText(a, b) {
  const d = calcRealtimeDistance(a, b);
  if (d.unit === 'mm') return `距离 ${fmtMm(d.value)} mm`;
  return `距离 ${Number(d.value).toFixed(3)} u`;
}

/** ====== 刷新标点位置 ====== */
function refreshAllMarksTransform() {
  // measures
  measures.value.forEach((m) => {
    const p1 = anchorToWorld(m.a);
    const p2 = anchorToWorld(m.b);
    if (!p1 || !p2) return;

    m.m1.position.copy(p1);
    m.m2.position.copy(p2);
    applyMarkerScale(m.m1, p1);
    applyMarkerScale(m.m2, p2);

    setLineMeshFromTo(m.line, p1, p2, MARK_CFG.lineWidthPx);
    orientPickTube(m.tube, p1, p2, MARK_CFG.pickTubeRadius);

    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    m.midWorld = mid;
    m.label.position.copy(mid.clone().addScaledVector(UP, MARK_CFG.labelLiftWorld));
    setLabelHitFromLabel(m.labelHit, m.label);

    if (m.valueMode === 'auto') {
      m.displayText = measureLabelText(m.a, m.b);
      if (m.label?.element) m.label.element.textContent = m.displayText;
    } else {
      if (m.label?.element) m.label.element.textContent = m.displayText;
    }
  });

  // notes
  notes.value.forEach((n) => {
    const p = anchorToWorld(n.anchor);
    if (!p) return;
    n.world = p;
    n.marker.position.copy(p);
    applyMarkerScale(n.marker, p);
    n.label.position.copy(p.clone().addScaledVector(UP, MARK_CFG.labelLiftWorld));
  });

  // dims
  dims.value.forEach((d) => {
    const sp1 = anchorToWorld(d.a);
    const sp2 = anchorToWorld(d.b);
    if (!sp1 || !sp2) return;

    const mesh = resolveMeshByUuid(d.targetUuid);
    let outDirWorld = new THREE.Vector3(0, 1, 0);
    if (mesh && d.outLocalDir) outDirWorld = d.outLocalDir.clone().transformDirection(mesh.matrixWorld).normalize();

    const p1 = sp1.clone().addScaledVector(outDirWorld, MARK_CFG.dimOffsetWorld);
    const p2 = sp2.clone().addScaledVector(outDirWorld, MARK_CFG.dimOffsetWorld);

    setLineMeshFromTo(d.ext1, sp1, p1, MARK_CFG.dimExtWidthPx);
    setLineMeshFromTo(d.ext2, sp2, p2, MARK_CFG.dimExtWidthPx);
    setLineMeshFromTo(d.line, p1, p2, MARK_CFG.dimMainWidthPx);

    if (d.cap1 && d.cap2) {
      setCapAt(d.cap1, p1, MARK_CFG.dimJointPx);
      setCapAt(d.cap2, p2, MARK_CFG.dimJointPx);
    }

    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    d.midWorld = mid;
    d.label.position.copy(mid.clone().addScaledVector(outDirWorld, MARK_CFG.labelLiftWorld));
    setLabelHitFromLabel(d.labelHit, d.label);

    if (d.valueMode === 'auto') d.displayText = `${d.axisName} ${fmtMm(d.autoLen)} mm`;
    if (d.label?.element) d.label.element.textContent = d.displayText;
  });

  // measure draft preview
  if (toolMode.value === 'measure' && measureDraft.a && measureDraft.lastHover && measureDraft.line) {
    const p1 = anchorToWorld(measureDraft.a);
    const p2 = anchorToWorld(measureDraft.lastHover);
    if (!p1 || !p2) return;

    setLineMeshFromTo(measureDraft.line, p1, p2, MARK_CFG.lineWidthPx);
    orientPickTube(measureDraft.tube, p1, p2, MARK_CFG.pickTubeRadius);

    measureDraft.m1.position.copy(p1);
    applyMarkerScale(measureDraft.m1, p1);

    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    measureDraft.label.position.copy(mid.clone().addScaledVector(UP, MARK_CFG.labelLiftWorld));
    if (measureDraft.label?.element) {
      measureDraft.label.element.textContent = measureLabelText(measureDraft.a, measureDraft.lastHover);
    }
    if (measureDraft.labelHit) setLabelHitFromLabel(measureDraft.labelHit, measureDraft.label);
  }
}

/** ====== 创建：标距 ====== */
async function onMeasureClick(hit) {
  if (!scene || !marksRoot) return;

  // 第一次：创建草稿
  if (!measureDraft.a) {
    measureDraft.a = { uuid: hit.uuid, local: hit.local.clone(), localNormal: hit.localNormal.clone() };
    measureDraft.lastHover = { uuid: hit.uuid, local: hit.local.clone(), localNormal: hit.localNormal.clone() };

    const g = new THREE.Group();
    g.name = '__measure_draft__';
    measureDraft.g = g;

    const m1 = makeMarker(0xef4444);
    m1.userData.__mark = { type: 'measure_draft', id: 'draft', role: 'a' };

    const line = makeLineMesh(0xef4444, 0.9, MARK_CFG.lineWidthPx);
    const tube = makePickTube();
    const label = makeLabel('距离', 'measure');

    const labelHit = makeLabelHit({ type: 'measure_draft', id: 'draft', role: 'label' });

    g.add(m1, line, tube, label, labelHit);
    marksRoot.add(g);

    measureDraft.m1 = m1;
    measureDraft.line = line;
    measureDraft.tube = tube;
    measureDraft.label = label;
    measureDraft.labelHit = labelHit;

    addPickable(labelHit);

    requestMarksRefresh();
    refreshAllMarksTransform();
    return;
  }

  // 第二次：落点，生成正式标距
  const a = measureDraft.a;
  const b = { uuid: hit.uuid, local: hit.local.clone(), localNormal: hit.localNormal.clone() };
  clearMeasureDraft();

  const id = uid();
  const g = new THREE.Group();
  g.name = `__measure_${id}__`;

  const m1 = makeMarker(0xef4444);
  const m2 = makeMarker(0xef4444);
  m1.userData.__mark = { type: 'measure', id, role: 'a', draggable: true };
  m2.userData.__mark = { type: 'measure', id, role: 'b', draggable: true };
  addPickable(m1);
  addPickable(m2);

  const line = makeLineMesh(0xef4444, 0.95, MARK_CFG.lineWidthPx);
  const tube = makePickTube();
  const label = makeLabel('', 'measure');

  const labelHit = makeLabelHit({ type: 'measure', id, role: 'label', clickable: true });
  addPickable(labelHit);

  g.add(m1, m2, line, tube, label, labelHit);
  marksRoot.add(g);

  const rec = { id, a, b, valueMode: 'auto', displayText: '', midWorld: null, g, m1, m2, line, tube, label, labelHit };
  measures.value.unshift(rec);

  requestMarksRefresh();
  refreshAllMarksTransform();
}

/** ====== 创建：标点 ====== */
async function onNoteClick(hit) {
  if (!scene || !marksRoot) return;
  const userText = await openInput({
    title: '输入标点',
    placeholder: '例如：检修口 / 焊缝起点 / 参考边…',
    hint: '提示：标点会跟随爆炸/动画移动；可拖拽圆点移动；点击标点可修改。',
    defaultValue: '',
  });
  if (!userText) return;

  const id = uid();
  const anchor = { uuid: hit.uuid, local: hit.local.clone(), localNormal: hit.localNormal.clone() };
  const p = anchorToWorld(anchor);
  if (!p) return;

  const g = new THREE.Group();
  g.name = `__note_${id}__`;

  const marker = makeMarker(0xf59e0b);
  marker.userData.__mark = { type: 'note', id, role: 'p', draggable: true };
  addPickable(marker);

  const label = makeLabel(userText, 'note');

  g.add(marker, label);
  marksRoot.add(g);

  notes.value.unshift({ id, anchor, marker, label, text: userText, world: p, g });
  requestMarksRefresh();
  refreshAllMarksTransform();
}

/** ====== 尺寸（dim） ====== */
function axisVec(key) {
  if (key === 'x') return new THREE.Vector3(1, 0, 0);
  if (key === 'y') return new THREE.Vector3(0, 1, 0);
  return new THREE.Vector3(0, 0, 1);
}
function localCorner(localCenter, half, sx, sy, sz) {
  return localCenter.clone().add(new THREE.Vector3(sx * half.x, sy * half.y, sz * half.z));
}
function getWorldOBBInfo(mesh) {
  const geom = mesh?.geometry;
  if (!geom) return null;
  if (!geom.boundingBox) geom.computeBoundingBox();
  const localBox = geom.boundingBox;
  if (!localBox) return null;

  const localSize = new THREE.Vector3();
  const localCenter = new THREE.Vector3();
  localBox.getSize(localSize);
  localBox.getCenter(localCenter);

  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  mesh.matrixWorld.decompose(pos, quat, scl);

  const dirX = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).normalize();
  const dirY = new THREE.Vector3(0, 1, 0).applyQuaternion(quat).normalize();
  const dirZ = new THREE.Vector3(0, 0, 1).applyQuaternion(quat).normalize();

  const lenX = Math.abs(localSize.x * scl.x);
  const lenY = Math.abs(localSize.y * scl.y);
  const lenZ = Math.abs(localSize.z * scl.z);

  return {
    localSize,
    localCenter,
    axes: [
      { key: 'x', dirWorld: dirX, len: lenX },
      { key: 'y', dirWorld: dirY, len: lenY },
      { key: 'z', dirWorld: dirZ, len: lenZ },
    ],
  };
}

function removeDimsForTarget(uuid) {
  const ids = dims.value.filter((d) => d.targetUuid === uuid).map((d) => d.id);
  ids.forEach(removeDim);
}

function createDimSegment({ targetUuid, axisName, varyKey, fixedSigns, displayLen }) {
  const mesh = resolveMeshByUuid(targetUuid);
  if (!mesh) return null;

  const info = getWorldOBBInfo(mesh);
  if (!info) return null;

  const { localSize, localCenter } = info;
  const half = localSize.clone().multiplyScalar(0.5);

  const s1 = { x: fixedSigns.x ?? 1, y: fixedSigns.y ?? 1, z: fixedSigns.z ?? 1 };
  const s2 = { x: fixedSigns.x ?? 1, y: fixedSigns.y ?? 1, z: fixedSigns.z ?? 1 };
  s1[varyKey] = -1;
  s2[varyKey] = +1;

  const aLocal = localCorner(localCenter, half, s1.x, s1.y, s1.z);
  const bLocal = localCorner(localCenter, half, s2.x, s2.y, s2.z);

  const otherKeys = ['x', 'y', 'z'].filter((k) => k !== varyKey);
  const outLocal = axisVec(otherKeys[0]).multiplyScalar(s1[otherKeys[0]]).add(axisVec(otherKeys[1]).multiplyScalar(s1[otherKeys[1]])).normalize();

  const id = uid();
  const g = new THREE.Group();
  g.name = `__dim_${id}__`;

  const ext1 = makeLineMesh(0x2563eb, 0.65, MARK_CFG.dimExtWidthPx);
  const ext2 = makeLineMesh(0x2563eb, 0.65, MARK_CFG.dimExtWidthPx);
  const line = makeLineMesh(0x2563eb, 0.95, MARK_CFG.dimMainWidthPx);

  const label = makeLabel(axisName, 'dim');
  const labelHit = makeLabelHit({ type: 'dim', id, role: 'label', clickable: true });
  addPickable(labelHit);

  const cap1 = makeDimCap(0x2563eb, 0.95);
  const cap2 = makeDimCap(0x2563eb, 0.95);

  g.add(ext1, ext2, line, cap1, cap2, label, labelHit);
  marksRoot.add(g);

  const bizLen = Number(displayLen);
  const hasBiz = Number.isFinite(bizLen);

  return {
    id,
    axisName,
    targetUuid,
    a: { uuid: targetUuid, local: aLocal.clone(), localNormal: outLocal.clone() },
    b: { uuid: targetUuid, local: bLocal.clone(), localNormal: outLocal.clone() },
    outLocalDir: outLocal.clone(),
    valueMode: 'auto',
    autoLen: hasBiz ? bizLen : 100,
    displayText: '',
    midWorld: null,
    g,
    ext1, ext2, line,
    label,
    labelHit,
    cap1, cap2,
  };
}

function createDimsForMesh(mesh) {
  if (!mesh?.isMesh || !marksRoot) return;
  const targetUuid = mesh.uuid;

  removeDimsForTarget(targetUuid);

  const info = getWorldOBBInfo(mesh);
  if (!info) return;
  const sorted = [...info.axes].sort((a, b) => (b.len || 0) - (a.len || 0));
  const Lk = sorted[0].key;
  const Wk = sorted[1].key;
  const Tk = sorted[2].key;

  const biz = getBizDimsForMesh(mesh);
  const vL = biz?.L ?? null;
  const vW = biz?.W ?? null;
  const vT = biz?.T ?? null;

  const dL = createDimSegment({ targetUuid, axisName: '长', varyKey: Lk, fixedSigns: { [Wk]: +1, [Tk]: +1 }, displayLen: vL });
  const dW = createDimSegment({ targetUuid, axisName: '宽', varyKey: Wk, fixedSigns: { [Lk]: -1, [Tk]: -1 }, displayLen: vW });
  const dT = createDimSegment({ targetUuid, axisName: '高', varyKey: Tk, fixedSigns: { [Lk]: +1, [Wk]: -1 }, displayLen: vT });

  const arr = [dL, dW, dT].filter(Boolean);
  dims.value.unshift(...arr);

  showOnlyDimsFor(targetUuid);
  requestMarksRefresh();
  refreshAllMarksTransform();
}

/** ====== 编辑：标点/标距/尺寸 ====== */
async function editNote(id) {
  const n = notes.value.find((x) => x.id === id);
  if (!n) return;
  const userText = await openInput({
    title: '修改标点',
    placeholder: '请输入新的标点文字',
    hint: '提示：留空会取消本次修改。',
    defaultValue: n.text,
  });
  if (!userText) return;
  n.text = userText;
  if (n.label?.element) n.label.element.textContent = userText;
  requestMarksRefresh();
}
function normalizeMmText(input) {
  const s = String(input ?? '').trim();
  if (!s) return '';
  if (/^-?\d+(\.\d+)?$/.test(s)) return `${s} mm`;
  return s;
}
async function editDim(id) {
  const d = dims.value.find((x) => x.id === id);
  if (!d) return;
  const userText = await openInput({
    title: `修改尺寸（${d.axisName}）`,
    placeholder: '例如：1200 或 1200 mm（输入 auto 恢复自动）',
    hint: '',
    subHint: `当前：${d.displayText}`,
    defaultValue: '',
  });
  if (!userText) return;

  const s = userText.trim();
  if (/^(auto|自动|恢复)$/i.test(s)) {
    d.valueMode = 'auto';
    requestMarksRefresh();
    return;
  }

  d.valueMode = 'manual';
  d.displayText = normalizeMmText(s);
  if (d.label?.element) d.label.element.textContent = d.displayText;
  requestMarksRefresh();
}
async function editMeasure(id) {
  const m = measures.value.find((x) => x.id === id);
  if (!m) return;
  const userText = await openInput({
    title: '修改标距文案',
    placeholder: '例如：1200 或 1200 mm 或 自定义文字（输入 auto 恢复自动）',
    hint: '',
    subHint: `当前：${m.displayText}`,
    defaultValue: '',
  });
  if (!userText) return;

  const s = userText.trim();
  if (/^(auto|自动|恢复)$/i.test(s)) {
    m.valueMode = 'auto';
    requestMarksRefresh();
    return;
  }

  m.valueMode = 'manual';
  m.displayText = normalizeMmText(s);
  if (m.label?.element) m.label.element.textContent = m.displayText;
  requestMarksRefresh();
}

/** 删除：标距/标点/尺寸 */
function removeMeasure(id) {
  const idx = measures.value.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const m = measures.value[idx];
  clearPickablesByGroup(m.g);
  marksRoot?.remove(m.g);
  try { m.m1?.material?.dispose?.(); m.m2?.material?.dispose?.(); } catch {}
  try { m.line?.material?.dispose?.(); } catch {}
  try { m.tube?.material?.dispose?.(); } catch {}
  try { m.labelHit?.material?.dispose?.(); } catch {}
  try { removeCss2DElement(m.label); } catch {}
  measures.value.splice(idx, 1);
  requestMarksRefresh();
}
function removeNote(id) {
  const idx = notes.value.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const n = notes.value[idx];
  clearPickablesByGroup(n.g);
  marksRoot?.remove(n.g);
  try { n.marker?.material?.dispose?.(); } catch {}
  try { removeCss2DElement(n.label); } catch {}
  notes.value.splice(idx, 1);
  requestMarksRefresh();
}
function removeDim(id) {
  const idx = dims.value.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const d = dims.value[idx];
  clearPickablesByGroup(d.g);
  marksRoot?.remove(d.g);
  try {
    d.ext1?.material?.dispose?.();
    d.ext2?.material?.dispose?.();
    d.line?.material?.dispose?.();
    d.labelHit?.material?.dispose?.();
    d.cap1?.material?.dispose?.();
    d.cap2?.material?.dispose?.();
  } catch {}
  try { removeCss2DElement(d.label); } catch {}
  dims.value.splice(idx, 1);

  if (activeDimTargetUuid.value && !dims.value.some((x) => x.targetUuid === activeDimTargetUuid.value)) {
    activeDimTargetUuid.value = '';
  }
  requestMarksRefresh();
}

/** 定位 */
function focusMark(worldPoint) {
  if (!worldPoint || !controls || !camera) return;
  const oldTarget = controls.target.clone();
  const dir = camera.position.clone().sub(oldTarget).normalize();
  const dist = camera.position.distanceTo(oldTarget);

  controls.target.copy(worldPoint);
  camera.position.copy(worldPoint.clone().addScaledVector(dir, dist));
  controls.update();
  requestMarksRefresh();
}

/** ====== 点击分发：先处理 label 编辑，再走工具/选取 ====== */
async function handleLabelEditIfNeeded(e) {
  const mk = pickMarkHit(e);
  if (!mk?.meta) return false;

  if (mk.meta.type === 'measure' && mk.meta.role === 'label') {
    await editMeasure(mk.meta.id);
    return true;
  }
  if (mk.meta.type === 'dim' && mk.meta.role === 'label') {
    await editDim(mk.meta.id);
    return true;
  }
  if (mk.meta.type === 'note' && mk.meta.role === 'p') {
    await editNote(mk.meta.id);
    return true;
  }

  return false;
}

function setSelectedFromPick(e) {
  if (!props.enablePick || !currentRoot) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pickMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pickMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  pickRaycaster.setFromCamera(pickMouse, camera);
  const hits = pickRaycaster.intersectObject(currentRoot, true);
  const hit = hits.find((h) => h.object && h.object.isMesh);
  if (hit?.object) setSelected(hit.object);
  else setSelected(null);
}

async function handleToolClick(e) {
  if (await handleLabelEditIfNeeded(e)) return;

  const hit = pickHitOnModel(e);
  if (!hit) return;

  if (toolMode.value === 'measure') await onMeasureClick(hit);
  else if (toolMode.value === 'note') await onNoteClick(hit);
  else if (toolMode.value === 'dim') {
    setSelected(hit.mesh);
    createDimsForMesh(hit.mesh);
    sideTab.value = 'detail';
  }
}

/** ✅ 拖拽：note 点位 + measure 端点；hover 改鼠标样式 */
const dragState = reactive({
  active: false,
  moved: false,
  kind: '',
  id: '',
  role: '',
  startX: 0,
  startY: 0,
  pointerId: -1,
});

function bindClickPick() {
  const el = renderer.domElement;

  let downPos = null;
  let dragRAF = 0;
  let lastEvt = null;

  function applyCursor(meta) {
    if (!el) return;
    if (dragState.active) { el.style.cursor = 'grabbing'; return; }
    if (!meta) { el.style.cursor = ''; return; }
    if (meta.draggable) el.style.cursor = 'grab';
    else el.style.cursor = 'pointer';
  }

  let hoverRAF = 0;
  let hoverEvt = null;
  const onHover = (e) => {
    hoverEvt = e;
    if (hoverRAF) return;
    hoverRAF = requestAnimationFrame(() => {
      hoverRAF = 0;
      const mk = pickMarkHit(hoverEvt);
      applyCursor(mk?.meta || null);
    });
  };

  const onDown = (e) => {
    if (e.button !== 0) return;
    downPos = { x: e.clientX, y: e.clientY };

    const mk = pickMarkHit(e);

    if (mk?.meta?.type === 'note' && mk.meta.role === 'p' && mk.meta.draggable) {
      dragState.active = true;
      dragState.moved = false;
      dragState.kind = 'note';
      dragState.id = mk.meta.id;
      dragState.role = 'p';
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.pointerId = e.pointerId ?? -1;

      try { el.setPointerCapture?.(e.pointerId); } catch {}
      controls.enabled = false;
      applyCursor(mk.meta);
      return;
    }

    if (mk?.meta?.type === 'measure' && (mk.meta.role === 'a' || mk.meta.role === 'b') && mk.meta.draggable) {
      dragState.active = true;
      dragState.moved = false;
      dragState.kind = 'measure';
      dragState.id = mk.meta.id;
      dragState.role = mk.meta.role;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.pointerId = e.pointerId ?? -1;

      try { el.setPointerCapture?.(e.pointerId); } catch {}
      controls.enabled = false;
      applyCursor(mk.meta);
      return;
    }
  };

  const onMove = (e) => {
    onHover(e);

    if (!dragState.active) {
      if (toolMode.value === 'measure' && measureDraft.a && measureDraft.line) {
        lastEvt = e;
        if (dragRAF) return;
        dragRAF = requestAnimationFrame(() => {
          dragRAF = 0;
          const hit = pickHitOnModel(lastEvt);
          if (!hit) return;
          measureDraft.lastHover = { uuid: hit.uuid, local: hit.local.clone(), localNormal: hit.localNormal.clone() };
          requestMarksRefresh();
          refreshAllMarksTransform();
        });
      }
      return;
    }

    const dx = Math.abs(e.clientX - dragState.startX);
    const dy = Math.abs(e.clientY - dragState.startY);
    if (dx > 2 || dy > 2) dragState.moved = true;

    lastEvt = e;
    if (dragRAF) return;
    dragRAF = requestAnimationFrame(() => {
      dragRAF = 0;
      if (!dragState.active) return;

      const hit = pickHitOnModel(lastEvt);
      if (!hit) return;

      if (dragState.kind === 'note') {
        const n = notes.value.find((x) => x.id === dragState.id);
        if (!n) return;
        n.anchor.uuid = hit.uuid;
        n.anchor.local = hit.local.clone();
        n.anchor.localNormal = hit.localNormal.clone();
        requestMarksRefresh();
        refreshAllMarksTransform();
        return;
      }

      if (dragState.kind === 'measure') {
        const m = measures.value.find((x) => x.id === dragState.id);
        if (!m) return;
        const newAnchor = { uuid: hit.uuid, local: hit.local.clone(), localNormal: hit.localNormal.clone() };
        if (dragState.role === 'a') m.a = newAnchor;
        else m.b = newAnchor;
        requestMarksRefresh();
        refreshAllMarksTransform();
        return;
      }
    });
  };

  const onUp = async (e) => {
    if (e.button !== 0 || !downPos) return;

    const dx = Math.abs(e.clientX - downPos.x);
    const dy = Math.abs(e.clientY - downPos.y);
    downPos = null;

    if (dragState.active) {
      const wasMoved = dragState.moved;
      const kind = dragState.kind;
      const id = dragState.id;
      const pid = dragState.pointerId;

      dragState.active = false;
      dragState.moved = false;
      dragState.kind = '';
      dragState.id = '';
      dragState.role = '';
      dragState.pointerId = -1;

      try { if (pid !== -1) el.releasePointerCapture?.(pid); } catch {}
      controls.enabled = true;
      applyCursor(null);

      if (!wasMoved) {
        if (kind === 'note') await editNote(id);
      }
      return;
    }

    if (dx <= 6 && dy <= 6) {
      if (toolMode.value === 'pick') {
        if (await handleLabelEditIfNeeded(e)) return;
        setSelectedFromPick(e);
        sideTab.value = 'detail';
      } else {
        await handleToolClick(e);
      }
    }
  };

  const onCancel = () => {
    if (dragState.active) {
      dragState.active = false;
      dragState.moved = false;
      dragState.kind = '';
      dragState.id = '';
      dragState.role = '';
      dragState.pointerId = -1;
      controls.enabled = true;
      applyCursor(null);
    }
  };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onCancel);
  el.addEventListener('pointerleave', () => applyCursor(null));

  return () => {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onCancel);
    el.removeEventListener('pointerleave', () => applyCursor(null));
  };
}

let unbindPick = null;

/** ✅ 列表点击：用 key/partName/jointPartNameTB 联动 mesh */
function selectFromList(item) {
  if (!currentRoot) return;
  const candidates = [item?.key, item?.jointPartNameTB, item?.partName].filter(Boolean).map(normKey);
  if (!candidates.length) return;

  let hitMesh = null;
  currentRoot.traverse((o) => {
    if (hitMesh) return;
    if (!o?.isMesh) return;
    const n1 = normKey(o.userData?.originalName);
    const n2 = normKey(o.name);
    if (candidates.includes(n1) || candidates.includes(n2)) hitMesh = o;
  });

  if (hitMesh) {
    setSelected(hitMesh);
    frameObject(hitMesh, 1.15);
    sideTab.value = 'detail';
    if (toolMode.value === 'dim') createDimsForMesh(hitMesh);
  }
}

/** ====== 透明框线 / 爆炸 / 隔离 ====== */
function stashOriginalMaterialForStyle(mesh) {
  if (!mesh?.isMesh) return;
  if (!mesh.userData.__styleOrigMat) mesh.userData.__styleOrigMat = mesh.material;
}
function restoreStyleMaterials(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (originalMaterialMap.has(obj)) {
      try { clearHighlight(obj); } catch {}
    }
    if (obj.userData.__styleOrigMat) {
      const cur = obj.material;
      const mats = Array.isArray(cur) ? cur : [cur];
      mats.forEach((m) => m?.dispose?.());
      obj.material = obj.userData.__styleOrigMat;
      delete obj.userData.__styleOrigMat;
    }
  });
}
function clearEdgeLines(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const toRemove = [];
    obj.children?.forEach((c) => { if (c?.isLineSegments && c.name === '__edges__') toRemove.push(c); });
    toRemove.forEach((c) => {
      obj.remove(c);
      c.geometry?.dispose?.();
      c.material?.dispose?.();
    });
  });
}

/** ✅ 更稳：重复进入 wire 时先 dispose 当前替换材质，避免累计泄露 */
function disposeCurrentMaterialIfStyled(obj) {
  if (!obj?.isMesh) return;
  if (!obj.userData.__styleOrigMat) return; // 没有样式缓存，说明没走过 wire
  const orig = obj.userData.__styleOrigMat;
  const cur = obj.material;
  if (cur === orig) return;

  const mats = Array.isArray(cur) ? cur : [cur];
  mats.forEach((m) => m?.dispose?.());
}

function applyWireStyle(root, opacity, thresholdDeg) {
  if (!root) return;
  clearEdgeLines(root);

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    // ✅ 如果之前已经在 wire/styled 状态，先 dispose 当前材质再替换
    if (obj.userData.__styleOrigMat) {
      disposeCurrentMaterialIfStyled(obj);
    } else {
      stashOriginalMaterialForStyle(obj);
    }

    const baseMat = obj.userData.__styleOrigMat || obj.material;

    const mat = new THREE.MeshStandardMaterial({
      color: baseMat?.color?.clone?.() ?? new THREE.Color(0xffffff),
      map: baseMat?.map ?? null,
      transparent: true,
      opacity,
      depthWrite: false,
      metalness: 0.05,
      roughness: 0.55,
    });
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 1;
    mat.polygonOffsetUnits = 1;
    if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;

    obj.material = mat;

    const edges = new THREE.EdgesGeometry(obj.geometry, thresholdDeg);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0b1220,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: true,
    });
    const lines = new THREE.LineSegments(edges, lineMat);
    lines.name = '__edges__';
    lines.renderOrder = 2;
    obj.renderOrder = 1;
    obj.add(lines);
  });
}

function prepareExplodeData(root) {
  if (!root) return;
  root.updateMatrixWorld(true);

  const modelBox = new THREE.Box3().setFromObject(root);
  const modelCenter = new THREE.Vector3();
  modelBox.getCenter(modelCenter);

  const tmpBox = new THREE.Box3();
  const partCenter = new THREE.Vector3();

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.matrixAutoUpdate = true;
    if (!obj.userData.__basePos) obj.userData.__basePos = obj.position.clone();

    tmpBox.setFromObject(obj);
    tmpBox.getCenter(partCenter);

    const dir = new THREE.Vector3().subVectors(partCenter, modelCenter);
    if (dir.lengthSq() < 1e-8) dir.set(1, 0, 0);
    dir.normalize();
    obj.userData.__explodeDir = dir;
  });
}
function setExplode(root, factor) {
  if (!root) return;

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const diag = size.length() || 1;
  const strength = diag * 0.35;

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const base = obj.userData.__basePos;
    const dir = obj.userData.__explodeDir;
    if (!base || !dir) return;
    obj.position.copy(base).addScaledVector(dir, strength * factor);
  });

  root.updateMatrixWorld(true);
  if (selectedMesh) updateSelectedInfo(selectedMesh);

  requestMarksRefresh();
}

function applyIsolateVisibility() {
  if (!currentRoot) return;
  if (!isolateSelected.value || !selectedMesh) {
    currentRoot.traverse((obj) => (obj.visible = true));
    return;
  }

  currentRoot.traverse((obj) => (obj.visible = false));
  let p = selectedMesh;
  while (p) {
    p.visible = true;
    p = p.parent;
    if (p === currentRoot) { p.visible = true; break; }
  }
  selectedMesh.traverse((obj) => (obj.visible = true));
  requestMarksRefresh();
}

/** ✅ 默认蓝色（PBR 真实质感 + 尽量贴近 hex） */
function applyModelBaseBluePBR(root, hex = '#0e0362') {
  if (!root) return;
  const blue = new THREE.Color(hex);

  root.traverse((obj) => {
    if (!obj?.isMesh) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (!m) return;

      // ✅ 让 baseColor 更贴近 hex：关闭“底色贴图”
      if ('map' in m) m.map = null;

      if (m.color) m.color.copy(blue);

      // ✅ 稳定材质参数（避免灰/闷）
      if ('metalness' in m) m.metalness = 0.08;
      if ('roughness' in m) m.roughness = 0.42;

      // ✅ 避免 vertexColors 把颜色再乘一次导致“脏”
      if ('vertexColors' in m) m.vertexColors = false;

      m.needsUpdate = true;
    });
  });
}

function setMode(next) {
  const prev = mode.value;
  mode.value = next;

  if (next !== 'explode') {
    preExplodeMode.value = next; // ✅ 记录进入爆炸前的风格
  }

  if (!currentRoot) return;

  clearAllHighlights();

  if (next === 'normal') {
    clearEdgeLines(currentRoot);
    restoreStyleMaterials(currentRoot);
    setExplode(currentRoot, 0);
    explodeFactor.value = 0;
    if (mixer) mixer.timeScale = 1;
  }

  if (next === 'wire') {
    setExplode(currentRoot, 0);
    explodeFactor.value = 0;
    if (mixer) mixer.timeScale = 1;
    applyWireStyle(currentRoot, wireOpacity.value, edgeThreshold.value);
  }

  if (next === 'explode') {
    // ✅ 爆炸保持进入前风格（如果之前是 wire，爆炸也 wire）
    const style = preExplodeMode.value === 'wire' ? 'wire' : 'normal';
    if (style === 'wire') {
      applyWireStyle(currentRoot, wireOpacity.value, edgeThreshold.value);
    } else {
      clearEdgeLines(currentRoot);
      restoreStyleMaterials(currentRoot);
    }

    if (mixer) mixer.timeScale = 0;
    if (explodeFactor.value === 0) explodeFactor.value = 200;
    prepareExplodeData(currentRoot);
    setExplode(currentRoot, explodeFactor.value);
  }

  if (isolateSelected.value) applyIsolateVisibility();
  requestMarksRefresh();
}

function toggleIsolate() {
  isolateSelected.value = !isolateSelected.value;
  applyIsolateVisibility();
  requestMarksRefresh();
}

/** ✅ Environment：PBR 不闷灰的关键 */
function applyEnvironment() {
  if (!renderer || !scene) return;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmrem.dispose();
  } catch (e) {
    console.warn('[ThreeViewer] applyEnvironment failed:', e);
  }
}

/** 初始化 */
let unbindControlsChange = null;

function init() {
  scene = new THREE.Scene();
  scene.background = null;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;

  camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 20000);
  camera.position.set(2.5, 2, 4);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    logarithmicDepthBuffer: false,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ✅ 更保色的 toneMapping（尽量贴近 hex）
  renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  renderer.shadowMap.enabled = true;

  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.zIndex = '1';

  container.value.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  labelRenderer.domElement.style.zIndex = '2';
  container.value.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 1.0;
  controls.panSpeed = 0.8;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI;
  controls.enablePan = true;

  const onCtlChange = () => requestMarksRefresh();
  controls.addEventListener('change', onCtlChange);
  unbindControlsChange = () => controls.removeEventListener('change', onCtlChange);

  // ✅ 环境反射：PBR 质感+保色关键
  applyEnvironment();

  // ✅ 灯光稍微补足
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1.0);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  scene.add(dirLight);

  marksRoot = new THREE.Group();
  marksRoot.name = '__marks_root__';
  scene.add(marksRoot);

  loadModel(props.modelUrl, props.resourcePath, props.crossOrigin);

  if (!onDblClick) bindDoubleClickFocus();
  if (!unbindPick) unbindPick = bindClickPick();

  onKeydown = (e) => {
    if (e.key === 'Escape') {
      if (inputDlg.visible) cancelInput();
      else clearMeasureDraft();
    }
  };
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', onResize);
}

async function loadModel(inputUrl, resourcePath = '', crossOrigin = 'anonymous') {
  if (!inputUrl) return;

  const url = resolveProjectAssetUrl(inputUrl);
  const modelType = detectModelType(url);

  clearAllHighlights();
  hardClearAllMarks();
  isolateSelected.value = false;

  if (currentRoot) {
    scene.remove(currentRoot);
    disposeObject(currentRoot);
    currentRoot = null;
  }
  mixer?.stopAllAction?.();
  mixer = null;

  const manager = new THREE.LoadingManager();
  manager.addHandler(/\.tga$/i, new TGALoader(manager));

  if (props.enableURLModifier) {
    let baseForRel = resourcePath;
    if (!baseForRel) {
      try {
        const u = new URL(url, window.location.href);
        baseForRel = u.origin + u.pathname.replace(/\/[^/]*$/, '/');
      } catch {
        baseForRel = url;
      }
    }
    manager.setURLModifier((raw) => {
      const r = String(raw || '').replace(/\\/g, '/');
      if (isAbsoluteURL(r)) return r;
      return joinURL(baseForRel, r);
    });
  }

  try {
    let root = null;
    let animations = [];

    if (modelType === 'gltf') {
      const gltfLoader = new GLTFLoader(manager);
      gltfLoader.setCrossOrigin?.(crossOrigin);
      gltfLoader.setWithCredentials?.(!!props.withCredentials);

      const gltf = await gltfLoader.loadAsync(url);
      root = gltf.scene || (gltf.scenes && gltf.scenes[0]) || null;
      animations = gltf.animations || [];
      if (!root) throw new Error('GLTF/GLB 文件中未找到 scene');
    } else {
      const fbxLoader = new FBXLoader(manager);
      if (resourcePath) fbxLoader.setResourcePath(resourcePath);
      fbxLoader.setCrossOrigin?.(crossOrigin);
      fbxLoader.setWithCredentials?.(!!props.withCredentials);

      root = await fbxLoader.loadAsync(url);
      animations = root.animations || [];
    }

    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (!m) return;
          if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        });
      }
    });

    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    root.position.sub(center);

    const maxAxis = Math.max(size.x, size.y, size.z);
    if (maxAxis > 0) root.scale.multiplyScalar(1.5 / maxAxis);

    scene.add(root);
    currentRoot = root;

    // ✅ 默认统一蓝色（真实质感+尽量贴近 hex）
    applyModelBaseBluePBR(currentRoot, '#091e94');

    prepareExplodeData(currentRoot);

    if (animations && animations.length > 0) {
      mixer = new THREE.AnimationMixer(root);
      animations.forEach((clip) => mixer.clipAction(clip).play());
    }

    frameObject(root, 1.25);

    // ✅ 如果当前 UI 处于 explode，则按 preExplodeMode 决定爆炸风格；否则正常 setMode
    setMode(mode.value);

    requestMarksRefresh();
    refreshAllMarksTransform();
  } catch (err) {
    console.error('模型加载失败:', err);
  }
}

/** 资源释放 */
function disposeObject(object3D) {
  const disposed = new Set();
  const disposeMaterial = (m) => {
    if (!m || disposed.has(m)) return;
    disposed.add(m);
    for (const k in m) {
      const v = m[k];
      if (v && v.isTexture) v.dispose?.();
    }
    m.dispose?.();
  };

  object3D.traverse((obj) => {
    if (obj.isMesh) {
      obj.children?.forEach((c) => {
        if (c?.isLineSegments && c.name === '__edges__') {
          c.geometry?.dispose?.();
          c.material?.dispose?.();
        }
      });

      obj.geometry?.dispose?.();

      const orig = originalMaterialMap.get(obj);
      if (orig) (Array.isArray(orig) ? orig : [orig]).forEach(disposeMaterial);

      const styleOrig = obj.userData.__styleOrigMat;
      if (styleOrig) (Array.isArray(styleOrig) ? styleOrig : [styleOrig]).forEach(disposeMaterial);

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(disposeMaterial);
    }
  });

  originalMaterialMap.clear();
}

function onResize() {
  if (!container.value) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer?.setSize(width, height);

  requestMarksRefresh();
}

function animate() {
  const delta = clock.getDelta();
  controls.update();
  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
  labelRenderer?.render(scene, camera);

  const needContinuous = (mode.value === 'explode') || !!mixer || (toolMode.value === 'measure' && !!measureDraft.a) || dragState.active;
  if (needContinuous || marksDirty) {
    marksDirty = false;
    refreshAllMarksTransform();
  }

  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  init();
  animate();
});

watch(
  () => [props.modelUrl, props.modelType, props.resourcePath, props.crossOrigin, props.withCredentials, props.enableURLModifier],
  ([url, _type, resPath, xo]) => { loadModel(url, resPath, xo); },
);

watch(
  () => [props.enablePick, props.highlightColor, props.highlightEmissiveIntensity],
  () => { if (selectedMesh) applyHighlight(selectedMesh); },
);

watch(explodeFactor, () => {
  if (mode.value !== 'explode') return;
  if (!currentRoot) return;
  setExplode(currentRoot, explodeFactor.value);
  if (isolateSelected.value) applyIsolateVisibility();
  requestMarksRefresh();
});

/** ✅ 配置变化：点大小/文案距离/线宽 即时生效 */
watch(() => MARK_CFG.markerRadius, () => requestMarksRefresh());
watch(() => MARK_CFG.labelLiftWorld, () => requestMarksRefresh());
watch(() => MARK_CFG.lineWidthPx, () => requestMarksRefresh());
watch(() => MARK_CFG.dimOffsetWorld, () => refreshAllMarksTransform());

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onResize);
  if (onKeydown) window.removeEventListener('keydown', onKeydown);

  if (renderer?.domElement && onDblClick) renderer.domElement.removeEventListener('dblclick', onDblClick);
  unbindPick?.();
  unbindPick = null;

  unbindControlsChange?.();
  unbindControlsChange = null;

  mixer?.stopAllAction?.();
  clearAllHighlights();
  hardClearAllMarks();

  if (currentRoot) {
    disposeObject(currentRoot);
    currentRoot = null;
  }

  if (marksRoot) {
    scene?.remove(marksRoot);
    marksRoot = null;
  }

  // ✅ 释放 environment
  try {
    if (scene) scene.environment = null;
    envTexture?.dispose?.();
    envTexture = null;
  } catch {}

  renderer?.dispose?.();
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);

  if (labelRenderer?.domElement?.parentNode) labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
  labelRenderer = null;
});
</script>

<style scoped>
/* （保留你原来的 scoped 样式） */
.viewer-app {
  --bg: #f6f8fc;
  --panel: rgba(255, 255, 255, 0.9);
  --panel-solid: #ffffff;
  --line: rgba(15, 23, 42, 0.1);
  --text: #0f172a;
  --muted: rgba(15, 23, 42, 0.6);
  --muted2: rgba(15, 23, 42, 0.42);
  --shadow: 0 10px 30px rgba(2, 8, 23, 0.12);
  --shadow2: 0 6px 16px rgba(2, 8, 23, 0.1);

  --primary: #2b6cff;
  --primary-weak: rgba(43, 108, 255, 0.12);
  --danger: #ff3b30;
  --danger-weak: rgba(255, 59, 48, 0.12);
  --ok: #14b8a6;
  --ok-weak: rgba(20, 184, 166, 0.12);

  --topbar-h: 56px;
  --sidebar-w: 380px;
  --sidebar-w-min: 52px;
  --gap: 14px;

  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  background: radial-gradient(1200px 600px at 30% 0%, rgba(43, 108, 255, 0.12), transparent 60%),
    radial-gradient(900px 500px at 90% 20%, rgba(20, 184, 166, 0.1), transparent 55%), var(--bg);
  overflow: hidden;
}

.topbar {
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
}

.group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.65);
}
.group .label {
  font-size: 12px;
  color: var(--muted);
  padding: 0 6px;
  border-right: 1px solid var(--line);
  margin-right: 2px;
}
.seg {
  display: flex;
  gap: 6px;
  padding: 2px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
}
.seg-btn {
  border: 0;
  padding: 7px 10px;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  transition: 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.seg-btn .svg-icon { font-size: 16px; }
.seg-btn.active {
  background: rgba(255, 255, 255, 0.95);
  color: var(--text);
  box-shadow: 0 6px 14px rgba(2, 8, 23, 0.08);
  outline: 1px solid rgba(15, 23, 42, 0.06);
}

.btn {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.85);
  color: var(--text);
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn:hover { transform: translateY(-1px); box-shadow: var(--shadow2); }
.btn.primary { border-color: rgba(43, 108, 255, 0.25); background: var(--primary-weak); color: var(--primary); }
.btn.danger { border-color: rgba(255, 59, 48, 0.25); background: var(--danger-weak); color: var(--danger); }

.main {
  height: calc(100% - var(--topbar-h));
  display: grid;
  grid-template-columns: 1fr var(--sidebar-w);
  gap: var(--gap);
  padding: var(--gap);
  min-height: 0;
}

.viewer {
  position: relative;
  border-radius: 16px;
  background: linear-gradient(transparent 23px, rgba(15, 23, 42, 0.03) 24px),
    linear-gradient(90deg, transparent 23px, rgba(15, 23, 42, 0.03) 24px),
    radial-gradient(900px 450px at 30% 0%, rgba(43, 108, 255, 0.1), transparent 60%), #ffffff;
  background-size: 24px 24px, 24px 24px, auto, auto;
  box-shadow: var(--shadow);
  overflow: hidden;
  min-height: 0;
}
.viewer-root { position: absolute; inset: 0; }

.dock {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  padding: 10px;
  border-radius: 14px;
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow2);
  backdrop-filter: blur(10px);
  z-index: 5;
}
.dock-btn {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
  color: var(--muted);
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.dock-btn.active {
  border-color: rgba(43, 108, 255, 0.28);
  background: var(--primary-weak);
  color: var(--primary);
}

.param {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  width: min(860px, calc(100% - 24px));
  opacity: 0;
  pointer-events: none;
  transition: 0.18s ease;
  z-index: 6;
}
.viewer-app[data-param='1'] .param {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}
.param-card {
  border-radius: 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
  padding: 12px;
}
.param-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.param-title {
  font-weight: 800;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pill {
  font-weight: 700;
  color: var(--primary);
  background: var(--primary-weak);
  border: 1px solid rgba(43, 108, 255, 0.2);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
}
.param-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
.row {
  display: grid;
  grid-template-columns: 110px 1fr 90px;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 23, 42, 0.06);
}
.row label { font-size: 12px; color: var(--muted); display: flex; flex-direction: column; gap: 2px; }
.row label span { font-size: 11px; color: var(--muted2); }
.row input[type='range'] { width: 100%; }
.row input[type='number'] {
  width: 100%;
  padding: 8px 8px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.95);
  outline: none;
  font-size: 12px;
  color: var(--text);
}
.param-foot { margin-top: 10px; display: flex; justify-content: flex-end; gap: 10px; }
.param-tip { margin-top: 8px; font-size: 12px; color: var(--muted2); line-height: 1.35; }

.hud {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.65);
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow2);
  max-width: 70%;
  z-index: 5;
}
.kbd {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
.hud-text { font-size: 12px; color: rgba(255, 255, 255, 0.85); line-height: 1.35; }

.sidebar {
  border-radius: 16px;
  background: var(--panel-solid);
  box-shadow: var(--shadow);
  border: 1px solid var(--line);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px !important;
}
.sidebar-body { padding: 0px; overflow: auto; min-height: 0; }

.section-title {
  font-size: 12px;
  color: var(--muted2);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.muted { color: var(--muted2); }
.parts { display: flex; flex-direction: column; gap: 10px; }
.part {
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(15, 23, 42, 0.02);
  padding: 12px;
  cursor: pointer;
  transition: 0.15s ease;
}
.part:hover { transform: translateY(-1px); box-shadow: var(--shadow2); }
.part.active { background: rgba(43, 108, 255, 0.1); border-color: rgba(43, 108, 255, 0.22); }
.part-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.part-no { font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.part-w { font-size: 12px; color: var(--muted); font-weight: 800; white-space: nowrap; }
.part-btm { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; color: var(--muted); }
.tags { display: flex; gap: 6px; align-items: center; }
.chip {
  font-size: 11px;
  padding: 0px 10px;
  line-height: 20px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.75);
  color: var(--muted);
  white-space: nowrap;
}
.dimstr { white-space: nowrap; }

.detail-card {
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow2);
  padding: 12px;
}
.detail-head .name { font-weight: 900; font-size: 13px; }
.detail-head .meta { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
.kv3 { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 10px; }
.kv-item {
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(15, 23, 42, 0.02);
  line-height: 1.5;
}
.kv-item .t { font-size: 11px; color: var(--muted2); margin-bottom: 4px; }
.kv-item .v { font-weight: 900; font-size: 13px; }
.sep { height: 1px; background: rgba(15, 23, 42, 0.08); margin: 12px 0; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.box {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.72);
  line-height: 1.5;
}
.box .k { font-size: 12px; color: var(--muted2); }
.box .v { margin-top: 6px; font-size: 12px; color: rgba(15, 23, 42, 0.86); }
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono','Courier New', monospace;
  font-variant-numeric: tabular-nums;
}
.mrow {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(15, 23, 42, 0.02);
  margin-bottom: 8px;
}
.mleft { display: flex; gap: 10px; align-items: center; min-width: 0; }
.idx { font-weight: 900; font-size: 12px; color: var(--muted); width: 42px; flex: 0 0 auto; }
.val { font-weight: 900; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ops { display: flex; gap: 6px; align-items: center; }
.iconbtn {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.15s ease;
}
.iconbtn.primary { color: var(--primary); background: var(--primary-weak); border-color: rgba(43, 108, 255, 0.22); }
.iconbtn.danger { color: var(--danger); background: var(--danger-weak); border-color: rgba(255, 59, 48, 0.22); }
.empty, .empty2 { padding: 12px 0; font-size: 12px; color: var(--muted2); }

.dlg-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.22);
  display: grid;
  place-items: center;
  z-index: 50;
}
.dlg {
  width: 360px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}
.dlg-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px;
  background: linear-gradient(90deg, rgba(43, 108, 255, 0.12), rgba(20, 184, 166, 0.1));
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.dlg-title { font-weight: 900; color: rgba(15, 23, 42, 0.88); }
.dlg-x { border: none; background: transparent; cursor: pointer; font-size: 14px; color: var(--muted2); }
.dlg-bd { padding: 14px 14px 8px; }
.dlg-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  outline: none;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.98);
}
.dlg-input:focus { border-color: rgba(43, 108, 255, 0.45); box-shadow: 0 0 0 4px rgba(43, 108, 255, 0.1); }
.dlg-hint { margin-top: 8px; font-size: 12px; color: var(--muted); line-height: 1.4; }
.dlg-subhint { margin-top: 6px; font-size: 12px; color: var(--muted2); line-height: 1.4; }
.dlg-ft { padding: 12px 14px 14px; display: flex; justify-content: flex-end; gap: 10px; }
.dlg-btn { padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(43, 108, 255, 0.3); background: rgba(43, 108, 255, 0.14); cursor: pointer; font-size: 12px; }
.dlg-btn.ghost { border-color: rgba(15, 23, 42, 0.14); background: rgba(255, 255, 255, 0.92); }

@media (max-width: 1024px) {
  .param-grid { grid-template-columns: 1fr; }
  .grid2 { grid-template-columns: 1fr; }
}
</style>

<!-- ✅ CSS2D 标签全局样式 -->
<style>
/* ⚠️ 确保全局：html, body, #app { height: 100%; } */
.mark-label {
  position: relative;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.2;
  user-select: none;
  backdrop-filter: blur(6px);
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
  white-space: pre-line;
  padding: 6px 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(2, 8, 23, 0.12);
}
.mark-label.measure {
  color: rgba(239, 68, 68, 1);
  border-color: rgba(239, 68, 68, 0.3);
}
.mark-label.note {
  color: rgba(245, 158, 11, 1);
  border-color: rgba(245, 158, 11, 0.3);
}
.mark-label.dim {
  color: rgba(37, 99, 235, 1);
  border-color: rgba(37, 99, 235, 0.3);
}
</style>
