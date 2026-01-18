import { Engine } from '@babylonjs/core/Engines/engine';
import { getAdaptiveScale } from '../utils/device';

export const createEngine = (canvas: HTMLCanvasElement): Engine => {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  });
  engine.setHardwareScalingLevel(getAdaptiveScale());
  return engine;
};
