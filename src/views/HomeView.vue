<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { SEGMENT_LAYOUT } from './segmentLayout'
import ShipMilestonePanel from './ShipMilestonePanel.vue'


// ===================== 制造区域定义 =====================
const MANUFACTURING_ZONES: Record<string, { subZones: string[]; color?: number }> = {
  FORE: { subZones: ['FF1', 'FF2', 'FF3'] },
  FORE_MID: { subZones: ['FM1', 'FM2', 'FM3'] },
  MID: { subZones: ['MD1', 'MD2', 'MD3', 'MD4'], color: 0xfbbf24 },
  ENGINE: { subZones: ['ER1', 'ER2', 'ER3'] },
  AFT: { subZones: ['AF1', 'AF2', 'AF3'] },
  SUPERSTRUCTURE: { subZones: ['SS1', 'SS2', 'SS3'] },
}

const manufacturingZoneCards = [
  { key: 'FORE', name: '船艏区域', cls: 'fore' },
  { key: 'FORE_MID', name: '前舷区域', cls: 'foreMid' },
  { key: 'MID', name: '中舷区域', cls: 'mid' },
  { key: 'ENGINE', name: '机舱区域', cls: 'engine' },
  { key: 'AFT', name: '船艉区域', cls: 'aft' },
  { key: 'SUPERSTRUCTURE', name: '上层建筑', cls: 'super' },
]

const zoneKpiInit = () => Object.fromEntries(Object.keys(MANUFACTURING_ZONES).map((k) => [k, 0]))

const getManufacturingZoneKey = (cfg: any) => {
  const key = cfg?.mZone
  if (key && MANUFACTURING_ZONES[key]) return key
  const sub = cfg?.mSubZone
  if (sub) {
    for (const [k, v] of Object.entries(MANUFACTURING_ZONES)) {
      if (Array.isArray(v?.subZones) && v.subZones.includes(sub)) return k
    }
  }
  return null
}

// ===================== 文本/指标 =====================
const shipTitle = 'JR0300'

const extraKpi = reactive({
  installRate: '2.8个/天',
  weldPassRate: '98.5%',
  onDuty: '156人',
  buildCycle: '532天',
})

const milestones = reactive([
  { key: 'm1', name: '开工仪式', date: '2024-01-15', status: 'done' as const },
  { key: 'm2', name: '龙骨铺设', date: '2024-03-20', status: 'done' as const },
  { key: 'm3', name: '主船体合拢', date: '2024-07-10', status: 'done' as const },
  { key: 'm4', name: '上层建筑搭载', date: '2024-09-01', status: 'current' as const },
  { key: 'm5', name: '下水仪式', date: '2025-03-15', status: 'todo' as const },
  { key: 'm6', name: '系泊试验', date: '2025-05-20', status: 'todo' as const },
  { key: 'm7', name: '交付使用', date: '2025-06-30', status: 'todo' as const },
])

// ===================== 颜色常量 =====================
// 柔和工业色系 - 平衡的饱和度
const COLORS = {
  ZONE: {
    A: '#0ea5e9',          // 天蓝
    B: '#3b82f6',          // 蓝
    E: '#facc15',          // 黄
    F: '#84cc16',          // 绿
    S: '#10b981',          // 青绿
    FORE: '#e11d48',       // 红 - 船艏
    FORE_MID: '#f472b6',   // 粉 - 前舷
    MID: '#fb923c',        // 橙 - 中舷
    ENGINE: '#facc15',     // 黄 - 机舱
    AFT: '#84cc16',        // 绿 - 船艉
    SUPERSTRUCTURE: '#10b981', // 青绿 - 上建
    DEFAULT: '#0ea5e9',
  } as Record<string, string>,
  STATUS: {
    MISSING: '#f87171',
    IN_PROGRESS_LIGHT: '#fde047',
    IN_PROGRESS_DEEP: '#fb923c',
    DONE_GREEN: '#2dd4bf',
  },
}

const ZONE_COLORS: Record<string, string> = {
  fore: '#e11d48',
  foreMid: '#f472b6',
  mid: '#fb923c',
  engine: '#facc15',
  aft: '#84cc16',
  super: '#10b981',
}

// ===================== 阈值/发光 =====================
const THRESHOLDS = { MISSING: 20, DONE: 80 }
const EMISSIVE = { BASE: 0.06, HOVER_BOOST: 0.12, HOVER_MAX: 0.26 }

// ===================== 推演 =====================
const SIM = { days: 90, msPerDay: 260 }

const simIndex = ref(0)
const simPlaying = ref(false)
let simTimer = 0

const simStartDate = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

const simDateText = computed(() => {
  const d = new Date(simStartDate.getTime())
  d.setDate(d.getDate() + simIndex.value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
})

const SHIP = { length: 180, width: 30.8, height: 13.5, scale: 0.05 }

// ===================== Vue 状态 =====================
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapRef = ref<HTMLDivElement | null>(null)
const viewerContainerRef = ref<HTMLDivElement | null>(null)

const loading = ref(true)
const currentView = ref<'complete' | 'progress'>('complete')
const selected = ref<any>(null)

const kpi = reactive({
  totalCount: 0,
  overallProgress: 0,
  installedCount: 0,
  remainingCount: 0,
  zones: zoneKpiInit() as Record<string, number>,
})

// ===================== Three Runtime =====================
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let rafId = 0
let resizeObserver: ResizeObserver | null = null

let waterPlane: THREE.Mesh | null = null
let gridHelper: THREE.GridHelper | null = null

const segmentGroups = new Map<string, THREE.Group>()
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let lastHoveredGroup: THREE.Group | null = null

// ===================== 生命周期 =====================
onMounted(async () => {
  await nextTick()
  initThree()
  buildScene()
  bindEvents()
  startLoop()
  setTimeout(() => (loading.value = false), 150)
})

onBeforeUnmount(() => {
  unbindEvents()
  stopLoop()
  disposeThree()
  if (simTimer) window.clearInterval(simTimer)
  simTimer = 0
})

// ===================== 稳定随机 =====================
function hashString(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const tunedZoneColorCache = new Map<string, THREE.Color>()
function tuneZoneColor(hex: string) {
  const cached = tunedZoneColorCache.get(hex)
  if (cached) return cached
  const base = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  // 轻微提升：对比度 + 饱和 + 提亮
  const contrast = 1.08
  const lift = 0.03
  const sBoost = 1.12
  const l = Math.min(1, Math.max(0, 0.5 + (hsl.l - 0.5) * contrast + lift))
  const s = Math.min(1, Math.max(0, hsl.s * sBoost))
  const tuned = new THREE.Color().setHSL(hsl.h, s, l)
  tunedZoneColorCache.set(hex, tuned)
  return tuned
}

function planForSegment(id: string) {
  const rnd = mulberry32(hashString('plan_' + id))
  const startDay = Math.floor(rnd() * 28)
  const duration = 18 + Math.floor(rnd() * 55)
  const endDay = Math.min(SIM.days, Math.max(startDay + 6, startDay + duration))
  return { startDay, endDay }
}

function progressAtDay(day: number, startDay: number, endDay: number) {
  if (day < startDay) return 0
  if (day >= endDay) return 100
  const span = Math.max(1, endDay - startDay)
  const r = (day - startDay) / span
  return 20 + 80 * r
}

function applySimulation(day: number) {
  segmentGroups.forEach((g) => {
    const { planStartDay, planEndDay } = g.userData
    g.userData.progress = progressAtDay(day, planStartDay, planEndDay)
  })
  updateViewAppearance()
  recomputeKpi()
  if (selected.value?.id && segmentGroups.has(selected.value.id)) {
    selected.value = { ...segmentGroups.get(selected.value.id)!.userData }
  }
}

function recomputeKpi() {
  let sum = 0, count = 0, installed = 0
  segmentGroups.forEach((g) => {
    const p = g.userData.progress || 0
    sum += p; count += 1
    if (p >= THRESHOLDS.MISSING) installed += 1
  })
  kpi.totalCount = count
  kpi.overallProgress = count ? Math.round(sum / count) : 0
  kpi.installedCount = installed
  kpi.remainingCount = Math.max(0, count - installed)
  updateZoneProgress()
}

watch(simIndex, (v) => applySimulation(v))

function toggleSimPlay() {
  simPlaying.value = !simPlaying.value
  if (simPlaying.value) {
    setView('progress')
    if (simTimer) window.clearInterval(simTimer)
    simTimer = window.setInterval(() => {
      if (simIndex.value >= SIM.days) simIndex.value = 0
      else simIndex.value += 1
    }, SIM.msPerDay)
  } else {
    if (simTimer) window.clearInterval(simTimer)
    simTimer = 0
  }
}

// ===================== Three 初始化 =====================
function initThree() {
  const canvas = canvasRef.value
  const wrap = canvasWrapRef.value
  if (!canvas || !wrap) return

  scene = new THREE.Scene()
  // 让背景由容器样式控制（保持 #e7e7e7 但不发白）
  scene.background = null
  // 关闭雾效，避免颜色被冲淡
  scene.fog = null

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.setClearAlpha(0)
  renderer.toneMapping = THREE.NoToneMapping  // 关闭色调映射，保持原色
  renderer.toneMappingExposure = 0.9
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.style.touchAction = 'none'

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableZoom = true
  controls.zoomSpeed = 0.9
  controls.enablePan = true
  controls.panSpeed = 0.85
  controls.rotateSpeed = 0.7
  controls.screenSpacePanning = true
  controls.maxPolarAngle = Math.PI * 0.6
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  }
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  }

  resizeObserver = new ResizeObserver(() => resizeToWrap())
  resizeObserver.observe(wrap)
  resizeToWrap()
}

function updateFogAfterFrame(maxDim: number) {
  if (!scene?.fog || !(scene.fog instanceof THREE.Fog)) return
  const near = Math.max(220, maxDim * 0.75)
  const far = Math.max(near + 900, camera.far * 0.92)
  scene.fog.near = near
  scene.fog.far = far
}

function buildScene() {
  addLights()
  createEnvironment()
  createWaterPlane()
  createAllSegments()
  applySimulation(simIndex.value)
  frameAll()
  updateViewAppearance()
}

function createEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()
  const envScene = new THREE.Scene()

  // 中性灰环境球 - 避免过亮
  const skyGeo = new THREE.SphereGeometry(100, 32, 16)
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xb0b0b0, side: THREE.BackSide })
  envScene.add(new THREE.Mesh(skyGeo, skyMat))

  // 柔和环境光
  envScene.add(new THREE.AmbientLight(0xffffff, 0.1))

  // 主光源
  const envLight = new THREE.DirectionalLight(0xffffff, 0.22)
  envLight.position.set(1, 1, 1)
  envScene.add(envLight)

  const envMap = pmremGenerator.fromScene(envScene, 0.04).texture
  scene.environment = envMap
  pmremGenerator.dispose()
}

function addLights() {
  const toRemove: THREE.Object3D[] = []
  scene.traverse((o) => { if ((o as any).isLight) toRemove.push(o) })
  toRemove.forEach((l) => scene.remove(l))

  // 主光源
  const key = new THREE.DirectionalLight(0xffffff, 0.85)
  key.position.set(80, 160, 120)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 800
  key.shadow.camera.left = -40
  key.shadow.camera.right = 40
  key.shadow.camera.top = 40
  key.shadow.camera.bottom = -40
  key.shadow.bias = -0.0005
  scene.add(key)

  // 补光
  const fill = new THREE.DirectionalLight(0xffffff, 0.28)
  fill.position.set(-120, 90, -80)
  scene.add(fill)

  // 轮廓光
  const rim = new THREE.DirectionalLight(0xffffff, 0.2)
  rim.position.set(-60, 80, 160)
  scene.add(rim)

  // 环境光
  scene.add(new THREE.AmbientLight(0xffffff, 0.28))

  // 半球光
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe7e7e7, 0.18))
}

function createWaterPlane() {
  const scale = SHIP.scale
  const L = SHIP.length * scale
  const B = SHIP.width * scale

  const geometry = new THREE.PlaneGeometry(L * 2, B * 3)
  const material = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    metalness: 0.1,
    roughness: 0.8,
    envMapIntensity: 0.15,
  })
  const water = new THREE.Mesh(geometry, material)
  water.rotation.x = -Math.PI / 2
  water.position.y = -SHIP.height * scale * 0.3
  water.receiveShadow = true
  water.renderOrder = -10
  waterPlane = water
  scene.add(water)

  const gridSize = Math.max(L, B) * 2.5
  const grid = new THREE.GridHelper(gridSize, 40, 0xc5c5c5, 0xd4d4d4)
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.5
  gridHelper = grid
  scene.add(grid)
}

function createAllSegments() {
  segmentGroups.forEach((g) => scene.remove(g))
  segmentGroups.clear()

  let sumProgress = 0, count = 0, installedCount = 0

  Object.keys(SEGMENT_LAYOUT).forEach((id) => {
    const cfg = (SEGMENT_LAYOUT as any)[id]
    if (!cfg) return

    const { startDay, endDay } = planForSegment(id)
    const progress = progressAtDay(simIndex.value, startDay, endDay)
    if (progress >= THRESHOLDS.MISSING) installedCount++
    sumProgress += progress
    count++

    const scale = SHIP.scale
    const w = cfg.width * scale
    const h = cfg.height * scale
    const d = cfg.depth * scale
    const x = cfg.x * scale
    const y = cfg.y * scale
    const z = cfg.z * scale

    const group = new THREE.Group()
    group.position.set(x, y, z)

    const BASE_SHRINK = 0.992
    const FILL_SHRINK = 0.985
    const baseGeo = new THREE.BoxGeometry(w * BASE_SHRINK, h * BASE_SHRINK, d * BASE_SHRINK)
    const fillGeo = new THREE.BoxGeometry(w * FILL_SHRINK, h * FILL_SHRINK, d * FILL_SHRINK)

    const mZoneKey = getManufacturingZoneKey(cfg)
    const zoneColor = COLORS.ZONE[mZoneKey || ''] || COLORS.ZONE[cfg.zone] || COLORS.ZONE.DEFAULT
    const tunedZoneColor = tuneZoneColor(zoneColor)

    // 柔和质感材质 - 适度金属感和粗糙度
    const baseMat = new THREE.MeshStandardMaterial({
      color: tunedZoneColor,
      emissive: tunedZoneColor,
      emissiveIntensity: EMISSIVE.BASE,
      metalness: 0.2,
      roughness: 0.5,
      envMapIntensity: 0.28,
    })

    const fillMat = new THREE.MeshStandardMaterial({
      color: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissive: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissiveIntensity: EMISSIVE.BASE,
      metalness: 0.2,
      roughness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      envMapIntensity: 0.28,
    })

    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    const fillMesh = new THREE.Mesh(fillGeo, fillMat)
    fillMesh.visible = false

    baseMesh.castShadow = true
    baseMesh.receiveShadow = true
    fillMesh.castShadow = true
    fillMesh.receiveShadow = true
    baseMesh.userData.__group = group
    fillMesh.userData.__group = group
    baseMesh.renderOrder = 1
    fillMesh.renderOrder = 2

    // 更深的边缘线增加立体感
    const edgeGeo = new THREE.EdgesGeometry(baseGeo, 15)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.25 })
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat)
    edgeLine.renderOrder = 3

    group.add(baseMesh)
    group.add(fillMesh)
    group.add(edgeLine)

    group.userData = {
      id, zone: cfg.zone, mZone: cfg.mZone, mSubZone: cfg.mSubZone,
      mZoneKey, progress, w, h, d, baseMesh, fillMesh,
      baseEmissiveIntensity: EMISSIVE.BASE,
      planStartDay: startDay, planEndDay: endDay,
    }

    scene.add(group)
    segmentGroups.set(id, group)
  })

  kpi.totalCount = count
  kpi.overallProgress = count ? Math.round(sumProgress / count) : 0
  kpi.installedCount = installedCount
  kpi.remainingCount = Math.max(0, count - installedCount)
  updateZoneProgress()
}

function updateZoneProgress() {
  const stats = Object.fromEntries(
    Object.keys(MANUFACTURING_ZONES).map((k) => [k, { sum: 0, c: 0 }]),
  )
  segmentGroups.forEach((g) => {
    const { mZoneKey, progress } = g.userData
    if (mZoneKey && stats[mZoneKey]) {
      stats[mZoneKey].sum += progress
      stats[mZoneKey].c += 1
    }
  })
  Object.keys(stats).forEach((z) => {
    kpi.zones[z] = stats[z].c ? Math.round(stats[z].sum / stats[z].c) : 0
  })
}

// ===================== 上色/视图策略 =====================
function setGroupEmissive(group: THREE.Group, intensity: number) {
  const { baseMesh, fillMesh } = group.userData
  baseMesh.material.emissiveIntensity = intensity
  fillMesh.material.emissiveIntensity = intensity
  group.userData.baseEmissiveIntensity = intensity
}

function applyZoneView(group: THREE.Group) {
  const { zone, mZoneKey, baseMesh, fillMesh } = group.userData
  const c = COLORS.ZONE[mZoneKey] || COLORS.ZONE[zone] || COLORS.ZONE.DEFAULT
  const tuned = tuneZoneColor(c)
  baseMesh.visible = true
  fillMesh.visible = false
  baseMesh.material.color.copy(tuned)
  baseMesh.material.emissive.copy(tuned)
  setGroupEmissive(group, EMISSIVE.BASE)
}

function applyProgressView(group: THREE.Group) {
  const { progress, w, baseMesh, fillMesh } = group.userData
  baseMesh.visible = true
  fillMesh.visible = false
  baseMesh.material.color.set(COLORS.STATUS.MISSING)
  baseMesh.material.emissive.set(COLORS.STATUS.MISSING)
  setGroupEmissive(group, EMISSIVE.BASE)

  if (progress >= THRESHOLDS.DONE) {
    baseMesh.material.color.set(COLORS.STATUS.DONE_GREEN)
    baseMesh.material.emissive.set(COLORS.STATUS.DONE_GREEN)
    fillMesh.visible = false
    return
  }

  if (progress >= THRESHOLDS.MISSING) {
    baseMesh.material.color.set(COLORS.STATUS.IN_PROGRESS_LIGHT)
    baseMesh.material.emissive.set(COLORS.STATUS.IN_PROGRESS_LIGHT)
    fillMesh.visible = true
    fillMesh.material.color.set(COLORS.STATUS.IN_PROGRESS_DEEP)
    fillMesh.material.emissive.set(COLORS.STATUS.IN_PROGRESS_DEEP)
    const frac = Math.min(0.999, Math.max(0.001, progress / 100))
    fillMesh.scale.set(frac, 1, 1)
    fillMesh.position.set(-w * 0.5 + w * frac * 0.5, 0, 0)
  }
}

function setView(v: 'complete' | 'progress') {
  currentView.value = v
  if (v === 'complete' && simPlaying.value) {
    simPlaying.value = false
    if (simTimer) window.clearInterval(simTimer)
    simTimer = 0
    simIndex.value = 0
    applySimulation(0)
  }
  updateViewAppearance()
}

function updateViewAppearance() {
  clearHover()
  segmentGroups.forEach((g) => {
    if (currentView.value === 'complete') {
      g.visible = true
      applyZoneView(g)
    } else {
      g.visible = true
      applyProgressView(g)
    }
  })
}

// ===================== 相机 =====================
function positionEnvironment(center: THREE.Vector3) {
  if (waterPlane) {
    waterPlane.position.x = center.x
    waterPlane.position.z = center.z
  }
  if (gridHelper) {
    gridHelper.position.x = center.x
    gridHelper.position.z = center.z
  }
}

function frameAll(padding = 1.15) {
  const box = new THREE.Box3()
  segmentGroups.forEach((g) => g.visible && box.expandByObject(g))
  if (box.isEmpty()) return

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const vFov = THREE.MathUtils.degToRad(camera.fov)
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
  const height = Math.max(0.001, size.y)
  const width = Math.max(0.001, Math.max(size.x, size.z))
  const distHeight = (height * 0.5) / Math.tan(vFov / 2)
  const distWidth = (width * 0.5) / Math.tan(hFov / 2)
  const desired = padding * Math.max(distHeight, distWidth)

  const dir = new THREE.Vector3(1, 0.55, 1).normalize()
  controls.target.copy(center)
  camera.position.copy(center.clone().add(dir.multiplyScalar(desired)))
  camera.near = Math.max(0.05, desired / 60)
  camera.far = Math.max(200, desired * 20)
  camera.updateProjectionMatrix()

  controls.minDistance = Math.max(0.3, desired * 0.25)
  controls.maxDistance = Math.max(50, desired * 6)
  controls.update()
  updateFogAfterFrame(maxDim)
  positionEnvironment(center)
}

const isFullscreen = ref(false)
function toggleFullscreen() {
  const el = viewerContainerRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen().then(() => { isFullscreen.value = true })
  } else {
    document.exitFullscreen().then(() => { isFullscreen.value = false })
  }
}
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ===================== 交互 =====================
function bindEvents() {
  window.addEventListener('keydown', onKeyDown)
  const el = canvasWrapRef.value
  if (!el) return
  el.addEventListener('mousemove', onMouseMove, { passive: true })
  el.addEventListener('mouseleave', onMouseLeave, { passive: true })
  el.addEventListener('click', onClick)
  document.addEventListener('fullscreenchange', onFullscreenChange)
}

function unbindEvents() {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  window.removeEventListener('keydown', onKeyDown)
  const el = canvasWrapRef.value
  if (el) {
    el.removeEventListener('mousemove', onMouseMove)
    el.removeEventListener('mouseleave', onMouseLeave)
    el.removeEventListener('click', onClick)
  }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === '1') setView('complete')
  if (e.key === '2') setView('progress')
  if (e.key === 'r' || e.key === 'R' || e.key === '0') frameAll()
}

function getPickables() {
  const arr: THREE.Mesh[] = []
  segmentGroups.forEach((g) => {
    if (!g.visible) return
    const { baseMesh, fillMesh } = g.userData
    if (baseMesh.visible) arr.push(baseMesh)
    if (fillMesh.visible) arr.push(fillMesh)
  })
  return arr
}

function onMouseMove(e: MouseEvent) {
  const wrap = canvasWrapRef.value
  if (!wrap) return
  const rect = wrap.getBoundingClientRect()
  mouse.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(mouse, camera)
  const hit = raycaster.intersectObjects(getPickables(), false)
  if (!hit.length) { clearHover(); return }
  const obj = hit[0].object
  const group = obj?.userData?.__group
  if (!group) return
  if (group !== lastHoveredGroup) {
    clearHover()
    lastHoveredGroup = group
    setGroupEmissive(group, Math.min(EMISSIVE.HOVER_MAX, (group.userData.baseEmissiveIntensity || EMISSIVE.BASE) + EMISSIVE.HOVER_BOOST))
  }
}

function onMouseLeave() { clearHover() }

function clearHover() {
  if (lastHoveredGroup) {
    setGroupEmissive(lastHoveredGroup, lastHoveredGroup.userData.baseEmissiveIntensity || EMISSIVE.BASE)
    lastHoveredGroup = null
  }
}

function onClick() {
  if (!lastHoveredGroup) return
  selected.value = { ...lastHoveredGroup.userData }
  focusGroup(lastHoveredGroup)
}

function focusGroup(group: THREE.Group) {
  const box = new THREE.Box3().setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  const offset = camera.position.clone().sub(controls.target)
  controls.target.copy(center)
  camera.position.copy(center.clone().add(offset))
  camera.updateProjectionMatrix()
  controls.update()
}

// ===================== 渲染循环 =====================
function startLoop() {
  const loop = () => {
    rafId = requestAnimationFrame(loop)
    controls?.update()
    renderer?.render(scene, camera)
  }
  loop()
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function resizeToWrap() {
  const wrap = canvasWrapRef.value
  if (!wrap || !renderer || !camera) return
  const rect = wrap.getBoundingClientRect()
  const w = Math.max(1, Math.floor(rect.width))
  const h = Math.max(1, Math.floor(rect.height))
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function disposeThree() {
  try {
    segmentGroups.forEach((g) => {
      g.traverse((obj) => {
        if ((obj as any).isMesh) {
          ;(obj as any).geometry?.dispose?.()
          ;(obj as any).material?.dispose?.()
        }
      })
    })
    renderer?.dispose?.()
    controls?.dispose?.()
  } catch {}
}

// ===================== helpers =====================
function getZoneName(zone: string) {
  return ({ A: '船艏区域', B: '船底区域', E: '机舱区域', F: '船艉区域', S: '舷侧区域' } as any)[zone] || zone
}
function getStatusText(p: number) {
  if (p < THRESHOLDS.MISSING) return '未开工'
  if (p < THRESHOLDS.DONE) return '进行中'
  return '已完工'
}

const progressRingDash = computed(() => {
  const r = 34
  const c = 2 * Math.PI * r
  return { array: c, offset: c * (1 - kpi.overallProgress / 100) }
})
</script>

<template>
  <div class="home-theme mx-auto h-full w-full max-w-[1600px] overflow-auto p-5 space-y-5 bg-background text-foreground">
    <!-- 主体：3D + 右侧面板 -->
    <div class="grid grid-cols-[1fr_300px] gap-5" style="min-height: 620px">

      <!-- 3D 查看器 -->
      <div ref="viewerContainerRef" class="relative rounded-2xl overflow-hidden flex flex-col">

        <!-- Canvas 区域 -->
        <div ref="canvasWrapRef" class="three-stage flex-1 relative min-h-0" @contextmenu.prevent>
          <canvas ref="canvasRef" class="w-full h-full block" />

          <!-- 顶部浮层工具栏 -->
          <div class="overlay-layer absolute top-0 inset-x-0 p-4 flex items-start justify-between pointer-events-none">
            <!-- 左上：标题 -->
            <div class="pointer-events-auto">
              <div class="clay-panel px-4 py-2.5 flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-[#e76f51] shadow-[0_0_8px_rgba(0,217,165,0.7)] animate-pulse" />
                <h2 class="text-[15px] font-semibold text-[#555] tracking-tight">{{ shipTitle }}</h2>
                <div class="h-4 w-px bg-[#c5c5c5]" />
                <span class="text-[13px] text-[#777] tabular-nums font-medium">{{ kpi.totalCount }} 分段</span>
              </div>
            </div>

            <!-- 右上：视图切换 + 全屏 -->
            <div class="pointer-events-auto flex items-center gap-3">
              <div class="clay-panel p-1.5 flex items-center gap-1">
                <button
                  v-for="v in [
                    { key: 'complete' as const, label: '船体概览', icon: 'M2.25 12l8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
                    { key: 'progress' as const, label: '建造进度', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z' },
                  ]"
                  :key="v.key"
                  class="clay-btn-tab flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium transition-all duration-300"
                  :class="currentView === v.key ? 'clay-btn-tab--active' : ''"
                  @click="setView(v.key)"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="v.icon" />
                  </svg>
                  {{ v.label }}
                </button>
              </div>
              <button
                class="clay-btn-icon w-10 h-10 flex items-center justify-center transition-all duration-300"
                :class="isFullscreen ? 'clay-btn-icon--active' : ''"
                :title="isFullscreen ? '退出全屏' : '全屏显示'"
                @click="toggleFullscreen"
              >
                <svg v-if="!isFullscreen" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 左下：操作提示 -->
          <div class="overlay-layer absolute bottom-4 left-4 pointer-events-none">
            <div class="flex items-center gap-2 select-none">
              <div class="clay-hint flex items-center gap-1.5 px-2.5 py-1.5">
                <kbd class="clay-kbd">LMB</kbd>
                <span class="text-[11px] text-[#777]">旋转</span>
              </div>
              <div class="clay-hint flex items-center gap-1.5 px-2.5 py-1.5">
                <kbd class="clay-kbd">RMB</kbd>
                <span class="text-[11px] text-[#777]">平移</span>
              </div>
              <div class="clay-hint flex items-center gap-1.5 px-2.5 py-1.5">
                <kbd class="clay-kbd">Scroll</kbd>
                <span class="text-[11px] text-[#777]">缩放</span>
              </div>
            </div>
          </div>

          <!-- 右下：推演控制浮层 -->
          <div class="overlay-layer absolute bottom-4 right-4 pointer-events-auto">
            <div class="clay-panel px-4 py-3 w-[340px]">
              <div class="flex items-center gap-3">
                <button
                  class="clay-btn-play shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300"
                  :class="simPlaying ? 'clay-btn-play--active' : ''"
                  :title="simPlaying ? '暂停推演' : '播放推演'"
                  @click="toggleSimPlay"
                >
                  <svg v-if="!simPlaying" class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between mb-1.5">
                    <span class="text-[11px] text-[#888] font-medium uppercase tracking-wider">推演进度</span>
                    <div class="flex items-baseline gap-1.5">
                      <span class="text-[13px] font-semibold text-[#444] tabular-nums font-mono">{{ simDateText }}</span>
                      <span class="text-[11px] text-[#999] tabular-nums font-mono">D{{ simIndex }}/{{ SIM.days }}</span>
                    </div>
                  </div>
                  <div class="relative h-5 flex items-center">
                    <div class="clay-progress-track w-full">
                      <div
                        class="clay-progress-fill transition-all duration-200"
                        :class="simPlaying ? 'clay-progress-fill--active' : ''"
                        :style="{ width: (simIndex / SIM.days * 100) + '%' }"
                      />
                    </div>
                    <input
                      type="range"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      :min="0" :max="SIM.days" v-model.number="simIndex"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 全屏时叠加进度 -->
          <div v-if="isFullscreen" class="overlay-layer absolute top-24 left-4 pointer-events-none">
            <div class="clay-panel p-4">
              <div class="flex items-center gap-4">
                <div class="clay-progress-ring relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 80 80" class="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" stroke="#d4d4d4" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" stroke-linecap="round"
                      stroke="#e76f51"
                      class="transition-all duration-500"
                      :stroke-dasharray="progressRingDash.array" :stroke-dashoffset="progressRingDash.offset" />
                  </svg>
                  <span class="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[#444]">{{ kpi.overallProgress }}%</span>
                </div>
                <div class="space-y-1.5">
                  <div class="text-[14px] font-semibold text-[#444]">整体装配</div>
                  <div class="text-[12px] flex gap-4 text-[#666]">
                    <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#e76f51]" />{{ kpi.installedCount }} 已装</span>
                    <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#ff3366]" />{{ kpi.remainingCount }} 剩余</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="overlay-layer overlay-layer--top absolute inset-0 flex flex-col items-center justify-center bg-foreground/85 backdrop-blur-sm gap-3">
            <div class="w-10 h-10 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
            <span class="ui-body text-secondary/70 font-medium">加载 3D 场景...</span>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="space-y-3.5">
        <!-- 整体进度 -->
        <Card class="shadow-sm">
          <CardHeader class="ui-card-header relative z-10 flex-row items-center space-y-0 text-foreground">
            <svg class="ui-icon text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5z" />
            </svg>
            <span class="ui-title text-foreground">整体装配进度</span>
          </CardHeader>
          <CardContent class="ui-card-content ui-body flex-1 overflow-y-auto">
            <div class="flex items-center gap-4">
              <div class="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 80 80" class="h-full w-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" class="stroke-muted" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke-width="6"
                    stroke-linecap="round"
                    class="stroke-primary transition-all duration-500"
                    :stroke-dasharray="progressRingDash.array"
                    :stroke-dashoffset="progressRingDash.offset"
                  />
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{{ kpi.overallProgress }}%</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="ui-meta flex items-center gap-1.5 text-muted-foreground">
                    <span class="h-1.5 w-1.5 rounded-full bg-primary" />已安装
                  </span>
                  <span class="ui-body font-semibold tabular-nums">{{ kpi.installedCount }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="ui-meta flex items-center gap-1.5 text-muted-foreground">
                    <span class="h-1.5 w-1.5 rounded-full bg-secondary/70" />剩余
                  </span>
                  <span class="ui-body font-semibold tabular-nums">{{ kpi.remainingCount }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 区域进度 -->
        <Card class="shadow-sm">
          <CardHeader class="ui-card-header relative z-10 flex-row items-center space-y-0 text-foreground">
            <svg class="ui-icon text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25zM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25z" />
            </svg>
            <span class="ui-title text-foreground">区域进度</span>
          </CardHeader>
          <CardContent class="ui-card-content ui-body flex-1 overflow-y-auto">
            <div class="space-y-2.5">
              <div v-for="z in manufacturingZoneCards" :key="z.key">
                <div class="flex items-center justify-between mb-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-sm shrink-0" :style="{ background: ZONE_COLORS[z.cls] }" />
                    <span class="ui-meta text-muted-foreground">{{ z.name }}</span>
                  </div>
                  <span class="ui-meta font-semibold tabular-nums">{{ kpi.zones[z.key] }}%</span>
                </div>
                <div class="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    :style="{ width: kpi.zones[z.key] + '%', background: ZONE_COLORS[z.cls] }"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 选中分段 -->
        <Card class="shadow-sm">
          <CardHeader class="ui-card-header relative z-10 flex-row items-center space-y-0 text-foreground">
            <svg class="ui-icon text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
            <span class="ui-title text-foreground">选中总段</span>
          </CardHeader>
          <CardContent class="ui-card-content ui-body flex-1 overflow-y-auto">
            <template v-if="selected">
              <div class="flex items-center gap-2 mb-3">
                <span class="px-2 py-0.5 text-[11px] font-bold rounded bg-primary/10 text-primary font-mono">{{ selected.id }}</span>
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="{
                  'bg-primary/15 text-primary': selected.progress >= 80,
                  'bg-secondary/45 text-foreground': selected.progress >= 20 && selected.progress < 80,
                  'bg-destructive/15 text-destructive': selected.progress < 20,
                }">
                  {{ getStatusText(selected.progress) }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-2 rounded-lg bg-muted/50">
                  <div class="ui-micro text-muted-foreground mb-0.5">区域</div>
                  <div class="ui-meta font-semibold">{{ getZoneName(selected.zone) }}</div>
                </div>
                <div class="text-center p-2 rounded-lg bg-muted/50">
                  <div class="ui-micro text-muted-foreground mb-0.5">进度</div>
                  <div class="ui-meta font-semibold text-primary tabular-nums">{{ Math.round(selected.progress) }}%</div>
                </div>
                <div class="text-center p-2 rounded-lg bg-muted/50">
                  <div class="ui-micro text-muted-foreground mb-0.5">制造区</div>
                  <div class="ui-meta font-semibold">{{ selected.mZone || '-' }}</div>
                </div>
              </div>
            </template>
            <div v-else class="flex flex-col items-center justify-center py-5 text-muted-foreground/40">
              <svg class="w-7 h-7 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
              </svg>
              <span class="ui-meta">点击模型选择分段</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 底部里程碑 -->
    <ShipMilestonePanel :milestones="milestones" :extra-kpi="extraKpi" />
  </div>
</template>

<style scoped>
.home-theme {
  --background: 0 0% 100%;
  --foreground: 197 37% 24%;
  --card: 0 0% 100%;
  --card-foreground: 197 37% 24%;
  --primary: 173 58% 39%;
  --primary-foreground: 0 0% 100%;
  --secondary: 42 74% 66%;
  --secondary-foreground: 197 37% 24%;
  --muted: 0 0% 97%;
  --muted-foreground: 197 20% 35%;
  --accent: 27 87% 67%;
  --accent-foreground: 197 37% 24%;
  --destructive: 12 76% 61%;
  --destructive-foreground: 0 0% 100%;
  --border: 197 22% 85%;
}

.ui-card-header {
  padding: 10px 16px;
  gap: 8px;
}

.ui-card-content {
  padding: 12px;
}

.ui-icon {
  width: 20px;
  height: 20px;
}

.ui-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.ui-body {
  font-size: 13px;
  line-height: 1.5;
}

.ui-meta {
  font-size: 13px;
  line-height: 1.4;
}

.ui-micro {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.three-stage {
  background: #e7e7e7;
}

.three-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 120% at 70% 20%, rgba(255, 255, 255, 0.28), rgba(0, 0, 0, 0.12));
  pointer-events: none;
  z-index: 0;
}

.three-stage > canvas {
  position: relative;
  z-index: 1;
}

.overlay-layer {
  z-index: 2;
}

.overlay-layer--top {
  z-index: 3;
}

/* ===================== 液态玻璃样式 ===================== */

/* 基础面板 - 毛玻璃容器 */
.clay-panel {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.6) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
}

/* Tab 按钮 - 液态玻璃 */
.clay-btn-tab {
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.5) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: 14px;
  color: #666;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  outline: none;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.clay-btn-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: left 0.5s ease;
}

.clay-btn-tab:hover {
  color: #444;
  transform: translateY(-2px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 2px rgba(255, 255, 255, 1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.02);
}

.clay-btn-tab:hover::before {
  left: 100%;
}

.clay-btn-tab:active {
  transform: translateY(1px) scale(0.98);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.clay-btn-tab--active {
  background: linear-gradient(
    145deg,
    rgba(231, 111, 81, 0.2) 0%,
    rgba(231, 111, 81, 0.1) 100%
  );
  color: #e76f51;
  border-color: rgba(231, 111, 81, 0.4);
  box-shadow:
    0 4px 20px rgba(231, 111, 81, 0.2),
    0 2px 8px rgba(231, 111, 81, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(231, 111, 81, 0.1);
}

.clay-btn-tab--active:hover {
  transform: none;
  box-shadow:
    0 4px 24px rgba(231, 111, 81, 0.25),
    0 2px 8px rgba(231, 111, 81, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.9);
}

/* 图标按钮 - 液态玻璃 */
.clay-btn-icon {
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 255, 255, 0.5) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: 16px;
  color: #666;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 1);
  cursor: pointer;
  outline: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.clay-btn-icon:hover {
  color: #444;
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 1);
}

.clay-btn-icon:active {
  transform: translateY(1px) scale(0.98);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.clay-btn-icon--active {
  background: linear-gradient(
    145deg,
    rgba(231, 111, 81, 0.25) 0%,
    rgba(231, 111, 81, 0.1) 100%
  );
  color: #e76f51;
  border-color: rgba(231, 111, 81, 0.4);
  box-shadow:
    0 4px 20px rgba(231, 111, 81, 0.25),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
}

/* 播放/暂停按钮 - 液态水滴 */
.clay-btn-play {
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 240, 240, 0.7) 50%,
    rgba(255, 255, 255, 0.8) 100%
  );
  backdrop-filter: blur(8px);
  color: #666;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.06),
    inset 0 2px 3px rgba(255, 255, 255, 1),
    inset 0 -2px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  outline: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

.clay-btn-play::before {
  content: '';
  position: absolute;
  top: 10%;
  left: 15%;
  width: 35%;
  height: 25%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 50%;
  pointer-events: none;
}

.clay-btn-play:hover {
  color: #e76f51;
  transform: translateY(-4px) scale(1.08);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.1),
    0 0 0 4px rgba(231, 111, 81, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 1);
}

.clay-btn-play:active {
  transform: translateY(2px) scale(0.95);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 4px 8px rgba(0, 0, 0, 0.08);
}

.clay-btn-play--active {
  background: linear-gradient(
    145deg,
    #f4a261 0%,
    #e76f51 50%,
    #d45d42 100%
  );
  color: #fff;
  border-color: rgba(231, 111, 81, 0.6);
  box-shadow:
    0 8px 32px rgba(231, 111, 81, 0.4),
    0 4px 12px rgba(231, 111, 81, 0.3),
    0 0 0 4px rgba(231, 111, 81, 0.15),
    inset 0 2px 3px rgba(255, 255, 255, 0.4),
    inset 0 -2px 3px rgba(0, 0, 0, 0.1);
  animation: liquid-pulse 2s ease-in-out infinite;
}

.clay-btn-play--active::before {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0) 100%
  );
}

.clay-btn-play--active:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 12px 40px rgba(231, 111, 81, 0.5),
    0 6px 16px rgba(231, 111, 81, 0.35),
    0 0 0 6px rgba(231, 111, 81, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.5);
}

@keyframes liquid-pulse {
  0%, 100% {
    box-shadow:
      0 8px 32px rgba(231, 111, 81, 0.4),
      0 4px 12px rgba(231, 111, 81, 0.3),
      0 0 0 4px rgba(231, 111, 81, 0.15),
      inset 0 2px 3px rgba(255, 255, 255, 0.4),
      inset 0 -2px 3px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow:
      0 8px 40px rgba(231, 111, 81, 0.55),
      0 4px 16px rgba(231, 111, 81, 0.4),
      0 0 0 8px rgba(231, 111, 81, 0.1),
      inset 0 2px 3px rgba(255, 255, 255, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.08);
  }
}

/* 进度条轨道 - 玻璃凹槽 */
.clay-progress-track {
  height: 8px;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.06) 0%,
    rgba(255, 255, 255, 0.4) 100%
  );
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.08),
    0 1px 1px rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

/* 进度条填充 - 液态流动 */
.clay-progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    #a1a1aa 0%,
    #71717a 50%,
    #a1a1aa 100%
  );
  background-size: 200% 100%;
  border-radius: 8px;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.clay-progress-fill--active {
  background: linear-gradient(
    90deg,
    #f4a261 0%,
    #e76f51 25%,
    #d45d42 50%,
    #e76f51 75%,
    #f4a261 100%
  );
  background-size: 200% 100%;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.5),
    0 0 12px rgba(231, 111, 81, 0.4),
    0 2px 4px rgba(231, 111, 81, 0.2);
  animation: flow 2s linear infinite;
}

@keyframes flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* 提示框 - 微型玻璃 */
.clay-hint {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.75) 0%,
    rgba(255, 255, 255, 0.5) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.9);
}

/* 键盘按键 - 玻璃按键 */
.clay-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  padding: 3px 8px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #555;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(245, 245, 245, 0.7) 100%
  );
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
}

/* 进度环容器 - 玻璃圆环 */
.clay-progress-ring {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.3) 100%
  );
  backdrop-filter: blur(8px);
  border-radius: 50%;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 -1px 1px rgba(255, 255, 255, 0.8);
}
</style>
