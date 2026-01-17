import * as BABYLON from "https://cdn.babylonjs.com/babylon.esm.js";

let engine = null;
let scene = null;
let camera = null;
let hemiLight = null;
let dirLight = null;
let statusPlane = null;
let statusTexture = null;
let bedMesh = null;
let proceduralRoot = null;
let onLogHandler = null;
let renderLoop = null;
let resizeHandler = null;
let visibilityHandler = null;
let loadersPromise = null;

const ensureLoaders = () => {
  if (!loadersPromise) {
    window.BABYLON = BABYLON;
    loadersPromise = import(
      "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"
    );
  }
  return loadersPromise;
};

const logMessage = (message) => {
  if (onLogHandler) {
    onLogHandler(message);
  }
  setStatusText(message);
};

const createStatusBillboard = () => {
  statusPlane = BABYLON.MeshBuilder.CreatePlane(
    "status-plane",
    { width: 4, height: 1 },
    scene
  );
  statusPlane.position = new BABYLON.Vector3(0, 3.2, 0);
  statusPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  statusPlane.isPickable = false;

  statusTexture = new BABYLON.DynamicTexture(
    "status-texture",
    { width: 512, height: 128 },
    scene,
    true
  );
  const statusMaterial = new BABYLON.StandardMaterial(
    "status-material",
    scene
  );
  statusMaterial.diffuseTexture = statusTexture;
  statusMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
  statusMaterial.opacityTexture = statusTexture;
  statusPlane.material = statusMaterial;
  setStatusText("ICU-Sim ready");
};

const createProceduralRoom = () => {
  proceduralRoot = new BABYLON.TransformNode("procedural-root", scene);

  const ground = BABYLON.MeshBuilder.CreateGround(
    "floor",
    { width: 12, height: 12 },
    scene
  );
  ground.parent = proceduralRoot;
  const floorMaterial = new BABYLON.StandardMaterial("floor-material", scene);
  floorMaterial.diffuseColor = new BABYLON.Color3(0.12, 0.18, 0.26);
  floorMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  ground.material = floorMaterial;

  const wallMaterial = new BABYLON.StandardMaterial("wall-material", scene);
  wallMaterial.diffuseColor = new BABYLON.Color3(0.18, 0.24, 0.32);
  wallMaterial.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);

  const backWall = BABYLON.MeshBuilder.CreateBox(
    "wall-back",
    { width: 12, height: 4, depth: 0.2 },
    scene
  );
  backWall.position = new BABYLON.Vector3(0, 2, -6);
  backWall.parent = proceduralRoot;
  backWall.material = wallMaterial;

  const leftWall = BABYLON.MeshBuilder.CreateBox(
    "wall-left",
    { width: 0.2, height: 4, depth: 12 },
    scene
  );
  leftWall.position = new BABYLON.Vector3(-6, 2, 0);
  leftWall.parent = proceduralRoot;
  leftWall.material = wallMaterial;

  const rightWall = BABYLON.MeshBuilder.CreateBox(
    "wall-right",
    { width: 0.2, height: 4, depth: 12 },
    scene
  );
  rightWall.position = new BABYLON.Vector3(6, 2, 0);
  rightWall.parent = proceduralRoot;
  rightWall.material = wallMaterial;

  bedMesh = BABYLON.MeshBuilder.CreateBox(
    "bed",
    { width: 3.2, height: 0.6, depth: 2.2 },
    scene
  );
  bedMesh.position = new BABYLON.Vector3(-1, 0.45, 1.2);
  bedMesh.parent = proceduralRoot;
  const bedMaterial = new BABYLON.StandardMaterial("bed-material", scene);
  bedMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.7);
  bedMesh.material = bedMaterial;

  const monitor = BABYLON.MeshBuilder.CreateBox(
    "monitor",
    { width: 1.2, height: 0.9, depth: 0.2 },
    scene
  );
  monitor.position = new BABYLON.Vector3(2.2, 1.6, -0.4);
  monitor.parent = proceduralRoot;
  const monitorMaterial = new BABYLON.StandardMaterial(
    "monitor-material",
    scene
  );
  monitorMaterial.diffuseColor = new BABYLON.Color3(0.35, 0.7, 0.85);
  monitor.material = monitorMaterial;

  const ivPole = BABYLON.MeshBuilder.CreateCylinder(
    "iv-pole",
    { height: 2.6, diameter: 0.12 },
    scene
  );
  ivPole.position = new BABYLON.Vector3(2.6, 1.3, 1.8);
  ivPole.parent = proceduralRoot;
  const poleMaterial = new BABYLON.StandardMaterial("pole-material", scene);
  poleMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.85, 0.9);
  ivPole.material = poleMaterial;
};

const fitGlbRoot = (glbRoot, meshes) => {
  if (!meshes.length) {
    return;
  }
  let min = null;
  let max = null;
  meshes.forEach((mesh) => {
    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    const meshMin = boundingInfo.boundingBox.minimumWorld;
    const meshMax = boundingInfo.boundingBox.maximumWorld;
    min = min ? BABYLON.Vector3.Minimize(min, meshMin) : meshMin.clone();
    max = max ? BABYLON.Vector3.Maximize(max, meshMax) : meshMax.clone();
  });

  if (!min || !max) {
    return;
  }

  const size = max.subtract(min);
  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const targetSize = 10;
  const scale = targetSize / maxSize;
  glbRoot.scaling = new BABYLON.Vector3(scale, scale, scale);

  const center = min.add(max).scale(0.5);
  glbRoot.position = new BABYLON.Vector3(
    -center.x * scale,
    -center.y * scale + 0.2,
    -center.z * scale
  );
};

const loadGlbRoom = async () => {
  try {
    await ensureLoaders();
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "/assets/",
      "icu_room.glb",
      scene
    );

    const glbRoot = new BABYLON.TransformNode("glb-root", scene);
    const meshNodes = result.meshes.filter((mesh) => mesh);
    meshNodes.forEach((mesh) => {
      mesh.parent = glbRoot;
    });

    const renderableMeshes = meshNodes.filter(
      (mesh) => mesh.getTotalVertices && mesh.getTotalVertices() > 0
    );
    fitGlbRoot(glbRoot, renderableMeshes);

    if (proceduralRoot) {
      proceduralRoot.setEnabled(false);
    }

    logMessage("Loaded ICU room model.");
  } catch (error) {
    const message = "GLB room failed to load; using procedural fallback.";
    console.warn(message, error);
    logMessage(message);
  }
};

export const createScene = (canvas) => {
  engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });

  const deviceRatio = window.devicePixelRatio || 1;
  const scalingLevel = Math.min(Math.max(deviceRatio, 1), 2);
  engine.setHardwareScalingLevel(scalingLevel);

  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.06, 0.12, 1);

  camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 3,
    Math.PI / 3.3,
    12,
    new BABYLON.Vector3(0, 1.2, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 20;
  camera.wheelDeltaPercentage = 0.01;
  camera.lowerBetaLimit = 0.3;
  camera.upperBetaLimit = 1.3;

  hemiLight = new BABYLON.HemisphericLight(
    "hemi-light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemiLight.intensity = 0.9;

  dirLight = new BABYLON.DirectionalLight(
    "dir-light",
    new BABYLON.Vector3(-0.4, -1, 0.2),
    scene
  );
  dirLight.position = new BABYLON.Vector3(5, 8, -4);
  dirLight.intensity = 0.3;

  createProceduralRoom();
  createStatusBillboard();

  return scene;
};

export const init = ({ canvas, onLog }) => {
  if (!canvas) {
    throw new Error("Canvas is required to initialize the scene.");
  }

  onLogHandler = onLog;
  createScene(canvas);

  renderLoop = () => {
    if (scene) {
      scene.render();
    }
  };
  engine.runRenderLoop(renderLoop);

  resizeHandler = () => {
    if (engine) {
      engine.resize();
    }
  };
  window.addEventListener("resize", resizeHandler);

  visibilityHandler = () => {
    if (!engine) {
      return;
    }
    if (document.hidden) {
      engine.stopRenderLoop(renderLoop);
    } else {
      engine.runRenderLoop(renderLoop);
    }
  };
  document.addEventListener("visibilitychange", visibilityHandler);

  logMessage("Scene initialized.");
  loadGlbRoom();
};

export const dispose = () => {
  document.removeEventListener("visibilitychange", visibilityHandler);
  window.removeEventListener("resize", resizeHandler);
  visibilityHandler = null;
  resizeHandler = null;

  if (scene) {
    scene.dispose();
    scene = null;
  }
  if (engine) {
    engine.dispose();
    engine = null;
  }
  camera = null;
  hemiLight = null;
  dirLight = null;
  bedMesh = null;
  statusPlane = null;
  statusTexture = null;
  proceduralRoot = null;
};

export const resetCamera = () => {
  if (!camera) {
    return;
  }
  camera.setPosition(new BABYLON.Vector3(6, 6, 6));
  camera.setTarget(new BABYLON.Vector3(0, 1.2, 0));
  logMessage("Camera reset.");
};

export const toggleLight = () => {
  if (!hemiLight) {
    return;
  }
  const isOn = hemiLight.intensity > 0;
  hemiLight.intensity = isOn ? 0 : 0.9;
  if (dirLight) {
    dirLight.intensity = isOn ? 0 : 0.3;
  }
  logMessage(`Lights ${isOn ? "off" : "on"}.`);
};

export const randomizeColor = () => {
  if (!bedMesh || !bedMesh.material) {
    return;
  }
  const material = bedMesh.material;
  if (material instanceof BABYLON.StandardMaterial) {
    material.diffuseColor = new BABYLON.Color3(
      Math.random() * 0.6 + 0.2,
      Math.random() * 0.6 + 0.2,
      Math.random() * 0.6 + 0.2
    );
    logMessage("Bed color randomized.");
  }
};

export const setStatusText = (text) => {
  if (!statusTexture) {
    return;
  }
  statusTexture.clear();
  statusTexture.drawText(
    text,
    10,
    78,
    "bold 42px Arial",
    "#e2e8f0",
    "rgba(15, 23, 42, 0.7)",
    true
  );
};
