'use client'

import { useCallback, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { getAccessToken } from '@/store/auth.store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseSocketOptions {
  /** Socket.io namespace, e.g. '/notifications'. Defaults to '/'. */
  namespace?: string
  /** Whether to connect automatically. Defaults to true. */
  autoConnect?: boolean
  /** The user ID to join a private room on connect. */
  userId?: string
}

interface UseSocketReturn {
  /**
   * Register a handler for a named event. Returns an unsubscribe function.
   * Re-registering the same event key replaces the previous handler.
   */
  on: <T = unknown>(event: string, handler: (data: T) => void) => () => void
  /** Emit an event to the server. */
  emit: <T = unknown>(event: string, data?: T) => void
  /** Manually connect if autoConnect was false. */
  connect: () => void
  /** Disconnect from the server. */
  disconnect: () => void
  /** Whether the socket is currently connected. */
  isConnected: () => boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSocket manages a Socket.io connection for the given namespace.
 *
 * The socket is created once and kept in a ref so it persists across renders.
 * Automatic reconnection is handled by socket.io-client.
 *
 * Example:
 *   const { on, emit } = useSocket({ namespace: '/notifications', userId: user.id })
 *   useEffect(() => on('notification', handleNotification), [])
 */
export function useSocket({
  namespace = '/',
  autoConnect = true,
  userId,
}: UseSocketOptions = {}): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null)

  // Initialize the socket once
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001'
    const fullUrl = namespace === '/' ? wsUrl : `${wsUrl}${namespace}`

    const socket = io(fullUrl, {
      autoConnect,
      withCredentials: true,
      auth: {
        token: getAccessToken(),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    })

    socketRef.current = socket

    // Join the user-specific room so the server can target this client
    socket.on('connect', () => {
      if (userId) {
        socket.emit('join-room', { userId })
      }
    })

    socket.on('disconnect', (reason) => {
      // If the server disconnected us, attempt a manual reconnect after a delay
      if (reason === 'io server disconnect') {
        setTimeout(() => socket.connect(), 2000)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, userId])

  // ── Public API ─────────────────────────────────────────────────────────────

  const on = useCallback(
    <T = unknown>(event: string, handler: (data: T) => void): (() => void) => {
      const socket = socketRef.current
      if (!socket) return () => {}

      socket.on(event, handler as (...args: unknown[]) => void)
      return () => {
        socket.off(event, handler as (...args: unknown[]) => void)
      }
    },
    [],
  )

  const emit = useCallback(<T = unknown>(event: string, data?: T): void => {
    socketRef.current?.emit(event, data)
  }, [])

  const connect = useCallback((): void => {
    socketRef.current?.connect()
  }, [])

  const disconnect = useCallback((): void => {
    socketRef.current?.disconnect()
  }, [])

  const isConnected = useCallback((): boolean => {
    return socketRef.current?.connected ?? false
  }, [])

  return { on, emit, connect, disconnect, isConnected }
}
