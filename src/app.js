import { UI } from "./ui.js";

(() => {
  const canvas = document.getElementById("renderCanvas");
  const status = document.getElementById("status");
  const uiRoot = document.getElementById("ui-root");

  if (!canvas || !status) {
    return;
  }

  if (typeof BABYLON === "undefined") {
    status.textContent = "Babylon.js failed to load. Check your connection.";
    return;
  }

  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.06, 0.12, 1);

  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 3,
    Math.PI / 3,
    10,
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 18;
  camera.wheelDeltaPercentage = 0.01;

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.9;

  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 12, height: 12 },
    scene
  );
  const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.12, 0.2, 0.3);
  groundMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  ground.material = groundMaterial;

  const box = BABYLON.MeshBuilder.CreateBox(
    "icu-monitor",
    { size: 2.5 },
    scene
  );
  box.position.y = 1.25;
  const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
  boxMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);
  box.material = boxMaterial;

  const accent = BABYLON.MeshBuilder.CreateCylinder(
    "accent",
    { height: 1.2, diameter: 0.4 },
    scene
  );
  accent.position = new BABYLON.Vector3(-1.2, 0.6, 1.2);
  const accentMaterial = new BABYLON.StandardMaterial("accentMaterial", scene);
  accentMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.85, 0.4);
  accent.material = accentMaterial;

  const infoText = () => {
    status.textContent = `Camera radius: ${camera.radius.toFixed(
      1
    )} | Light: ${light.intensity.toFixed(1)}`;
  };

  const resetCamera = () => {
    camera.setPosition(new BABYLON.Vector3(6, 6, 6));
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    infoText();
  };

  const toggleLight = () => {
    light.intensity = light.intensity > 0 ? 0 : 0.9;
    infoText();
  };

  const randomizeColor = () => {
    boxMaterial.diffuseColor = new BABYLON.Color3(
      Math.random() * 0.7 + 0.2,
      Math.random() * 0.7 + 0.2,
      Math.random() * 0.7 + 0.2
    );
  };

  infoText();

  const ui = uiRoot ? new UI(uiRoot) : null;
  ui?.init({
    onStart: () => ui.log("Start clicked", "action"),
    onPause: () => ui.log("Pause clicked", "action"),
    onReset: () => ui.log("Reset clicked", "action"),
    onSpeed: (value) => ui.log(`Speed set to ${value}`, "info"),
    onSound: (enabled) =>
      ui.log(`Sound ${enabled ? "enabled" : "muted"}`, "info"),
    onScenarioSelect: (scenario) =>
      ui.log(`Scenario selected: ${scenario}`, "info"),
    onOrder: (orderId) => ui.setStatus(`Order queued: ${orderId}`),
    onLogRequest: () => ui.log("Log requested", "info"),
    on3D: (actionId) => {
      if (actionId === "reset_camera") {
        resetCamera();
      }
      if (actionId === "toggle_light") {
        toggleLight();
      }
      if (actionId === "randomize_color") {
        randomizeColor();
      }
    },
  });

  ui?.log("UI ready", "info");

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
})();
