<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLDivElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let cube: THREE.Mesh
let animationId: number

// 暴露给父组件的控制方法
const rotationSpeed = ref(0.01)
const cubeColor = ref('#6366f1')

function init() {
  if (!containerRef.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0f)

  // 创建相机
  const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.position.z = 5

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  containerRef.value.appendChild(renderer.domElement)

  // 创建立方体
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({
    color: cubeColor.value,
    metalness: 0.3,
    roughness: 0.4,
  })
  cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 1)
  pointLight.position.set(5, 5, 5)
  scene.add(pointLight)

  // 添加网格地面
  const gridHelper = new THREE.GridHelper(20, 20, 0x1e1e2e, 0x1e1e2e)
  gridHelper.position.y = -2
  scene.add(gridHelper)

  // 监听窗口大小变化
  window.addEventListener('resize', onResize)

  // 开始动画
  animate()
}

function animate() {
  animationId = requestAnimationFrame(animate)

  if (cube) {
    cube.rotation.x += rotationSpeed.value
    cube.rotation.y += rotationSpeed.value
  }

  renderer.render(scene, camera)
}

function onResize() {
  if (!containerRef.value) return

  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

function updateColor(color: string) {
  if (cube) {
    ;(cube.material as THREE.MeshStandardMaterial).color.set(color)
  }
}

function resetView() {
  if (cube) {
    cube.rotation.x = 0
    cube.rotation.y = 0
  }
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  renderer?.dispose()
})

defineExpose({
  rotationSpeed,
  cubeColor,
  updateColor,
  resetView,
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full" />
</template>
