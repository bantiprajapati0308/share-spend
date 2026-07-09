import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { ensureUserProfile } from './hooks/useUserProfile';
import AuthModule from './modules/Auth';
import FullScreenLoader from './components/common/FullScreenLoader';
import MaintenancePage from './components/MaintenancePage';
import { SecurityProvider } from './context/SecurityContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute';
import AppContent from './components/AppContent';

const IS_MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthLoading(true);
        await ensureUserProfile(firebaseUser);
      }

      setUser(firebaseUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (IS_MAINTENANCE) {
    return <MaintenancePage />;
  }

  if (isAuthLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <AuthModule />;
  }

  return (
    <SecurityProvider user={user}>
      <ProtectedRoute>
        <AppContent user={user} />
      </ProtectedRoute>
    </SecurityProvider>
  );
}

export default App;
