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
  MID: { subZones: ['MD1', 'MD2', 'MD3', 'MD4'], color: 0x10b981 },
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
const COLORS = {
  ZONE: {
    A: '#2a9d8f',
    B: '#e9c46a',
    E: '#f4a261',
    F: '#e76f51',
    S: '#264653',
    FORE: '#2a9d8f',
    FORE_MID: '#3bb7a5',
    MID: '#e9c46a',
    ENGINE: '#f4a261',
    AFT: '#e76f51',
    SUPERSTRUCTURE: '#264653',
    DEFAULT: '#2a9d8f',
  } as Record<string, string>,
  STATUS: {
    MISSING: '#e76f51',
    IN_PROGRESS_LIGHT: '#e9c46a',
    IN_PROGRESS_DEEP: '#f4a261',
    DONE_GREEN: '#2a9d8f',
  },
}

const ZONE_COLORS: Record<string, string> = {
  fore: '#2a9d8f',
  foreMid: '#3bb7a5',
  mid: '#e9c46a',
  engine: '#f4a261',
  aft: '#e76f51',
  super: '#264653',
}

// ===================== 阈值/发光 =====================
const THRESHOLDS = { MISSING: 20, DONE: 80 }
const EMISSIVE = { BASE: 0.35, HOVER_BOOST: 0.3, HOVER_MAX: 0.7 }

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
  scene.background = new THREE.Color(0x18181b)
  scene.fog = new THREE.Fog(0x18181b, 1, 2)

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.setClearAlpha(0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.3
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.enableZoom = true
  controls.zoomSpeed = 1.0
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.maxPolarAngle = Math.PI / 2

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
  frameAll(0.8)
  updateViewAppearance()
}

function createEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()
  const envScene = new THREE.Scene()
  const skyGeo = new THREE.SphereGeometry(100, 32, 16)
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.BackSide })
  envScene.add(new THREE.Mesh(skyGeo, skyMat))
  envScene.add(new THREE.AmbientLight(0xd4d4d8, 0.3))
  const envLight = new THREE.DirectionalLight(0xfafafa, 0.55)
  envLight.position.set(1, 0.9, 1)
  envScene.add(envLight)
  const envMap = pmremGenerator.fromScene(envScene, 0.04).texture
  scene.environment = envMap
  pmremGenerator.dispose()
}

function addLights() {
  const toRemove: THREE.Object3D[] = []
  scene.traverse((o) => { if ((o as any).isLight) toRemove.push(o) })
  toRemove.forEach((l) => scene.remove(l))

  const key = new THREE.DirectionalLight(0xfafafa, 1.5)
  key.position.set(80, 160, 120)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 800
  key.shadow.camera.left = -40
  key.shadow.camera.right = 40
  key.shadow.camera.top = 40
  key.shadow.camera.bottom = -40
  key.shadow.bias = -0.001
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xd4d4d8, 0.5)
  fill.position.set(-120, 90, -80)
  scene.add(fill)

  const rim = new THREE.DirectionalLight(0xa1a1aa, 0.42)
  rim.position.set(-60, 80, 160)
  scene.add(rim)

  scene.add(new THREE.AmbientLight(0xa1a1aa, 0.45))
  scene.add(new THREE.HemisphereLight(0x52525b, 0x18181b, 0.22))
}

function createWaterPlane() {
  const scale = SHIP.scale
  const L = SHIP.length * scale
  const B = SHIP.width * scale

  const geometry = new THREE.PlaneGeometry(L * 2, B * 3)
  const material = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
    metalness: 0.25,
    roughness: 0.7,
    envMapIntensity: 0.22,
  })
  const water = new THREE.Mesh(geometry, material)
  water.rotation.x = -Math.PI / 2
  water.position.y = -SHIP.height * scale * 0.3
  water.receiveShadow = true
  water.renderOrder = -10
  scene.add(water)

  const gridSize = Math.max(L, B) * 2.5
  const gridHelper = new THREE.GridHelper(gridSize, 40, 0x3f3f46, 0x27272a)
  ;(gridHelper.material as THREE.Material).transparent = true
  ;(gridHelper.material as THREE.Material).opacity = 0.4
  scene.add(gridHelper)
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

    const baseMat = new THREE.MeshStandardMaterial({
      color: zoneColor,
      emissive: zoneColor,
      emissiveIntensity: EMISSIVE.BASE,
      metalness: 0.15,
      roughness: 0.5,
      envMapIntensity: 0.6,
    })

    const fillMat = new THREE.MeshStandardMaterial({
      color: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissive: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissiveIntensity: EMISSIVE.BASE,
      metalness: 0.15,
      roughness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      envMapIntensity: 0.6,
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

    const edgeGeo = new THREE.EdgesGeometry(baseGeo, 15)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xa1a1aa, transparent: true, opacity: 0.18 })
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
  baseMesh.visible = true
  fillMesh.visible = false
  baseMesh.material.color.set(c)
  baseMesh.material.emissive.set(c)
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
function frameAll(tight = 0.8) {
  const box = new THREE.Box3()
  segmentGroups.forEach((g) => g.visible && box.expandByObject(g))
  if (box.isEmpty()) return

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = (camera.fov * Math.PI) / 180
  const dist = maxDim / 2 / Math.tan(fov / 2)
  const desired = dist * tight

  const dir = new THREE.Vector3(1, 0.55, 1).normalize()
  controls.target.copy(center)
  camera.position.copy(center.clone().add(dir.multiplyScalar(desired)))
  camera.near = Math.max(0.2, maxDim / 20)
  camera.far = Math.max(200, desired * 15)
  camera.updateProjectionMatrix()

  controls.minDistance = Math.max(0.8, maxDim * 0.12)
  controls.maxDistance = Math.max(50, maxDim * 30)
  controls.update()
  updateFogAfterFrame(maxDim)
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
  if (e.key === 'r' || e.key === 'R' || e.key === '0') frameAll(0.8)
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
        <div ref="canvasWrapRef" class="flex-1 relative min-h-0" @contextmenu.prevent>
          <canvas ref="canvasRef" class="w-full h-full block" />

          <!-- 顶部浮层工具栏 -->
          <div class="absolute top-0 inset-x-0 p-3.5 flex items-start justify-between pointer-events-none">
            <!-- 左上：标题 -->
            <div class="pointer-events-auto">
              <div class="bg-foreground/80 backdrop-blur-xl rounded-lg px-3.5 py-2 flex items-center gap-2.5 ring-1 ring-foreground/20 shadow-xl">
                <div class="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(244,162,97,0.6)] animate-pulse" />
                <h2 class="ui-title text-secondary tracking-tight">{{ shipTitle }}</h2>
                <div class="h-3.5 w-px bg-secondary/40" />
                <span class="ui-meta text-secondary/70 tabular-nums font-medium">{{ kpi.totalCount }} 分段</span>
              </div>
            </div>

            <!-- 右上：视图切换 + 全屏 -->
            <div class="pointer-events-auto flex items-center gap-1.5">
              <div class="bg-foreground/80 backdrop-blur-xl rounded-lg p-0.5 flex items-center ring-1 ring-foreground/20 shadow-xl">
                <button
                  v-for="v in [
                    { key: 'complete' as const, label: '船体概览', icon: 'M2.25 12l8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
                    { key: 'progress' as const, label: '建造进度', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z' },
                  ]"
                  :key="v.key"
                  class="flex items-center gap-1.5 px-3 py-1.5 ui-meta font-medium rounded-md transition-all duration-200"
                  :class="currentView === v.key
                    ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/40'
                    : 'text-secondary/60 hover:text-destructive hover:bg-destructive/10'"
                  @click="setView(v.key)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="v.icon" />
                  </svg>
                  {{ v.label }}
                </button>
              </div>
              <button
                class="bg-foreground/80 backdrop-blur-xl rounded-lg w-8 h-8 flex items-center justify-center text-secondary/60 hover:text-destructive hover:bg-foreground/70 transition-all ring-1 ring-foreground/20 shadow-xl"
                :title="isFullscreen ? '退出全屏' : '全屏显示'"
                @click="toggleFullscreen"
              >
                <svg v-if="!isFullscreen" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 左下：操作提示 -->
          <div class="absolute bottom-3.5 left-3.5 pointer-events-none">
            <div class="flex items-center gap-1.5 select-none">
              <div class="flex items-center gap-1 bg-foreground/70 backdrop-blur-lg rounded-md px-2 py-1 ring-1 ring-foreground/20">
                <kbd class="ui-micro font-mono text-secondary/80 bg-foreground/60 rounded px-1 py-px ring-1 ring-foreground/20">LMB</kbd>
                <span class="ui-micro text-secondary/70">旋转</span>
              </div>
              <div class="flex items-center gap-1 bg-foreground/70 backdrop-blur-lg rounded-md px-2 py-1 ring-1 ring-foreground/20">
                <kbd class="ui-micro font-mono text-secondary/80 bg-foreground/60 rounded px-1 py-px ring-1 ring-foreground/20">RMB</kbd>
                <span class="ui-micro text-secondary/70">平移</span>
              </div>
              <div class="flex items-center gap-1 bg-foreground/70 backdrop-blur-lg rounded-md px-2 py-1 ring-1 ring-foreground/20">
                <kbd class="ui-micro font-mono text-secondary/80 bg-foreground/60 rounded px-1 py-px ring-1 ring-foreground/20">Scroll</kbd>
                <span class="ui-micro text-secondary/70">缩放</span>
              </div>
            </div>
          </div>

          <!-- 右下：推演控制浮层 -->
          <div class="absolute bottom-3.5 right-3.5 pointer-events-auto">
            <div class="bg-foreground/80 backdrop-blur-xl rounded-xl px-3.5 py-2.5 ring-1 ring-foreground/20 shadow-xl w-[320px]">
              <div class="flex items-center gap-2.5">
                <button
                  class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                  :class="simPlaying
                    ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 ring-1 ring-destructive/40'
                    : 'bg-foreground/60 text-secondary/60 hover:bg-foreground/70 hover:text-destructive ring-1 ring-foreground/20'"
                  :title="simPlaying ? '暂停推演' : '播放推演'"
                  @click="toggleSimPlay"
                >
                  <svg v-if="!simPlaying" class="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between mb-1">
                    <span class="ui-micro text-secondary/70 font-medium uppercase tracking-wider">推演进度</span>
                    <div class="flex items-baseline gap-1">
                      <span class="ui-meta font-semibold text-secondary tabular-nums font-mono">{{ simDateText }}</span>
                      <span class="ui-micro text-secondary/50 tabular-nums font-mono">D{{ simIndex }}/{{ SIM.days }}</span>
                    </div>
                  </div>
                  <div class="relative h-4 flex items-center">
                    <div class="w-full h-[3px] bg-foreground/60 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-200"
                        :class="simPlaying ? 'bg-destructive' : 'bg-secondary/70'"
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
          <div v-if="isFullscreen" class="absolute top-20 left-4 pointer-events-none">
            <div class="bg-foreground/85 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-foreground/20">
              <div class="flex items-center gap-3">
                <div class="relative w-14 h-14 shrink-0">
                  <svg viewBox="0 0 80 80" class="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" class="stroke-secondary/20" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" stroke-linecap="round"
                      class="stroke-destructive transition-all duration-500"
                      :stroke-dasharray="progressRingDash.array" :stroke-dashoffset="progressRingDash.offset" />
                  </svg>
                  <span class="absolute inset-0 flex items-center justify-center ui-meta font-bold text-secondary">{{ kpi.overallProgress }}%</span>
                </div>
                <div class="text-xs space-y-1">
                  <div class="ui-title text-secondary">整体装配</div>
                  <div class="ui-meta flex gap-3 text-secondary/70">
                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-primary" />{{ kpi.installedCount }} 已装</span>
                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-secondary" />{{ kpi.remainingCount }} 剩余</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center bg-foreground/85 backdrop-blur-sm gap-3">
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
</style>
