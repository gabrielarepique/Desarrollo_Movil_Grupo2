import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export function useUser() {
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState((nextUser) => {
      setUser(nextUser);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    displayName: user?.displayName || user?.email?.split('@')[0] || 'Usuario',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
    initials: (user?.displayName || user?.email || 'U').slice(0, 1).toUpperCase(),
    logout: authService.logout,
  };
}
