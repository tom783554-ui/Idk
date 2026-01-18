import type { CSSProperties } from 'react';

interface LoadingOverlayProps {
  progress: number;
  status: string;
  visible: boolean;
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.55)',
  color: '#fff',
  fontSize: '1rem',
  gap: '0.5rem',
  zIndex: 5,
};

const barStyle: CSSProperties = {
  width: '240px',
  height: '8px',
  background: 'rgba(255,255,255,0.2)',
  borderRadius: '999px',
  overflow: 'hidden',
};

const fillStyle = (progress: number): CSSProperties => ({
  height: '100%',
  width: `${progress}%`,
  background: '#8bd3ff',
  transition: 'width 0.2s ease',
});

export default function LoadingOverlay({ progress, status, visible }: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div style={overlayStyle}>
      <div>Loading {progress}%</div>
      <div style={barStyle}>
        <div style={fillStyle(progress)} />
      </div>
      <div>{status}</div>
    </div>
  );
}
