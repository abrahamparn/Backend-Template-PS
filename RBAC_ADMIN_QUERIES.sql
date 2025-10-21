-- Run these queries in your PostgreSQL client to see complete RBAC details
-- Database: templateDatabase

-- 1. SUPER ADMIN USER DETAILS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.name,
    u.status,
    u.email_verified_at,
    u.created_at,
    r.id as role_id,
    r.name as role_name,
    r.description as role_description,
    r.priority as role_priority,
    r."isSystem" as is_system_role
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.username = 'abrahamnaiborhu' OR u.email = 'abraham.naiborhu@point-star.com';

-- 2. ALL PERMISSIONS ASSIGNED TO SUPER ADMIN ROLE
SELECT 
    r.name as role_name,
    r.priority,
    p.id as permission_id,
    p.resource,
    p.action,
    p.code as permission_code,
    p.description as permission_description,
    p.category,
    rp.created_at as assigned_at
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Super Admin'
ORDER BY p.category, p.resource, p.action;

-- 3. PERMISSIONS GROUPED BY CATEGORY (Super Admin)
SELECT 
    p.category,
    COUNT(*) as permission_count,
    STRING_AGG(p.code, ', ' ORDER BY p.code) as permissions
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Super Admin'
GROUP BY p.category
ORDER BY permission_count DESC;

-- 4. PERMISSIONS GROUPED BY RESOURCE (Super Admin)
SELECT 
    p.resource,
    COUNT(*) as action_count,
    STRING_AGG(p.action, ', ' ORDER BY p.action) as actions,
    STRING_AGG(p.code, ', ' ORDER BY p.action) as permission_codes
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Super Admin'
GROUP BY p.resource
ORDER BY p.resource;

-- 5. SUPER ADMIN USER-SPECIFIC PERMISSION OVERRIDES
SELECT 
    u.username,
    u.email,
    p.code as permission_code,
    p.description,
    up.granted,
    up.reason,
    up.expires_at,
    up.granted_by,
    up.created_at
FROM users u
JOIN user_permissions up ON u.id = up.user_id
JOIN permissions p ON up.permission_id = p.id
WHERE u.username = 'abrahamnaiborhu' OR u.email = 'abraham.naiborhu@point-star.com';

-- 6. COMPLETE PERMISSION LIST FOR SUPER ADMIN
-- (Including role permissions + user overrides)
WITH user_info AS (
    SELECT id, username, email, role_id
    FROM users 
    WHERE username = 'abrahamnaiborhu' OR email = 'abraham.naiborhu@point-star.com'
),
role_permissions_list AS (
    SELECT 
        p.id as permission_id,
        p.code,
        p.resource,
        p.action,
        p.description,
        p.category,
        'from_role' as source,
        TRUE as granted,
        NULL::timestamp as expires_at
    FROM user_info ui
    JOIN role_permissions rp ON ui.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
),
user_overrides AS (
    SELECT 
        p.id as permission_id,
        p.code,
        p.resource,
        p.action,
        p.description,
        p.category,
        'user_override' as source,
        up.granted,
        up.expires_at
    FROM user_info ui
    JOIN user_permissions up ON ui.id = up.user_id
    JOIN permissions p ON up.permission_id = p.id
)
SELECT * FROM role_permissions_list
UNION ALL
SELECT * FROM user_overrides
ORDER BY category, resource, action;

-- 7. AUDIT LOG FOR SUPER ADMIN
SELECT 
    ul.id as log_id,
    ul.action,
    ul.created_at,
    actor.username as actor_username,
    actor.email as actor_email,
    target.username as target_username,
    target.email as target_email,
    ul.changed_data
FROM user_logs ul
LEFT JOIN users actor ON ul.actor_id = actor.id
LEFT JOIN users target ON ul.target_user_id = target.id
WHERE 
    actor.username = 'abrahamnaiborhu' 
    OR actor.email = 'abraham.naiborhu@point-star.com'
    OR target.username = 'abrahamnaiborhu'
    OR target.email = 'abraham.naiborhu@point-star.com'
ORDER BY ul.created_at DESC;

-- 8. COMPARE SUPER ADMIN VS ALL OTHER ROLES
SELECT 
    r.name as role_name,
    r.priority,
    r."isSystem" as is_system_role,
    COUNT(rp.permission_id) as permission_count,
    ARRAY_AGG(DISTINCT p.category ORDER BY p.category) as categories_covered,
    COUNT(DISTINCT p.resource) as unique_resources
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name, r.priority, r."isSystem"
ORDER BY r.priority DESC;

-- 9. ALL USERS AND THEIR ROLES
SELECT 
    u.username,
    u.email,
    u.name,
    u.status,
    r.name as role_name,
    r.priority as role_priority,
    COUNT(DISTINCT rp.permission_id) as role_permissions_count,
    COUNT(DISTINCT up.permission_id) as user_overrides_count,
    u.created_at,
    u.last_login_at
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN user_permissions up ON u.id = up.user_id
GROUP BY u.id, u.username, u.email, u.name, u.status, r.name, r.priority, u.created_at, u.last_login_at
ORDER BY r.priority DESC NULLS LAST, u.username;

-- 10. PERMISSION MATRIX (Which roles have which permissions)
SELECT 
    p.code as permission_code,
    p.category,
    p.resource,
    p.action,
    BOOL_OR(CASE WHEN r.name = 'Super Admin' THEN TRUE ELSE FALSE END) as super_admin_has,
    BOOL_OR(CASE WHEN r.name = 'Admin' THEN TRUE ELSE FALSE END) as admin_has,
    BOOL_OR(CASE WHEN r.name = 'Manager' THEN TRUE ELSE FALSE END) as manager_has,
    BOOL_OR(CASE WHEN r.name = 'Editor' THEN TRUE ELSE FALSE END) as editor_has,
    BOOL_OR(CASE WHEN r.name = 'Accountant' THEN TRUE ELSE FALSE END) as accountant_has,
    BOOL_OR(CASE WHEN r.name = 'User' THEN TRUE ELSE FALSE END) as user_has,
    COUNT(DISTINCT r.id) as total_roles_with_permission
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id
GROUP BY p.id, p.code, p.category, p.resource, p.action
ORDER BY p.category, p.resource, p.action;

-- 11. DETAILED SUPER ADMIN PROFILE WITH EVERYTHING
WITH super_admin_user AS (
    SELECT 
        u.id,
        u.username,
        u.email,
        u.name,
        u.status,
        u.email_verified_at,
        u.phone_number,
        u.profile_picture_url,
        u.token_version,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        r.id as role_id,
        r.name as role_name,
        r.description as role_description,
        r.priority as role_priority,
        r."isSystem" as is_system_role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = 'abrahamnaiborhu' OR u.email = 'abraham.naiborhu@point-star.com'
),
permission_summary AS (
    SELECT 
        COUNT(DISTINCT rp.permission_id) as role_permission_count,
        COUNT(DISTINCT CASE WHEN p.category = 'users' THEN p.id END) as users_perms,
        COUNT(DISTINCT CASE WHEN p.category = 'assets' THEN p.id END) as assets_perms,
        COUNT(DISTINCT CASE WHEN p.category = 'content' THEN p.id END) as content_perms,
        COUNT(DISTINCT CASE WHEN p.category = 'finance' THEN p.id END) as finance_perms,
        COUNT(DISTINCT CASE WHEN p.category = 'rbac' THEN p.id END) as rbac_perms,
        COUNT(DISTINCT CASE WHEN p.category = 'system' THEN p.id END) as system_perms
    FROM super_admin_user sau
    JOIN role_permissions rp ON sau.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
),
user_override_summary AS (
    SELECT 
        COUNT(*) as total_overrides,
        COUNT(CASE WHEN granted = true THEN 1 END) as granted_overrides,
        COUNT(CASE WHEN granted = false THEN 1 END) as revoked_overrides,
        COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at > NOW() THEN 1 END) as active_temporary_perms
    FROM super_admin_user sau
    LEFT JOIN user_permissions up ON sau.id = up.user_id
),
activity_summary AS (
    SELECT 
        COUNT(*) as total_actions,
        COUNT(CASE WHEN action = 'USER_CREATED' THEN 1 END) as users_created,
        COUNT(CASE WHEN action = 'USER_UPDATED' THEN 1 END) as users_updated,
        COUNT(CASE WHEN action = 'USER_DELETED' THEN 1 END) as users_deleted,
        MAX(created_at) as last_action_at
    FROM super_admin_user sau
    JOIN user_logs ul ON sau.id = ul.actor_id
)
SELECT 
    sau.*,
    ps.role_permission_count,
    ps.users_perms,
    ps.assets_perms,
    ps.content_perms,
    ps.finance_perms,
    ps.rbac_perms,
    ps.system_perms,
    COALESCE(uos.total_overrides, 0) as user_permission_overrides,
    COALESCE(uos.granted_overrides, 0) as granted_overrides,
    COALESCE(uos.revoked_overrides, 0) as revoked_overrides,
    COALESCE(uos.active_temporary_perms, 0) as active_temporary_permissions,
    COALESCE(acts.total_actions, 0) as total_audit_actions,
    COALESCE(acts.users_created, 0) as users_created_by_admin,
    COALESCE(acts.users_updated, 0) as users_updated_by_admin,
    COALESCE(acts.users_deleted, 0) as users_deleted_by_admin,
    acts.last_action_at
FROM super_admin_user sau
CROSS JOIN permission_summary ps
LEFT JOIN user_override_summary uos ON TRUE
LEFT JOIN activity_summary acts ON TRUE;

-- ============================================
-- 12. PERMISSION HIERARCHY - Who can do what?
-- ============================================
SELECT 
    p.code as permission,
    p.category,
    p.description,
    STRING_AGG(r.name, ', ' ORDER BY r.priority DESC) as roles_with_permission,
    COUNT(DISTINCT r.id) as number_of_roles,
    MIN(r.priority) as lowest_priority_role,
    MAX(r.priority) as highest_priority_role
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id
GROUP BY p.id, p.code, p.category, p.description
ORDER BY MAX(r.priority) DESC NULLS LAST, p.category, p.code;



-- Quick check: Does Super Admin have ALL permissions?
SELECT 
    'Super Admin has ' || COUNT(DISTINCT rp.permission_id) || ' out of ' || 
    (SELECT COUNT(*) FROM permissions) || ' total permissions' as verification,
    CASE 
        WHEN COUNT(DISTINCT rp.permission_id) = (SELECT COUNT(*) FROM permissions)
        THEN '✅ YES - Super Admin has ALL permissions'
        ELSE '❌ NO - Super Admin is missing some permissions'
    END as status
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'Super Admin';

-- Quick check: Super Admin user details
SELECT 
    username,
    email,
    name,
    status,
    CASE WHEN email_verified_at IS NOT NULL THEN '✅ Verified' ELSE '❌ Not Verified' END as email_status,
    role_id,
    created_at
FROM users 
WHERE username = 'abrahamnaiborhu';

-- Quick check: Count permissions by category for Super Admin
SELECT 
    COALESCE(p.category, 'uncategorized') as category,
    COUNT(*) as count
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Super Admin'
GROUP BY p.category
ORDER BY count DESC;
