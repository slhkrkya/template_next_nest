import { create } from 'zustand'
import type { Notification } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationState {
  unreadCount: number
  notifications: Notification[]
}

interface NotificationActions {
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  setNotifications: (notifications: Notification[]) => void
  /** Prepend a newly arrived notification (e.g. from a WebSocket push). */
  addNotification: (notification: Notification) => void
  /** Mark a single notification as read in the local store. */
  markRead: (id: string) => void
  /** Mark all notifications as read. */
  markAllRead: () => void
  /** Clear all notifications. */
  clearNotifications: () => void
}

type NotificationStore = NotificationState & NotificationActions

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  unreadCount: 0,
  notifications: [],

  // ── Actions ────────────────────────────────────────────────────────────────
  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      // Only bump the badge for genuinely unread items
      unreadCount: notification.isRead
        ? state.unreadCount
        : state.unreadCount + 1,
    }))
  },

  markRead: (id) => {
    const target = get().notifications.find((n) => n.id === id)
    if (!target || target.isRead) return

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))
