// ─── Auth ─────────────────────────────────────────────────────────────────────
export {
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} from './auth.api'

// ─── Users ────────────────────────────────────────────────────────────────────
export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleActive,
  updateProfile,
  updateSettings,
  changePassword,
  getTablePreferences,
  saveTablePreferences,
} from './users.api'

// ─── Permissions ──────────────────────────────────────────────────────────────
export {
  getMyPermissions,
  getAllEntities,
  getUserPermissions,
  getRolePermissions,
  upsertUserPermission,
  upsertRolePermission,
  bulkDeleteUserPermissions,
  bulkDeleteRolePermissions,
} from './permissions.api'

// ─── Admin ────────────────────────────────────────────────────────────────────
export {
  getDashboardStats,
  getAuditLogs,
  getSystemLogs,
  getDailyLoginStats,
} from './admin.api'

// ─── Tenants ──────────────────────────────────────────────────────────────────
export {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  updateTenantStatus,
} from './tenants.api'

// ─── Notifications ────────────────────────────────────────────────────────────
export {
  getMyNotifications,
  createNotification,
  markAsRead,
  markAllRead,
  bulkDeleteNotifications,
} from './notifications.api'
