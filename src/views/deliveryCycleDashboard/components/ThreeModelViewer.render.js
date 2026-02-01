import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function createRenderer(ctx) {
  const {
    hostRef,
    overlayRef,
    orientRef,
    cameraQuat,
    activeAxis,
    onAxisClick,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    handleDoubleClick,
    handlePointerLeave,
    handleKeydown,
    resizeOverlayCanvas,
    drawLeftDimsOverlay,
    markLeftDimsDirty,
    updateBoundMarks,
    updateMeshLabels,
    getToolMode,
    showAllMeshes,
    tickCameraAnim,
    syncOrientCube,
    setRenderer,
    setLabelRenderer,
    setScene,
    setCamera,
    setControls,
    setRaycaster,
    setPointer,
    setRafId,
    getRafId,
  } = ctx;

  const CAPTURE_OPTS = { capture: true };

  function initThree() {
    const scene = new THREE.Scene();

    /* ── 深蓝夜景背景 ── */
    scene.background = new THREE.Color(0xf8f9fb);

    /* ── 浅灰雾：远处自然消隐，不糊近景 ── */
    scene.fog = new THREE.FogExp2(0xf8f9fb, 0.0012);

    const w = hostRef.value.clientWidth || 800;
    const h = hostRef.value.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500000);
    camera.position.set(2.2, 1.8, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0xf8f9fb, 1);

    /* ── 色调映射 + 曝光：让高光不过曝、暗部不死黑 ── */
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    hostRef.value.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(w, h);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    hostRef.value.appendChild(labelRenderer.domElement);

    resizeOverlayCanvas();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.addEventListener('change', syncOrientCube);
    syncOrientCube();

    /* ── 深蓝夜景灯光组 ── */
    // 环境光：冷蓝基底
    scene.add(new THREE.AmbientLight(0x8ec5fc, 0.45));
    // 半球光：天蓝 + 地面深靛
    scene.add(new THREE.HemisphereLight(0x7db4e6, 0x1a2744, 0.5));
    // 主方向光：微暖白，偏高偏侧
    const dir = new THREE.DirectionalLight(0xe8edf5, 1.1);
    dir.position.set(3, 6, 4);
    scene.add(dir);
    // 补光：冷蓝从对侧托底
    const fill = new THREE.DirectionalLight(0x4a8eda, 0.35);
    fill.position.set(-4, 2, -3);
    scene.add(fill);
    // 底部微光：防止底面全黑
    const bottom = new THREE.DirectionalLight(0x2a4a7f, 0.18);
    bottom.position.set(0, -4, 0);
    scene.add(bottom);

    /* ── 地面网格（已隐藏） ── */
    const grid = new THREE.GridHelper(200, 120, 0x9ca3af, 0xbfc5cd);
    grid.material.opacity = 0;
    grid.material.transparent = true;
    grid.material.depthWrite = false;
    grid.name = '__groundGrid';
    grid.position.y = -0.01;
    grid.visible = false;
    scene.add(grid);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.02;
    raycaster.params.Points.threshold = 0.02;
    const pointer = new THREE.Vector2();

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointermove', handlePointerMove, { passive: true });
    renderer.domElement.addEventListener('pointerdown', handlePointerDown, CAPTURE_OPTS);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointercancel', handlePointerUp);
    renderer.domElement.addEventListener('dblclick', handleDoubleClick);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', handleKeydown);

    setScene(scene);
    setCamera(camera);
    setRenderer(renderer);
    setLabelRenderer(labelRenderer);
    setControls(controls);
    setRaycaster(raycaster);
    setPointer(pointer);

    loop();
  }

  function loop() {
    setRafId(requestAnimationFrame(loop));
    const renderer = ctx.getRenderer();
    const labelRenderer = ctx.getLabelRenderer();
    const camera = ctx.getCamera();
    const scene = ctx.getScene();
    const controls = ctx.getControls();

    controls && controls.update();
    tickCameraAnim();

    updateBoundMarks();
    updateMeshLabels();
    syncOrientCube();

    const mode = typeof getToolMode === 'function' ? getToolMode() : '';
    if (mode === 'measure' || mode === 'note') {
      showAllMeshes && showAllMeshes();
    }

    renderer && scene && camera && renderer.render(scene, camera);
    labelRenderer && scene && camera && labelRenderer.render(scene, camera);

    drawLeftDimsOverlay();
  }

  function handleResize() {
    const renderer = ctx.getRenderer();
    const labelRenderer = ctx.getLabelRenderer();
    const camera = ctx.getCamera();
    if (!renderer || !labelRenderer || !camera || !hostRef.value) return;
    const w = hostRef.value.clientWidth || 800;
    const h = hostRef.value.clientHeight || 500;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    resizeOverlayCanvas();
    markLeftDimsDirty();
  }

  function resizeViewer() {
    handleResize();
  }

  function disposeRenderer() {
    const renderer = ctx.getRenderer();
    const labelRenderer = ctx.getLabelRenderer();
    const controls = ctx.getControls();
    const scene = ctx.getScene();
    const rafId = getRafId();

    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeydown);

    if (controls) controls.removeEventListener('change', syncOrientCube);

    if (renderer?.domElement) {
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown, CAPTURE_OPTS);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointercancel', handlePointerUp);
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
    }

    if (rafId) cancelAnimationFrame(rafId);
    if (controls) controls.dispose && controls.dispose();

    if (renderer) {
      renderer.dispose && renderer.dispose();
      if (renderer.domElement?.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (labelRenderer?.domElement?.parentNode) {
      labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
    }

    setRenderer(null);
    setLabelRenderer(null);
    setScene(null);
    setCamera(null);
    setControls(null);
    setRaycaster(null);
    setPointer(null);
  }

  return { initThree, handleResize, resizeViewer, disposeRenderer };
}
