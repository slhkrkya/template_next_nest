'use client';

import { usePermissions } from '@/hooks/usePermissions';

type PermissionAction = 'create' | 'read' | 'update' | 'delete';

interface PermissionGuardProps {
  /** The entity name to check permissions for (e.g. "User", "Tenant") */
  entity: string;
  /** The CRUD action the user must hold in order to see the children */
  action: PermissionAction;
  /** Rendered when the user does NOT have the required permission.
   *  Defaults to null (nothing rendered). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGuard conditionally renders its children based on whether the
 * currently authenticated user holds the required entity + action permission.
 *
 * While permissions are still loading from the store the children are hidden
 * (same as if permission is absent) to avoid a flash of unauthorised content.
 *
 * @example
 * <PermissionGuard entity="Tenant" action="create">
 *   <Button>Create Tenant</Button>
 * </PermissionGuard>
 *
 * @example
 * <PermissionGuard entity="User" action="delete" fallback={<p>No permission</p>}>
 *   <DeleteUserButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  entity,
  action,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { isLoaded, hasPermission } = usePermissions();

  // While the permission store is hydrating, render nothing to avoid a flash.
  if (!isLoaded) return null;

  if (!hasPermission(entity, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
