import {
  init,
  randomizeColor,
  resetCamera,
  toggleLight,
  setStatusText,
} from "./scene.js";

const canvas = document.getElementById("renderCanvas");
const status = document.getElementById("status");
const resetCameraButton = document.getElementById("resetCamera");
const toggleLightButton = document.getElementById("toggleLight");
const randomizeColorButton = document.getElementById("randomizeColor");

if (!canvas || !status) {
  throw new Error("Missing required canvas or status element.");
}

const onLog = (message) => {
  status.textContent = message;
};

init({ canvas, onLog });
setStatusText("Initializing ICU scene…");

resetCameraButton?.addEventListener("click", () => {
  resetCamera();
});

toggleLightButton?.addEventListener("click", () => {
  toggleLight();
});

randomizeColorButton?.addEventListener("click", () => {
  randomizeColor();
});
