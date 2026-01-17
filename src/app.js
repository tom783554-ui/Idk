import { init } from "./scene.js";

const canvas = document.getElementById("renderCanvas");
const status = document.getElementById("status");
const resetCameraButton = document.getElementById("resetCamera");
const toggleLightButton = document.getElementById("toggleLight");
const randomizeColorButton = document.getElementById("randomizeColor");

if (!canvas || !status) {
  return;
}

const api = init(canvas, status);

resetCameraButton?.addEventListener("click", () => api.resetCamera?.());
toggleLightButton?.addEventListener("click", () => api.toggleLight?.());
randomizeColorButton?.addEventListener("click", () => api.randomizeColor?.());

api.engine.runRenderLoop(() => api.scene.render());

window.addEventListener("resize", () => {
  api.engine.resize();
});
