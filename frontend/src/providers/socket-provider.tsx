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
    const permissionsSocket = io(`${SOCKET_URL}/permissions`, socketOptions);
    permissionsSocketRef.current = permissionsSocket;

    permissionsSocket.on('connect', () => {
      console.debug('[SocketProvider] Connected to /permissions namespace');
    });

    permissionsSocket.on('permissions-updated', async () => {
      try {
        const permissions = await getMyPermissions();
        setPermissions(permissions);
      } catch (error) {
        console.error('[SocketProvider] Failed to refresh permissions', error);
      }
    });

    permissionsSocket.on('disconnect', (reason: string) => {
      console.debug('[SocketProvider] Disconnected from /permissions:', reason);
    });

    // Notifications namespace
    const notificationsSocket = io(`${SOCKET_URL}/notifications`, socketOptions);
    notificationsSocketRef.current = notificationsSocket;

    notificationsSocket.on('connect', () => {
      console.debug('[SocketProvider] Connected to /notifications namespace');
    });

    notificationsSocket.on('new-notification', (notification: Notification) => {
      addNotification(notification);
    });

    notificationsSocket.on('disconnect', (reason: string) => {
      console.debug('[SocketProvider] Disconnected from /notifications:', reason);
    });

    return () => {
      permissionsSocket.disconnect();
      permissionsSocketRef.current = null;
      notificationsSocket.disconnect();
      notificationsSocketRef.current = null;
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
