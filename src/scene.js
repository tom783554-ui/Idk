import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Color4 } from "@babylonjs/core/Maths/math.color";

let engine = null;
let scene = null;
let camera = null;
let light = null;
let boxMaterial = null;

function randColor() {
  return new Color3(
    Math.random() * 0.7 + 0.2,
    Math.random() * 0.7 + 0.2,
    Math.random() * 0.7 + 0.2
  );
}

export function init(canvas, statusEl) {
  if (!canvas) throw new Error("Missing canvas");

  engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: false,
    powerPreference: "high-performance",
  });

  scene = new Scene(engine);
  scene.clearColor = new Color4(0.06, 0.07, 0.09, 1);

  camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 3,
    8,
    new Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.wheelPrecision = 60;

  light = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new Color3(0.18, 0.18, 0.2);
  ground.material = groundMat;

  const box = MeshBuilder.CreateBox("icu-monitor", { size: 2.5 }, scene);
  box.position.y = 1.25;

  boxMaterial = new StandardMaterial("boxMaterial", scene);
  boxMaterial.diffuseColor = new Color3(0.2, 0.6, 0.8);
  box.material = boxMaterial;

  const accent = MeshBuilder.CreateCylinder("accent", { height: 1.2, diameter: 0.4 }, scene);
  accent.position = new Vector3(-1.2, 0.6, 1.2);

  const accentMat = new StandardMaterial("accentMat", scene);
  accentMat.diffuseColor = new Color3(0.95, 0.85, 0.4);
  accent.material = accentMat;

  const updateStatus = () => {
    if (!statusEl) return;
    statusEl.textContent = `Camera radius: ${camera.radius.toFixed(1)} | Light: ${light.intensity.toFixed(1)}`;
  };

  updateStatus();

  return {
    engine,
    scene,
    updateStatus,
    resetCamera() {
      camera.setPosition(new Vector3(6, 6, 6));
      camera.setTarget(new Vector3(0, 1, 0));
      updateStatus();
    },
    toggleLight() {
      light.intensity = light.intensity > 0 ? 0 : 0.9;
      updateStatus();
    },
    randomizeColor() {
      boxMaterial.diffuseColor = randColor();
      updateStatus();
    },
  };
}
