export const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

export const isReloadNavigation = () => {
  const navigation = performance.getEntriesByType?.('navigation')?.[0];
  return navigation?.type === 'reload';
};

export const hasExceededDuration = (timestamp, seconds) => {
  if (!timestamp || seconds === 0) return true;
  if (seconds < 0) return false;
  return Date.now() - timestamp > seconds * 1000;
};
