import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Get bcrypt rounds from environment or use default
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning up existing data...");
  await prisma.userLog.deleteMany({});
  await prisma.userPermission.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});

  // ============================================
  // STEP 1: Create Permissions
  // ============================================
  console.log("🔑 Creating permissions...");

  const permissionsData = [
    // User Management Permissions
    {
      resource: "users",
      action: "view",
      code: "users:view",
      description: "Can view user list and details",
      category: "users",
    },
    {
      resource: "users",
      action: "create",
      code: "users:create",
      description: "Can create new users",
      category: "users",
    },
    {
      resource: "users",
      action: "update",
      code: "users:update",
      description: "Can update user information",
      category: "users",
    },
    {
      resource: "users",
      action: "delete",
      code: "users:delete",
      description: "Can delete users",
      category: "users",
    },

    // Asset Management Permissions
    {
      resource: "assets",
      action: "view",
      code: "assets:view",
      description: "Can view asset list and details",
      category: "assets",
    },
    {
      resource: "assets",
      action: "create",
      code: "assets:create",
      description: "Can create new assets",
      category: "assets",
    },
    {
      resource: "assets",
      action: "update",
      code: "assets:update",
      description: "Can update asset information",
      category: "assets",
    },
    {
      resource: "assets",
      action: "delete",
      code: "assets:delete",
      description: "Can delete assets",
      category: "assets",
    },
    {
      resource: "assets",
      action: "assign",
      code: "assets:assign",
      description: "Can assign assets to users",
      category: "assets",
    },
    {
      resource: "assets",
      action: "transfer",
      code: "assets:transfer",
      description: "Can transfer assets between users",
      category: "assets",
    },

    // CMS Permissions
    {
      resource: "posts",
      action: "view",
      code: "posts:view",
      description: "Can view blog posts",
      category: "content",
    },
    {
      resource: "posts",
      action: "create",
      code: "posts:create",
      description: "Can create blog posts",
      category: "content",
    },
    {
      resource: "posts",
      action: "update",
      code: "posts:update",
      description: "Can update blog posts",
      category: "content",
    },
    {
      resource: "posts",
      action: "delete",
      code: "posts:delete",
      description: "Can delete blog posts",
      category: "content",
    },
    {
      resource: "posts",
      action: "publish",
      code: "posts:publish",
      description: "Can publish blog posts",
      category: "content",
    },
    {
      resource: "posts",
      action: "unpublish",
      code: "posts:unpublish",
      description: "Can unpublish blog posts",
      category: "content",
    },
    {
      resource: "pages",
      action: "view",
      code: "pages:view",
      description: "Can view CMS pages",
      category: "content",
    },
    {
      resource: "pages",
      action: "create",
      code: "pages:create",
      description: "Can create CMS pages",
      category: "content",
    },
    {
      resource: "pages",
      action: "update",
      code: "pages:update",
      description: "Can update CMS pages",
      category: "content",
    },
    {
      resource: "pages",
      action: "delete",
      code: "pages:delete",
      description: "Can delete CMS pages",
      category: "content",
    },
    {
      resource: "media",
      action: "view",
      code: "media:view",
      description: "Can view media library",
      category: "content",
    },
    {
      resource: "media",
      action: "upload",
      code: "media:upload",
      description: "Can upload media files",
      category: "content",
    },
    {
      resource: "media",
      action: "delete",
      code: "media:delete",
      description: "Can delete media files",
      category: "content",
    },

    // Invoice Management Permissions
    {
      resource: "invoices",
      action: "view",
      code: "invoices:view",
      description: "Can view invoices",
      category: "finance",
    },
    {
      resource: "invoices",
      action: "create",
      code: "invoices:create",
      description: "Can create new invoices",
      category: "finance",
    },
    {
      resource: "invoices",
      action: "update",
      code: "invoices:update",
      description: "Can update invoice details",
      category: "finance",
    },
    {
      resource: "invoices",
      action: "delete",
      code: "invoices:delete",
      description: "Can delete invoices",
      category: "finance",
    },
    {
      resource: "invoices",
      action: "approve",
      code: "invoices:approve",
      description: "Can approve invoices for payment",
      category: "finance",
    },
    {
      resource: "invoices",
      action: "pay",
      code: "invoices:pay",
      description: "Can mark invoices as paid",
      category: "finance",
    },
    {
      resource: "invoices",
      action: "send",
      code: "invoices:send",
      description: "Can send invoices to clients",
      category: "finance",
    },
    {
      resource: "payments",
      action: "view",
      code: "payments:view",
      description: "Can view payment records",
      category: "finance",
    },
    {
      resource: "payments",
      action: "create",
      code: "payments:create",
      description: "Can record payments",
      category: "finance",
    },
    {
      resource: "payments",
      action: "refund",
      code: "payments:refund",
      description: "Can process refunds",
      category: "finance",
    },

    // Role & Permission Management
    {
      resource: "roles",
      action: "view",
      code: "roles:view",
      description: "Can view roles and permissions",
      category: "rbac",
    },
    {
      resource: "roles",
      action: "create",
      code: "roles:create",
      description: "Can create new roles",
      category: "rbac",
    },
    {
      resource: "roles",
      action: "update",
      code: "roles:update",
      description: "Can update role permissions",
      category: "rbac",
    },
    {
      resource: "roles",
      action: "delete",
      code: "roles:delete",
      description: "Can delete roles",
      category: "rbac",
    },
    {
      resource: "permissions",
      action: "assign",
      code: "permissions:assign",
      description: "Can assign permissions to users",
      category: "rbac",
    },

    // System Settings
    {
      resource: "settings",
      action: "view",
      code: "settings:view",
      description: "Can view system settings",
      category: "system",
    },
    {
      resource: "settings",
      action: "update",
      code: "settings:update",
      description: "Can update system settings",
      category: "system",
    },
    {
      resource: "logs",
      action: "view",
      code: "logs:view",
      description: "Can view system logs",
      category: "system",
    },
    {
      resource: "reports",
      action: "view",
      code: "reports:view",
      description: "Can view reports",
      category: "system",
    },
    {
      resource: "reports",
      action: "export",
      code: "reports:export",
      description: "Can export reports",
      category: "system",
    },
  ];

  const permissions = await prisma.$transaction(
    permissionsData.map((perm) => prisma.permission.create({ data: perm }))
  );
  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // STEP 2: Create Roles
  // ============================================
  console.log("👥 Creating roles...");

  // Super Admin Role (priority 1000 - highest)
  const superAdminRole = await prisma.role.create({
    data: {
      name: "Super Admin",
      description: "Full system access with all permissions",
      priority: 1000,
      isSystem: true,
    },
  });

  // Admin Role (priority 900)
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Administrative access to most features",
      priority: 900,
      isSystem: true,
    },
  });

  // Manager Role (priority 500)
  const managerRole = await prisma.role.create({
    data: {
      name: "Manager",
      description: "Can manage assets, approve invoices, and publish content",
      priority: 500,
      isSystem: false,
    },
  });

  // Editor Role (priority 400)
  const editorRole = await prisma.role.create({
    data: {
      name: "Editor",
      description: "Can manage content and media",
      priority: 400,
      isSystem: false,
    },
  });

  // Accountant Role (priority 300)
  const accountantRole = await prisma.role.create({
    data: {
      name: "Accountant",
      description: "Can manage invoices and payments",
      priority: 300,
      isSystem: false,
    },
  });

  // User Role (priority 100)
  const userRole = await prisma.role.create({
    data: {
      name: "User",
      description: "Basic user with view-only access",
      priority: 100,
      isSystem: true,
    },
  });

  console.log("✅ Created 6 roles");

  // ============================================
  // STEP 3: Assign Permissions to Roles
  // ============================================
  console.log("🔗 Assigning permissions to roles...");

  // Helper function to get permission IDs by codes
  const getPermissionIds = (codes) => {
    return permissions.filter((p) => codes.includes(p.code)).map((p) => p.id);
  };

  // Super Admin - ALL permissions
  const allPermissionCodes = permissionsData.map((p) => p.code);
  await prisma.$transaction(
    getPermissionIds(allPermissionCodes).map((permissionId) =>
      prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId,
        },
      })
    )
  );
  console.log(`✅ Super Admin: ${allPermissionCodes.length} permissions`);

  // Admin - Most permissions except critical system ones
  const adminPermissions = [
    "users:view",
    "users:create",
    "users:update",
    "assets:view",
    "assets:create",
    "assets:update",
    "assets:delete",
    "assets:assign",
    "assets:transfer",
    "posts:view",
    "posts:create",
    "posts:update",
    "posts:delete",
    "posts:publish",
    "posts:unpublish",
    "pages:view",
    "pages:create",
    "pages:update",
    "pages:delete",
    "media:view",
    "media:upload",
    "media:delete",
    "invoices:view",
    "invoices:create",
    "invoices:update",
    "invoices:approve",
    "invoices:pay",
    "invoices:send",
    "payments:view",
    "payments:create",
    "roles:view",
    "settings:view",
    "logs:view",
    "reports:view",
    "reports:export",
  ];
  await prisma.$transaction(
    getPermissionIds(adminPermissions).map((permissionId) =>
      prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId,
        },
      })
    )
  );
  console.log(`✅ Admin: ${adminPermissions.length} permissions`);

  // Manager - Asset, Invoice approval, Content publishing
  const managerPermissions = [
    "users:view",
    "assets:view",
    "assets:create",
    "assets:update",
    "assets:assign",
    "assets:transfer",
    "posts:view",
    "posts:create",
    "posts:update",
    "posts:publish",
    "posts:unpublish",
    "pages:view",
    "pages:update",
    "media:view",
    "media:upload",
    "invoices:view",
    "invoices:create",
    "invoices:update",
    "invoices:approve",
    "invoices:send",
    "payments:view",
    "reports:view",
  ];
  await prisma.$transaction(
    getPermissionIds(managerPermissions).map((permissionId) =>
      prisma.rolePermission.create({
        data: {
          roleId: managerRole.id,
          permissionId,
        },
      })
    )
  );
  console.log(`✅ Manager: ${managerPermissions.length} permissions`);

  // Editor - Content and Media management
  const editorPermissions = [
    "posts:view",
    "posts:create",
    "posts:update",
    "posts:delete",
    "pages:view",
    "pages:create",
    "pages:update",
    "media:view",
    "media:upload",
    "media:delete",
  ];
  await prisma.$transaction(
    getPermissionIds(editorPermissions).map((permissionId) =>
      prisma.rolePermission.create({
        data: {
          roleId: editorRole.id,
          permissionId,
        },
      })
    )
  );
  console.log(`✅ Editor: ${editorPermissions.length} permissions`);

  // Accountant - Invoice and Payment management
  const accountantPermissions = [
    "invoices:view",
    "invoices:create",
    "invoices:update",
    "invoices:send",
    "payments:view",
    "payments:create",
    "payments:refund",
    "reports:view",
    "reports:export",
  ];
  await prisma.$transaction(
    getPermissionIds(accountantPermissions).map((permissionId) =>
      prisma.rolePermission.create({
        data: {
          roleId: accountantRole.id,
          permissionId,
        },
      })
    )
  );
  console.log(`✅ Accountant: ${accountantPermissions.length} permissions`);

  // User - Basic view permissions
  const userPermissions = ["assets:view", "posts:view", "pages:view", "media:view"];
  await prisma.$transaction(
    getPermissionIds(userPermissions).map((permissionId) =>
      prisma.rolePermission.create({
        data: {
          roleId: userRole.id,
          permissionId,
        },
      })
    )
  );
  console.log(`✅ User: ${userPermissions.length} permissions`);

  // ============================================
  // STEP 4: Create Users with Roles
  // ============================================
  console.log("👤 Creating users...");

  // Hash passwords
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", bcryptRounds);
  const userPassword = await bcrypt.hash("user123", bcryptRounds);
  const testPassword = await bcrypt.hash("test123", bcryptRounds);

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      username: process.env.ADMIN_NAME || "superadmin",
      name: "Super Admin",
      passwordHash: adminPassword,
      roleId: superAdminRole.id,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567890",
    },
  });
  console.log(`✅ Created Super Admin: ${superAdmin.username} (${superAdmin.email})`);

  const admin = await prisma.user.create({
    data: {
      email: "admin.user@example.com",
      username: "admin",
      name: "Admin User",
      passwordHash: adminPassword,
      roleId: adminRole.id,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567891",
    },
  });
  console.log(`✅ Created Admin: ${admin.username} (${admin.email})`);

  const manager = await prisma.user.create({
    data: {
      email: "manager@example.com",
      username: "manager",
      name: "Manager User",
      passwordHash: userPassword,
      roleId: managerRole.id,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567892",
    },
  });
  console.log(`✅ Created Manager: ${manager.username} (${manager.email})`);

  const editor = await prisma.user.create({
    data: {
      email: "editor@example.com",
      username: "editor",
      name: "Editor User",
      passwordHash: userPassword,
      roleId: editorRole.id,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567893",
    },
  });
  console.log(`✅ Created Editor: ${editor.username} (${editor.email})`);

  const accountant = await prisma.user.create({
    data: {
      email: "accountant@example.com",
      username: "accountant",
      name: "Accountant User",
      passwordHash: userPassword,
      roleId: accountantRole.id,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567894",
    },
  });
  console.log(`✅ Created Accountant: ${accountant.username} (${accountant.email})`);

  const user1 = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      username: "johndoe",
      name: "John Doe",
      passwordHash: userPassword,
      roleId: userRole.id,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567895",
    },
  });
  console.log(`✅ Created User: ${user1.username} (${user1.email})`);

  const user2 = await prisma.user.create({
    data: {
      email: "jane.smith@example.com",
      username: "janesmith",
      name: "Jane Smith",
      passwordHash: userPassword,
      roleId: userRole.id,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567896",
    },
  });
  console.log(`✅ Created User: ${user2.username} (${user2.email})`);

  const testUser = await prisma.user.create({
    data: {
      email: "test.user@example.com",
      username: "testuser",
      name: "Test User",
      passwordHash: testPassword,
      roleId: userRole.id,
      status: "ACTIVE",
      emailVerifiedAt: null, // Unverified
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: null,
    },
  });
  console.log(`✅ Created Test User: ${testUser.username} (${testUser.email}) - Unverified`);

  const inactiveUser = await prisma.user.create({
    data: {
      email: "inactive.user@example.com",
      username: "inactive",
      name: "Inactive User",
      passwordHash: userPassword,
      roleId: userRole.id,
      status: "INACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
    },
  });
  console.log(`✅ Created Inactive User: ${inactiveUser.username} (${inactiveUser.email})`);

  // ============================================
  // STEP 5: Create User-Specific Permission Overrides (Examples)
  // ============================================
  console.log("🎯 Creating user permission overrides...");

  // Give John Doe temporary ability to create posts (expires in 30 days)
  const postsCreatePermission = permissions.find((p) => p.code === "posts:create");
  await prisma.userPermission.create({
    data: {
      userId: user1.id,
      permissionId: postsCreatePermission.id,
      granted: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
  console.log(`✅ Granted ${user1.username} temporary "posts:create" permission (30 days)`);

  // Revoke Jane Smith's ability to view invoices (override her role permission)
  const invoicesViewPermission = permissions.find((p) => p.code === "invoices:view");
  await prisma.userPermission.create({
    data: {
      userId: user2.id,
      permissionId: invoicesViewPermission.id,
      granted: false,
    },
  });
  console.log(`✅ Revoked ${user2.username}'s "invoices:view" permission`);

  // ============================================
  // STEP 6: Create User Logs
  // ============================================
  console.log("📝 Creating user logs...");
  await prisma.userLog.createMany({
    data: [
      {
        action: "USER_CREATED",
        targetUserId: superAdmin.id,
        actorId: superAdmin.id,
        changedData: {
          message: "Super Admin account created during seeding",
          role: "Super Admin",
        },
      },
      {
        action: "USER_CREATED",
        targetUserId: admin.id,
        actorId: superAdmin.id,
        changedData: {
          message: "Admin account created during seeding",
          role: "Admin",
        },
      },
      {
        action: "USER_CREATED",
        targetUserId: manager.id,
        actorId: superAdmin.id,
        changedData: {
          message: "Manager account created during seeding",
          role: "Manager",
        },
      },
      {
        action: "USER_CREATED",
        targetUserId: editor.id,
        actorId: admin.id,
        changedData: {
          message: "Editor account created during seeding",
          role: "Editor",
        },
      },
      {
        action: "USER_CREATED",
        targetUserId: accountant.id,
        actorId: admin.id,
        changedData: {
          message: "Accountant account created during seeding",
          role: "Accountant",
        },
      },
      {
        action: "USER_CREATED",
        targetUserId: user1.id,
        actorId: admin.id,
        changedData: {
          message: "Regular user account created during seeding",
          role: "User",
        },
      },
      {
        action: "EMAIL_VERIFIED",
        targetUserId: user1.id,
        actorId: user1.id,
        changedData: {
          message: "Email verified during account creation",
        },
      },
      {
        action: "USER_UPDATED_ROLE",
        targetUserId: user1.id,
        actorId: superAdmin.id,
        changedData: {
          message: "Temporary permission granted: posts:create",
          permission: "posts:create",
          granted: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      {
        action: "USER_UPDATED_ROLE",
        targetUserId: user2.id,
        actorId: superAdmin.id,
        changedData: {
          message: "Permission revoked: invoices:view",
          permission: "invoices:view",
          granted: false,
        },
      },
    ],
  });
  console.log("✅ Created user logs");

  console.log("\n🎉 Seeding completed successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("� SEEDING SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("✅ Created Resources:");
  console.log(
    `   • ${permissions.length} Permissions (Users, Assets, CMS, Invoicing, RBAC, System)`
  );
  console.log(`   • 6 Roles (Super Admin, Admin, Manager, Editor, Accountant, User)`);
  console.log(`   • 9 Users with assigned roles`);
  console.log(`   • 2 User permission overrides (1 grant, 1 revoke)\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 LOGIN CREDENTIALS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("1️⃣  Super Admin (Full Access - All Permissions)");
  console.log(`   Username: ${superAdmin.username}`);
  console.log(`   Email:    ${superAdmin.email}`);
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
  console.log(`   Role:     Super Admin (Priority: 1000)\n`);

  console.log("2️⃣  Admin (Administrative Access)");
  console.log(`   Username: ${admin.username}`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
  console.log(`   Role:     Admin (Priority: 900)\n`);

  console.log("3️⃣  Manager (Assets, Invoices, Content)");
  console.log(`   Username: ${manager.username}`);
  console.log(`   Email:    ${manager.email}`);
  console.log(`   Password: user123`);
  console.log(`   Role:     Manager (Priority: 500)`);
  console.log(`   Access:   Manage assets, approve invoices, publish content\n`);

  console.log("4️⃣  Editor (Content Management)");
  console.log(`   Username: ${editor.username}`);
  console.log(`   Email:    ${editor.email}`);
  console.log(`   Password: user123`);
  console.log(`   Role:     Editor (Priority: 400)`);
  console.log(`   Access:   Create/edit posts, pages, manage media\n`);

  console.log("5️⃣  Accountant (Finance Management)");
  console.log(`   Username: ${accountant.username}`);
  console.log(`   Email:    ${accountant.email}`);
  console.log(`   Password: user123`);
  console.log(`   Role:     Accountant (Priority: 300)`);
  console.log(`   Access:   Manage invoices, payments, view reports\n`);

  console.log("6️⃣  Regular User - John Doe");
  console.log(`   Username: ${user1.username}`);
  console.log(`   Email:    ${user1.email}`);
  console.log(`   Password: user123`);
  console.log(`   Role:     User (Priority: 100)`);
  console.log(`   Special:  ⭐ Has temporary "posts:create" permission (30 days)\n`);

  console.log("7️⃣  Regular User - Jane Smith");
  console.log(`   Username: ${user2.username}`);
  console.log(`   Email:    ${user2.email}`);
  console.log(`   Password: user123`);
  console.log(`   Role:     User (Priority: 100)`);
  console.log(`   Special:  🚫 Cannot view invoices (permission revoked)\n`);

  console.log("8️⃣  Test User (Unverified)");
  console.log(`   Username: ${testUser.username}`);
  console.log(`   Email:    ${testUser.email}`);
  console.log(`   Password: test123`);
  console.log(`   Role:     User (Priority: 100)`);
  console.log(`   ⚠️  Email NOT verified\n`);

  console.log("9️⃣  Inactive User");
  console.log(`   Username: ${inactiveUser.username}`);
  console.log(`   Email:    ${inactiveUser.email}`);
  console.log(`   Password: user123`);
  console.log(`   Role:     User (Priority: 100)`);
  console.log(`   ⚠️  Status: INACTIVE (cannot login)\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 PERMISSION CATEGORIES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("👥 Users:     users:view, users:create, users:update, users:delete");
  console.log("📦 Assets:    assets:view, assets:create, assets:update, assets:delete,");
  console.log("              assets:assign, assets:transfer");
  console.log("📝 Content:   posts:*, pages:*, media:* (view, create, update, delete, publish)");
  console.log("💰 Finance:   invoices:*, payments:* (view, create, update, approve, pay, refund)");
  console.log("🔒 RBAC:      roles:*, permissions:assign");
  console.log("⚙️  System:    settings:*, logs:view, reports:*\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 NEXT STEPS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("1. Start the server:");
  console.log("   npm run dev\n");

  console.log("2. Test RBAC by adding checkPermission() to your routes:");
  console.log("   router.post('/assets', checkPermission('assets:create'), controller.create)\n");

  console.log("3. Try logging in with different users to test permissions\n");

  console.log("4. Check RBAC_IMPLEMENTATION.md for full documentation\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("Error during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
