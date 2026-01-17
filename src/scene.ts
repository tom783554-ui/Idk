import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  SceneLoader,
  StandardMaterial,
  Vector3
} from '@babylonjs/core'
import '@babylonjs/loaders'

export type HotspotData = {
  id: string
  title: string
  body: string
  position: Vector3
}

export type Hotspot = {
  mesh: Mesh
  data: HotspotData
}

const hotspotData: HotspotData[] = [
  {
    id: 'ventilator',
    title: 'Ventilator',
    body: 'Respiratory support. Click later to toggle vent settings overlay.',
    position: new Vector3(1.2, 1.1, -0.6)
  },
  {
    id: 'monitor',
    title: 'Monitor',
    body: 'Vitals display: ECG, SpO2, NIBP, RR. Click later to show waveforms.',
    position: new Vector3(0.4, 1.4, -1.2)
  },
  {
    id: 'infusion-pumps',
    title: 'Infusion Pumps',
    body: 'Medication + fluids. Click later for drip rates and lines.',
    position: new Vector3(-1.0, 1.0, -0.3)
  },
  {
    id: 'patient',
    title: 'Patient',
    body: 'Primary subject. Click later for lines/tubes/wounds overlays.',
    position: new Vector3(0.0, 0.9, 0.4)
  }
]

export const createScene = async (
  engine: Engine,
  canvas: HTMLCanvasElement,
  onError: (message: string) => void
): Promise<{ scene: Scene; hotspots: Hotspot[] }> => {
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.95, 0.95, 0.95, 1)

  const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2.6, 4, Vector3.Zero(), scene)
  camera.attachControl(canvas, true)
  camera.panningSensibility = 0
  camera.pinchPrecision = 80
  camera.wheelPrecision = 60

  new HemisphericLight('hemilight', new Vector3(0, 1, 0), scene)

  try {
    await SceneLoader.AppendAsync('', '/public/hospital_room.glb.download', scene)
  } catch (error) {
    const message =
      error instanceof Error
        ? `Unable to load the hospital room model. ${error.message}`
        : 'Unable to load the hospital room model.'
    onError(message)
  }

  const hotspotMaterial = new StandardMaterial('hotspot-material', scene)
  hotspotMaterial.emissiveColor = new Color3(0.27, 0.52, 1)
  hotspotMaterial.diffuseColor = new Color3(0.1, 0.2, 0.4)

  const hotspots = hotspotData.map((data) => {
    const mesh = MeshBuilder.CreateSphere(`hotspot-${data.id}`, { diameter: 0.12 }, scene)
    mesh.position = data.position
    mesh.material = hotspotMaterial
    mesh.isPickable = true
    mesh.metadata = { hotspot: data }
    return { mesh, data }
  })

  return { scene, hotspots }
}
