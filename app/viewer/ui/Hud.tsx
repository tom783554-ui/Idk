import type { CSSProperties } from 'react';

interface HudProps {
  fps: number;
  meshes: number;
  triangles: number;
}

const hudStyle: CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: 'rgba(0,0,0,0.55)',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.5rem',
  fontSize: '0.8rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  zIndex: 4,
};

export default function Hud({ fps, meshes, triangles }: HudProps) {
  return (
    <div style={hudStyle}>
      <div>FPS: {fps.toFixed(0)}</div>
      <div>Meshes: {meshes}</div>
      <div>Triangles: {triangles.toLocaleString()}</div>
    </div>
  );
}
