import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

const createStubApi = () => {
  const noop = () => {};
  return {
    engine: {
      runRenderLoop: noop,
      resize: noop,
    },
    scene: {
      render: noop,
    },
    resetCamera: noop,
    toggleLight: noop,
    randomizeColor: noop,
  };
};

export const init = (canvas, status) => {
  if (!canvas) {
    if (status) {
      status.textContent = "Canvas not found.";
    }
    return createStubApi();
  }

  if (status) {
    status.textContent = "Initializing scene...";
  }

  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.02, 0.06, 0.12, 1);

  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 3,
    Math.PI / 3,
    10,
    new Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 18;
  camera.wheelDeltaPercentage = 0.01;

  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 12, height: 12 },
    scene
  );
  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new Color3(0.12, 0.2, 0.3);
  groundMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
  ground.material = groundMaterial;

  const box = MeshBuilder.CreateBox("icu-monitor", { size: 2.5 }, scene);
  box.position.y = 1.25;
  const boxMaterial = new StandardMaterial("boxMaterial", scene);
  boxMaterial.diffuseColor = new Color3(0.2, 0.6, 0.8);
  box.material = boxMaterial;

  const accent = MeshBuilder.CreateCylinder(
    "accent",
    { height: 1.2, diameter: 0.4 },
    scene
  );
  accent.position = new Vector3(-1.2, 0.6, 1.2);
  const accentMaterial = new StandardMaterial("accentMaterial", scene);
  accentMaterial.diffuseColor = new Color3(0.95, 0.85, 0.4);
  accent.material = accentMaterial;

  const updateStatus = () => {
    if (status) {
      status.textContent = `Ready | Camera radius: ${camera.radius.toFixed(
        1
      )} | Light: ${light.intensity.toFixed(1)}`;
    }
  };

  const resetCamera = () => {
    camera.setPosition(new Vector3(6, 6, 6));
    camera.setTarget(new Vector3(0, 1, 0));
    updateStatus();
  };

  const toggleLight = () => {
    light.intensity = light.intensity > 0 ? 0 : 0.9;
    updateStatus();
  };

  const randomizeColor = () => {
    boxMaterial.diffuseColor = new Color3(
      Math.random() * 0.7 + 0.2,
      Math.random() * 0.7 + 0.2,
      Math.random() * 0.7 + 0.2
    );
  };

  updateStatus();

  return {
    engine,
    scene,
    camera,
    light,
    boxMaterial,
    groundMaterial,
    resetCamera,
    toggleLight,
    randomizeColor,
  };
};
