import '@babylonjs/loaders/glTF';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type { ISceneLoaderProgressEvent } from '@babylonjs/core/Loading/sceneLoader';

export interface LoadResult {
  success: boolean;
  error?: string;
}

export interface LoadOptions {
  scene: Scene;
  url: string;
  onProgress?: (progress: number) => void;
  onStatus?: (status: string) => void;
}

export const loadMainGlb = async ({ scene, url, onProgress, onStatus }: LoadOptions): Promise<LoadResult> => {
  try {
    onStatus?.('Loading GLB');
    await SceneLoader.AppendAsync('', url, scene, (event: ISceneLoaderProgressEvent) => {
      if (!event.lengthComputable) {
        onProgress?.(0);
        return;
      }
      const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress?.(progress);
    });
    onProgress?.(100);
    onStatus?.('Scene ready');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load GLB';
    onStatus?.('Load failed');
    return { success: false, error: message };
  }
};
