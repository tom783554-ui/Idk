import { PointerEventTypes, Scene } from '@babylonjs/core'
import type { Hotspot } from './scene'

export type PanelElements = {
  panel: HTMLDivElement
  title: HTMLHeadingElement
  body: HTMLParagraphElement
  closeButton: HTMLButtonElement
}

export const setupHotspotInteractions = (
  scene: Scene,
  hotspots: Hotspot[],
  panelElements: PanelElements
) => {
  const { panel, title, body, closeButton } = panelElements

  const showPanel = (panelTitle: string, panelBody: string) => {
    title.textContent = panelTitle
    body.textContent = panelBody
    panel.classList.remove('is-error')
    panel.classList.add('is-visible')
  }

  const hidePanel = () => {
    panel.classList.remove('is-visible')
    panel.classList.remove('is-error')
  }

  closeButton.addEventListener('click', (event) => {
    event.stopPropagation()
    hidePanel()
  })

  document.addEventListener('pointerdown', (event) => {
    if (!panel.classList.contains('is-visible')) {
      return
    }

    const target = event.target as Node
    if (!panel.contains(target)) {
      hidePanel()
    }
  })

  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== PointerEventTypes.POINTERPICK) {
      return
    }

    const pickInfo = pointerInfo.pickInfo
    if (!pickInfo?.hit || !pickInfo.pickedMesh) {
      hidePanel()
      return
    }

    const metadata = pickInfo.pickedMesh.metadata as { hotspot?: Hotspot['data'] } | undefined
    if (metadata?.hotspot) {
      showPanel(metadata.hotspot.title, metadata.hotspot.body)
      return
    }

    const isHotspot = hotspots.some((hotspot) => hotspot.mesh === pickInfo.pickedMesh)
    if (!isHotspot) {
      hidePanel()
    }
  })
}
