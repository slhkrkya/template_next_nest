export {
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} from './auth.api'

export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleActive,
  updateProfile,
  updateSettings,
  getThemePreference,
  updateThemePreference,
  changePassword,
  getTablePreferences,
  saveTablePreferences,
} from './users.api'

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

export {
  getDashboardStats,
  getAuditLogs,
  getSystemLogs,
  getDailyLoginStats,
} from './admin.api'

export {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  updateTenantStatus,
} from './tenants.api'

export {
  getMyNotifications,
  createNotification,
  markAsRead,
  markAllRead,
  bulkDeleteNotifications,
} from './notifications.api'
