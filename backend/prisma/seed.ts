import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Data definitions
// ---------------------------------------------------------------------------

const PERMISSION_ENTITIES = [
  { name: 'Users', displayName: 'Users', displayOrder: 10 },
  { name: 'Roles', displayName: 'Roles', displayOrder: 20 },
  { name: 'Permissions', displayName: 'Permissions', displayOrder: 30 },
  { name: 'AuditLogs', displayName: 'Audit Logs', displayOrder: 40 },
  { name: 'EmailParameters', displayName: 'Email Parameters', displayOrder: 50 },
  { name: 'IpBans', displayName: 'IP Bans', displayOrder: 60 },
  { name: 'RateLimits', displayName: 'Rate Limits', displayOrder: 70 },
  { name: 'DataScopes', displayName: 'Data Scopes', displayOrder: 80 },
  { name: 'Tenants', displayName: 'Tenants', displayOrder: 90 },
  { name: 'SubscriptionPlans', displayName: 'Subscription Plans', displayOrder: 100 },
  { name: 'Notifications', displayName: 'Notifications', displayOrder: 110 },
  { name: 'EntityWorkflows', displayName: 'Entity Workflows', displayOrder: 120 },
  { name: 'Files', displayName: 'Files', displayOrder: 130 },
] as const;

const OPERATION_CLAIMS = [
  { name: 'SuperAdmin', description: 'Full system access without tenant restrictions', priority: 999 },
  { name: 'Admin', description: 'Tenant-level administrative access', priority: 100 },
  { name: 'User', description: 'Standard end-user access', priority: 0 },
] as const;

const ADMIN_MANAGED_ENTITIES = [
  'Users',
  'Roles',
  'Permissions',
  'AuditLogs',
  'EmailParameters',
  'IpBans',
  'RateLimits',
  'DataScopes',
  'Notifications',
  'EntityWorkflows',
  'Files',
] as const;

const ROLE_ENTITY_PERMISSIONS = [
  ...ADMIN_MANAGED_ENTITIES.map((entityName) => ({
    roleName: 'Admin',
    entityName,
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  })),
  {
    roleName: 'Admin',
    entityName: 'SubscriptionPlans',
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  },
  {
    roleName: 'User',
    entityName: 'Notifications',
    canCreate: false,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  },
  {
    roleName: 'User',
    entityName: 'Files',
    canCreate: true,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  },
] as const;

const SUBSCRIPTION_PLANS = [
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'Perfect for small teams getting started.',
    maxUsers: 5,
    maxStorageBytes: BigInt(5 * 1024 * 1024 * 1024),
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    quarterlyPrice: 27.99,
    features: {
      sso: false,
      apiAccess: false,
      prioritySupport: false,
      customDomain: false,
    },
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'For growing teams that need more power.',
    maxUsers: 25,
    maxStorageBytes: BigInt(50 * 1024 * 1024 * 1024),
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    quarterlyPrice: 84.99,
    features: {
      sso: true,
      apiAccess: true,
      prioritySupport: false,
      customDomain: false,
    },
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Unlimited scale with premium support.',
    maxUsers: 1000,
    maxStorageBytes: BigInt(500 * 1024 * 1024 * 1024),
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    quarterlyPrice: 279.99,
    features: {
      sso: true,
      apiAccess: true,
      prioritySupport: true,
      customDomain: true,
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hashPassword(plain: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(plain, saltRounds);
}

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedPermissionEntities(): Promise<void> {
  console.log('Seeding PermissionEntities...');

  for (const entity of PERMISSION_ENTITIES) {
    await prisma.permissionEntity.upsert({
      where: { name: entity.name },
      update: {
        displayName: entity.displayName,
        displayOrder: entity.displayOrder,
        isActive: true,
      },
      create: {
        name: entity.name,
        displayName: entity.displayName,
        displayOrder: entity.displayOrder,
        isActive: true,
      },
    });
  }

  console.log(`  ${PERMISSION_ENTITIES.length} PermissionEntities upserted.`);
}

async function seedOperationClaims(): Promise<void> {
  console.log('Seeding OperationClaims...');

  for (const claim of OPERATION_CLAIMS) {
    await prisma.operationClaim.upsert({
      where: { name: claim.name },
      update: {
        description: claim.description,
        priority: claim.priority,
        isActive: true,
      },
      create: {
        name: claim.name,
        description: claim.description,
        priority: claim.priority,
        isActive: true,
      },
    });
  }

  console.log(`  ${OPERATION_CLAIMS.length} OperationClaims upserted.`);
}

async function seedRoleEntityPermissions(): Promise<void> {
  console.log('Seeding RoleEntityPermissions...');

  let upsertedCount = 0;

  for (const permission of ROLE_ENTITY_PERMISSIONS) {
    const role = await prisma.operationClaim.findUnique({
      where: { name: permission.roleName },
    });

    if (!role) {
      console.warn(`  Role not found, skipping permissions for ${permission.roleName}.`);
      continue;
    }

    await prisma.roleEntityPermission.upsert({
      where: {
        operationClaimId_entityName: {
          operationClaimId: role.id,
          entityName: permission.entityName,
        },
      },
      update: {
        canCreate: permission.canCreate,
        canRead: permission.canRead,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
      },
      create: {
        operationClaimId: role.id,
        entityName: permission.entityName,
        canCreate: permission.canCreate,
        canRead: permission.canRead,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
      },
    });

    upsertedCount += 1;
  }

  console.log(`  ${upsertedCount} RoleEntityPermissions upserted.`);
}

async function seedSuperAdminUser(): Promise<void> {
  console.log('Seeding SuperAdmin user...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';
  const passwordHash = await hashPassword(adminPassword);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isSuperAdmin: true,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      userName: 'superadmin',
      isSuperAdmin: true,
      isActive: true,
    },
  });

  const superAdminClaim = await prisma.operationClaim.findUnique({
    where: { name: 'SuperAdmin' },
  });

  if (superAdminClaim) {
    const alreadyAssigned = await prisma.userOperationClaim.findFirst({
      where: {
        userId: user.id,
        operationClaimId: superAdminClaim.id,
        tenantId: null,
      },
    });

    if (!alreadyAssigned) {
      await prisma.userOperationClaim.create({
        data: {
          userId: user.id,
          operationClaimId: superAdminClaim.id,
          tenantId: null,
        },
      });
      console.log('  SuperAdmin OperationClaim assigned to user.');
    } else {
      console.log('  SuperAdmin OperationClaim already assigned, skipped.');
    }
  }

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`  SuperAdmin user ready: ${adminEmail}`);
}

async function seedSubscriptionPlans(): Promise<void> {
  console.log('Seeding SubscriptionPlans...');

  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {
        displayName: plan.displayName,
        description: plan.description,
        maxUsers: plan.maxUsers,
        maxStorageBytes: plan.maxStorageBytes,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        quarterlyPrice: plan.quarterlyPrice,
        features: plan.features,
        isActive: true,
      },
      create: {
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        maxUsers: plan.maxUsers,
        maxStorageBytes: plan.maxStorageBytes,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        quarterlyPrice: plan.quarterlyPrice,
        features: plan.features,
        isActive: true,
      },
    });
  }

  console.log(`  ${SUBSCRIPTION_PLANS.length} SubscriptionPlans upserted.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Starting database seed...\n');

  await seedPermissionEntities();
  await seedOperationClaims();
  await seedRoleEntityPermissions();
  await seedSuperAdminUser();
  await seedSubscriptionPlans();

  console.log('\nSeed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
