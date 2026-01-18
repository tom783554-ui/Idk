import {
  ArcRotateCamera,
  Color4,
  HemisphericLight,
  Scene,
  Vector3,
} from '@babylonjs/core';

export interface SceneSetup {
  scene: Scene;
  camera: ArcRotateCamera;
}

export const createScene = (scene: Scene, canvas: HTMLCanvasElement): SceneSetup => {
  scene.clearColor = new Color4(0.28, 0.28, 0.28, 1);

  const camera = new ArcRotateCamera(
    'main-camera',
    Math.PI / 2,
    Math.PI / 3,
    8,
    new Vector3(0, 1.5, 0),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 1;
  camera.upperRadiusLimit = 60;
  camera.minZ = 0.05;
  camera.maxZ = 500;
  camera.panningSensibility = 600;
  camera.wheelPrecision = 60;
  camera.useBouncingBehavior = false;
  camera.useAutoRotationBehavior = false;

  const light = new HemisphericLight('hemi-light', new Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  return { scene, camera };
};
