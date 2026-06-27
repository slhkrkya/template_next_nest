'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionStore } from '@/store/permission.store';
import { getMe, refreshToken } from '@/lib/api/auth.api';
import { getMyPermissions } from '@/lib/api/permissions.api';
import { setAxiosAccessToken } from '@/lib/axios';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const { setAuth, clearAuth } = useAuthStore();
  const { setPermissions, clearPermissions } = usePermissionStore();

  useEffect(() => {
    async function initialize() {
      try {
        const { accessToken } = await refreshToken();
        setAxiosAccessToken(accessToken);

        const user = await getMe();
        setAuth(user, accessToken);

        const permissions = await getMyPermissions();
        setPermissions(permissions);
      } catch {
        clearAuth();
        clearPermissions();
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();
  }, [setAuth, clearAuth, setPermissions, clearPermissions]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
