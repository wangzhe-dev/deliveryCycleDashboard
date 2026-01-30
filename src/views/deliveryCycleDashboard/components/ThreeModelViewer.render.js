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
    scene.background = null;

    const w = hostRef.value.clientWidth || 800;
    const h = hostRef.value.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500000);
    camera.position.set(2.2, 1.8, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbad7ff, 0.35));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 5, 4);
    scene.add(dir);

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
      if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
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
