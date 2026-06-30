'use client';

import { useEffect, useState } from 'react';
import { getMe, refreshToken } from '@/lib/api/auth.api';
import { getMyPermissions } from '@/lib/api/permissions.api';
import { setAxiosAccessToken } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionStore } from '@/store/permission.store';
import { useThemeStore } from '@/store/theme.store';
import type { AuthUser, UserEntityPermission } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthBootstrapResult {
  accessToken: string;
  user: AuthUser;
  permissions: UserEntityPermission[];
}

let authBootstrapPromise: Promise<AuthBootstrapResult> | null = null;

function bootstrapAuthSession(): Promise<AuthBootstrapResult> {
  if (!authBootstrapPromise) {
    authBootstrapPromise = (async () => {
      const { accessToken } = await refreshToken();
      setAxiosAccessToken(accessToken);

      const user = await getMe();
      const permissions = await getMyPermissions();

      return { accessToken, user, permissions };
    })().finally(() => {
      authBootstrapPromise = null;
    });
  }

  return authBootstrapPromise;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const { setAuth, clearAuth } = useAuthStore();
  const { setPermissions, clearPermissions } = usePermissionStore();
  const setThemePreference = useThemeStore((state) => state.setPreference);

  useEffect(() => {
    async function initialize() {
      if (useAuthStore.getState().isAuthenticated) {
        setIsInitializing(false);
        return;
      }

      // Respect an explicit logout. Skip refresh even if the httpOnly cookie
      // still lingers, for example when the server was unreachable on logout.
      if (sessionStorage.getItem('auth:logged_out') === '1') {
        sessionStorage.removeItem('auth:logged_out');
        clearAuth();
        clearPermissions();
        setIsInitializing(false);
        return;
      }

      try {
        const { accessToken, user, permissions } = await bootstrapAuthSession();
        setThemePreference(user.themePreference);
        setAuth(user, accessToken);
        setPermissions(permissions);
      } catch {
        clearAuth();
        clearPermissions();
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();
  }, [setAuth, clearAuth, setPermissions, clearPermissions, setThemePreference]);

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
