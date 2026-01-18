'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createEngine } from './engine/createEngine';
import { createScene } from './scene/createScene';
import { loadMainGlb } from './load/loadMainGlb';
import Hud from './ui/Hud';
import LoadingOverlay from './ui/LoadingOverlay';

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  background: '#4a4a4a',
};

const canvasStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
};

const controlsStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '1rem',
  left: '1rem',
  display: 'flex',
  gap: '0.5rem',
  zIndex: 4,
};

const buttonStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '0.4rem',
  padding: '0.5rem 0.75rem',
  cursor: 'pointer',
};

const bannerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '0.75rem 1rem',
  background: 'rgba(176, 56, 56, 0.9)',
  borderRadius: '0.5rem',
  zIndex: 6,
  color: '#fff',
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
};

const fileInputStyle: React.CSSProperties = {
  color: '#fff',
};

const DEFAULT_GLB = '/assets/main/main.glb';

export default function Viewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeState = useRef({ frozen: false });
  const initialCameraRef = useRef<{ alpha: number; beta: number; radius: number; target: Vector3 } | null>(null);

  const [loadingVisible, setLoadingVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing');
  const [missingGlb, setMissingGlb] = useState(false);
  const [hudStats, setHudStats] = useState({ fps: 0, meshes: 0, triangles: 0 });
  const [shareStatus, setShareStatus] = useState('');

  const urlGlb = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('glb');
  }, []);

  const [activeGlb, setActiveGlb] = useState<string | null>(null);
  const [isGlbParam, setIsGlbParam] = useState(false);

  const updateShareStatus = (message: string) => {
    setShareStatus(message);
    window.setTimeout(() => setShareStatus(''), 2000);
  };

  const scheduleFreeze = useCallback(() => {
    if (!sceneRef.current) {
      return;
    }
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(() => {
      if (!sceneRef.current || freezeState.current.frozen) {
        return;
      }
      sceneRef.current.freezeActiveMeshes();
      freezeState.current.frozen = true;
    }, 2000);
  }, []);

  const unfreeze = useCallback(() => {
    if (!sceneRef.current) {
      return;
    }
    if (freezeState.current.frozen) {
      sceneRef.current.unfreezeActiveMeshes();
      freezeState.current.frozen = false;
    }
    scheduleFreeze();
  }, [scheduleFreeze]);

  const clearSceneContent = (scene: Scene) => {
    scene.meshes.slice().forEach((mesh) => mesh.dispose());
    scene.transformNodes.slice().forEach((node) => node.dispose());
    scene.materials.slice().forEach((material) => material.dispose());
    scene.textures.slice().forEach((texture) => texture.dispose());
  };

  const loadGlb = useCallback(
    async (source: string, isParam: boolean) => {
      const scene = sceneRef.current;
      if (!scene) {
        return;
      }
      setLoadingVisible(true);
      setProgress(0);
      setStatus('Starting load');
      setMissingGlb(false);
      setActiveGlb(source);
      setIsGlbParam(isParam);
      clearSceneContent(scene);
      const result = await loadMainGlb({
        scene,
        url: source,
        onProgress: (value) => setProgress(value),
        onStatus: (message) => setStatus(message),
      });
      if (!result.success) {
        setMissingGlb(true);
        setLoadingVisible(false);
        return;
      }
      scheduleFreeze();
      setTimeout(() => {
        setLoadingVisible(false);
      }, 300);
    },
    [scheduleFreeze],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current) {
      return;
    }

    const engine = createEngine(canvas);
    const scene = new Scene(engine);
    const { camera } = createScene(scene, canvas);
    engineRef.current = engine;
    sceneRef.current = scene;

    const initialCamera = {
      alpha: camera.alpha,
      beta: camera.beta,
      radius: camera.radius,
      target: camera.target.clone(),
    };
    initialCameraRef.current = initialCamera;

    const handlePointer = () => unfreeze();
    canvas.addEventListener('pointerdown', handlePointer);
    canvas.addEventListener('pointermove', handlePointer);
    canvas.addEventListener('wheel', handlePointer);

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    engine.runRenderLoop(() => {
      scene.render();
    });

    const statsInterval = window.setInterval(() => {
      if (!engineRef.current || !sceneRef.current) {
        return;
      }
      setHudStats({
        fps: engineRef.current.getFps(),
        meshes: sceneRef.current.meshes.length,
        triangles: sceneRef.current.getTotalIndices() / 3,
      });
    }, 500);

    const defaultGlb = urlGlb || process.env.NEXT_PUBLIC_MAIN_GLB_URL || DEFAULT_GLB;
    void loadGlb(defaultGlb, Boolean(urlGlb));

    return () => {
      window.clearInterval(statsInterval);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointer);
      canvas.removeEventListener('pointermove', handlePointer);
      canvas.removeEventListener('wheel', handlePointer);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [loadGlb, unfreeze, urlGlb]);

  const handleResetCamera = () => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }
    const camera = scene.activeCamera;
    if (camera && camera instanceof ArcRotateCamera && initialCameraRef.current) {
      camera.alpha = initialCameraRef.current.alpha;
      camera.beta = initialCameraRef.current.beta;
      camera.radius = initialCameraRef.current.radius;
      camera.target = initialCameraRef.current.target.clone();
    }
    unfreeze();
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = new URL(window.location.href);
    if (isGlbParam && activeGlb) {
      url.searchParams.set('glb', activeGlb);
    } else {
      url.searchParams.delete('glb');
    }
    try {
      await navigator.clipboard.writeText(url.toString());
      updateShareStatus('Link copied');
    } catch {
      updateShareStatus('Unable to copy');
    }
  };

  const handleLocalFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    void loadGlb(blobUrl, false);
  };

  return (
    <div style={containerStyle}>
      {missingGlb && (
        <div style={bannerStyle}>
          <span>Missing main.glb. Please add /public/assets/main/main.glb or choose a local file.</span>
          <input
            style={fileInputStyle}
            type="file"
            accept=".glb,.gltf"
            onChange={handleLocalFile}
          />
        </div>
      )}
      <canvas ref={canvasRef} style={canvasStyle} />
      <LoadingOverlay progress={progress} status={status} visible={loadingVisible} />
      <Hud fps={hudStats.fps} meshes={hudStats.meshes} triangles={hudStats.triangles} />
      <div style={controlsStyle}>
        <button style={buttonStyle} onClick={handleResetCamera}>
          Reset Camera
        </button>
        <button style={buttonStyle} onClick={handleCopyLink}>
          Copy Share Link
        </button>
        {shareStatus && <span>{shareStatus}</span>}
      </div>
    </div>
  );
}
