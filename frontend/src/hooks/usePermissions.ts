'use client'

import { usePermissionStore } from '@/store/permission.store'

type PermissionAction = 'create' | 'read' | 'update' | 'delete'

/**
 * usePermissions exposes per-entity CRUD checks backed by the permission store.
 *
 * Example:
 *   const { canCreate, canDelete } = usePermissions()
 *   if (!canCreate('Invoice')) return null
 */
export function usePermissions() {
  const {
    permissions,
    isLoaded,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  } = usePermissionStore()

  /**
   * Check any combination of actions at once.
   * Returns true only if the user holds ALL of the requested actions.
   */
  function hasAllPermissions(
    entity: string,
    actions: PermissionAction[],
  ): boolean {
    return actions.every((action) => hasPermission(entity, action))
  }

  /**
   * Check any combination of actions at once.
   * Returns true if the user holds ANY of the requested actions.
   */
  function hasAnyPermission(
    entity: string,
    actions: PermissionAction[],
  ): boolean {
    return actions.some((action) => hasPermission(entity, action))
  }

  return {
    permissions,
    isLoaded,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  }
}
