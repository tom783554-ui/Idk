import './style.css'
import { Engine } from '@babylonjs/core'
import { createScene } from './scene'
import { setupHotspotInteractions, type PanelElements } from './interactions'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App container not found')
}

const viewer = document.createElement('div')
viewer.id = 'viewer'

const canvas = document.createElement('canvas')
canvas.id = 'renderCanvas'

const panel = document.createElement('div')
panel.id = 'hotspot-panel'

const panelHeader = document.createElement('header')
const panelTitle = document.createElement('h2')
panelTitle.textContent = 'Hotspot'

const panelClose = document.createElement('button')
panelClose.id = 'panel-close'
panelClose.type = 'button'
panelClose.textContent = '×'

panelHeader.append(panelTitle, panelClose)

const panelBody = document.createElement('p')
panelBody.textContent = 'Select a hotspot to learn more.'

panel.append(panelHeader, panelBody)

const debug = document.createElement('div')
debug.id = 'debug-stats'
debug.textContent = 'fps: -- | tris: --'

viewer.append(canvas, panel, debug)
app.append(viewer)

const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true)

const panelElements: PanelElements = {
  panel,
  title: panelTitle,
  body: panelBody,
  closeButton: panelClose
}

const start = async () => {
  const { scene, hotspots } = await createScene(engine, canvas, (message) => {
    panelTitle.textContent = 'Model Load Error'
    panelBody.textContent = message
    panel.classList.add('is-error', 'is-visible')
  })

  setupHotspotInteractions(scene, hotspots, panelElements)

  engine.runRenderLoop(() => {
    scene.render()
    const fps = Math.round(engine.getFps())
    const triangles = Math.round(scene.getActiveIndices() / 3)
    debug.textContent = `${fps} fps | ${triangles} tris`
  })
}

start().catch((error) => {
  panelTitle.textContent = 'Initialization Error'
  panelBody.textContent = error instanceof Error ? error.message : 'Unknown error.'
  panel.classList.add('is-error', 'is-visible')
})

window.addEventListener('resize', () => {
  engine.resize()
})
