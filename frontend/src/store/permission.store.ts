import { create } from 'zustand'
import type { UserEntityPermission } from '@/types'

// - Types -

type PermissionAction = 'create' | 'read' | 'update' | 'delete'

interface PermissionState {
  permissions: UserEntityPermission[]
  isLoaded: boolean
}

interface PermissionActions {
  setPermissions: (permissions: UserEntityPermission[]) => void
  clearPermissions: () => void
}

interface PermissionComputed {
  /** Returns true if the user can perform the given CRUD action on `entity`. */
  hasPermission: (entity: string, action: PermissionAction) => boolean
  canCreate: (entity: string) => boolean
  canRead: (entity: string) => boolean
  canUpdate: (entity: string) => boolean
  canDelete: (entity: string) => boolean
}

type PermissionStore = PermissionState & PermissionActions & PermissionComputed

// - Store -

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  // - Initial state -
  permissions: [],
  isLoaded: false,

  // - Actions -
  setPermissions: (permissions) => set({ permissions, isLoaded: true }),

  clearPermissions: () => set({ permissions: [], isLoaded: false }),

  // - Computed helpers -
  hasPermission: (entity, action) => {
    const perm = get().permissions.find((p) => p.entityName === entity)
    if (!perm) return false
    switch (action) {
      case 'create':
        return perm.canCreate
      case 'read':
        return perm.canRead
      case 'update':
        return perm.canUpdate
      case 'delete':
        return perm.canDelete
      default:
        return false
    }
  },

  canCreate: (entity) => get().hasPermission(entity, 'create'),
  canRead: (entity) => get().hasPermission(entity, 'read'),
  canUpdate: (entity) => get().hasPermission(entity, 'update'),
  canDelete: (entity) => get().hasPermission(entity, 'delete'),
}))
