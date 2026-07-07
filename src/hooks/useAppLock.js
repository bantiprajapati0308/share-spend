import { useContext } from 'react';
import { SecurityContext } from '../context/SecurityContext';

export function useAppLock() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useAppLock must be used inside SecurityProvider.');
  }
  return context;
}
