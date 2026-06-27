'use client';

import { useEffect, useRef, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePermissionStore } from '@/store/permission.store';
import { useNotificationStore } from '@/store/notification.store';
import { useAuthStore } from '@/store/auth.store';
import { getMyPermissions } from '@/lib/api/permissions.api';
import type { Notification } from '@/types';

interface SocketContextValue {
  permissionsSocket: Socket | null;
  notificationsSocket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({
  permissionsSocket: null,
  notificationsSocket: null,
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: React.ReactNode;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function SocketProvider({ children }: SocketProviderProps) {
  const permissionsSocketRef = useRef<Socket | null>(null);
  const notificationsSocketRef = useRef<Socket | null>(null);

  const { isAuthenticated, accessToken } = useAuthStore();
  const { setPermissions } = usePermissionStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socketOptions = {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    // Permissions namespace
    permissionsSocketRef.current = io(`${SOCKET_URL}/permissions`, socketOptions);

    permissionsSocketRef.current.on('connect', () => {
      console.debug('[SocketProvider] Connected to /permissions namespace');
    });

    permissionsSocketRef.current.on('permissions-updated', async () => {
      try {
        const permissions = await getMyPermissions();
        setPermissions(permissions);
      } catch (error) {
        console.error('[SocketProvider] Failed to refresh permissions', error);
      }
    });

    permissionsSocketRef.current.on('disconnect', (reason: string) => {
      console.debug('[SocketProvider] Disconnected from /permissions:', reason);
    });

    // Notifications namespace
    notificationsSocketRef.current = io(`${SOCKET_URL}/notifications`, socketOptions);

    notificationsSocketRef.current.on('connect', () => {
      console.debug('[SocketProvider] Connected to /notifications namespace');
    });

    notificationsSocketRef.current.on('new-notification', (notification: Notification) => {
      addNotification(notification);
    });

    notificationsSocketRef.current.on('disconnect', (reason: string) => {
      console.debug('[SocketProvider] Disconnected from /notifications:', reason);
    });

    return () => {
      permissionsSocketRef.current?.disconnect();
      notificationsSocketRef.current?.disconnect();
    };
  }, [isAuthenticated, accessToken, setPermissions, addNotification]);

  return (
    <SocketContext.Provider
      value={{
        permissionsSocket: permissionsSocketRef.current,
        notificationsSocket: notificationsSocketRef.current,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
