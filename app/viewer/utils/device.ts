export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const getAdaptiveScale = (): number => {
  if (typeof window === 'undefined') {
    return 1;
  }
  const ratio = window.devicePixelRatio || 1;
  const base = isMobileDevice() ? Math.min(2, ratio) : Math.min(1.5, ratio);
  return 1 / base;
};
