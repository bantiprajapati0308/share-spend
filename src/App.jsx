import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { ensureUserProfile } from './hooks/useUserProfile';
import AuthModule from './modules/Auth';
import StartupScreen from './components/common/StartupScreen';
import MaintenancePage from './components/MaintenancePage';
import { SecurityProvider } from './context/SecurityContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute';
import AppContent from './components/AppContent';

const IS_MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);

  useEffect(() => {
    let active = true;
    let profileRequestId = 0;
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (!active) return;
      const requestId = ++profileRequestId;
      setUser(firebaseUser);
      setIsAuthLoading(false);

      if (!firebaseUser) {
        setIsProfileReady(false);
        return;
      }

      setIsProfileReady(false);
      ensureUserProfile(firebaseUser).finally(() => {
        if (active && requestId === profileRequestId) setIsProfileReady(true);
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (IS_MAINTENANCE) {
    return <MaintenancePage />;
  }

  if (isAuthLoading) {
    return <StartupScreen message="Checking your session..." />;
  }

  if (!user) {
    return <AuthModule />;
  }

  return (
    <SecurityProvider user={user}>
      <ProtectedRoute>
        <AppContent user={user} profileReady={isProfileReady} />
      </ProtectedRoute>
    </SecurityProvider>
  );
}

export default App;
