/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
import { SYSTEM_REALM_ID } from "~context/constants";
import { PermissionCode } from "~context/enums";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

const entry = (id: string, code: string, name: string, description: string) => ({
    id,
    code,
    name,
    description,
    realm_id: SYSTEM_REALM_ID,
    is_system_managed: true,
    is_revoked: false,
    created_at: CREATED_AT,
    version: 1,
});

const dataset = [
    // ---------------------------------------------------------------------------
    // AccessControl
    // ---------------------------------------------------------------------------

    // Realm
    entry(
        "00000003-0001-4000-8000-000000000001",
        PermissionCode.REALM_READ_PERSONAL,
        "Read Personal Realms",
        "View details of realms available to the current account.",
    ),
    entry(
        "00000003-0001-4000-8000-000000000002",
        PermissionCode.REALM_READ_ABSOLUTE,
        "Read Absolute Realms",
        "View details of all realms.",
    ),
    entry(
        "00000003-0001-4000-8000-000000000003",
        PermissionCode.REALM_CREATE,
        "Create Realm",
        "Create a new realm.",
    ),
    entry(
        "00000003-0001-4000-8000-000000000004",
        PermissionCode.REALM_UPDATE,
        "Update Realm",
        "Modify metadata of a realm.",
    ),
    entry(
        "00000003-0001-4000-8000-000000000005",
        PermissionCode.REALM_REVOKE,
        "Revoke Realm",
        "Soft-delete a realm.",
    ),
    entry(
        "00000003-0001-4000-8000-000000000006",
        PermissionCode.REALM_RESTORE,
        "Restore Realm",
        "Restore a previously revoked realm.",
    ),
    entry(
        "00000003-0001-4000-8000-000000000007",
        PermissionCode.REALM_PURGE,
        "Purge Realm",
        "Permanently delete a revoked realm.",
    ),
    entry(
        "00000003-0001-4000-8000-000000000008",
        PermissionCode.REALM_EXCLUDE,
        "Exclude Account from Realm",
        "Remove an account from a realm, purging all role assignments and permission overrides.",
    ),

    // Role
    entry(
        "00000003-0002-4000-8000-000000000001",
        PermissionCode.ROLE_READ_COMMON,
        "Read Common Roles",
        "View common role data within a realm.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000002",
        PermissionCode.ROLE_READ_PERSONAL,
        "Read Personal Roles",
        "View personal role data derived from the current account.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000003",
        PermissionCode.ROLE_READ_ABSOLUTE,
        "Read Absolute Roles",
        "View all role data within a realm.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000004",
        PermissionCode.ROLE_CREATE,
        "Create Role",
        "Create a new role.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000005",
        PermissionCode.ROLE_UPDATE,
        "Update Role",
        "Modify metadata of a role.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000006",
        PermissionCode.ROLE_HIERARCHY_UPDATE,
        "Update Role Hierarchy",
        "Move roles or subtrees within the role hierarchy.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000007",
        PermissionCode.ROLE_REVOKE,
        "Revoke Role",
        "Soft-delete a role.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000008",
        PermissionCode.ROLE_RESTORE,
        "Restore Role",
        "Restore a previously revoked role.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000009",
        PermissionCode.ROLE_PURGE,
        "Purge Role",
        "Permanently delete a revoked role.",
    ),
    entry(
        "00000003-0002-4000-8000-000000000010",
        PermissionCode.ROLE_PURGE_SUBTREE,
        "Purge Role Subtree",
        "Permanently delete a role and its entire descendant hierarchy.",
    ),

    // Permission
    entry(
        "00000003-0003-4000-8000-000000000001",
        PermissionCode.PERMISSION_READ_COMMON,
        "Read Common Permissions",
        "View common permission data within a realm.",
    ),
    entry(
        "00000003-0003-4000-8000-000000000002",
        PermissionCode.PERMISSION_READ_PERSONAL,
        "Read Personal Permissions",
        "View personal permission data derived from the current account.",
    ),
    entry(
        "00000003-0003-4000-8000-000000000003",
        PermissionCode.PERMISSION_READ_ABSOLUTE,
        "Read Absolute Permissions",
        "View all permission data within a realm.",
    ),
    entry(
        "00000003-0003-4000-8000-000000000004",
        PermissionCode.PERMISSION_CREATE,
        "Create Permission",
        "Create a new permission.",
    ),
    entry(
        "00000003-0003-4000-8000-000000000005",
        PermissionCode.PERMISSION_UPDATE,
        "Update Permission",
        "Modify metadata of a permission.",
    ),
    entry(
        "00000003-0003-4000-8000-000000000006",
        PermissionCode.PERMISSION_REVOKE,
        "Revoke Permission",
        "Soft-delete a permission.",
    ),
    entry(
        "00000003-0003-4000-8000-000000000007",
        PermissionCode.PERMISSION_RESTORE,
        "Restore Permission",
        "Restore a previously revoked permission.",
    ),
    entry(
        "00000003-0003-4000-8000-000000000008",
        PermissionCode.PERMISSION_PURGE,
        "Purge Permission",
        "Permanently delete a revoked permission.",
    ),

    // RolePermissionAssignment
    entry(
        "00000003-0004-4000-8000-000000000001",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ_COMMON,
        "Read Common Role Permission Assignments",
        "View role-to-permission assignments within a realm.",
    ),
    entry(
        "00000003-0004-4000-8000-000000000002",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_CREATE,
        "Create Role Permission Assignment",
        "Assign a permission to a role.",
    ),
    entry(
        "00000003-0004-4000-8000-000000000003",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_REVOKE,
        "Revoke Role Permission Assignment",
        "Soft-delete a role-to-permission assignment.",
    ),
    entry(
        "00000003-0004-4000-8000-000000000004",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_RESTORE,
        "Restore Role Permission Assignment",
        "Restore a previously revoked role-to-permission assignment.",
    ),
    entry(
        "00000003-0004-4000-8000-000000000005",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_PURGE,
        "Purge Role Permission Assignment",
        "Permanently delete a revoked role-to-permission assignment.",
    ),
    entry(
        "00000003-0004-4000-8000-000000000006",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ_ABSOLUTE,
        "Read Absolute Role Permission Assignments",
        "View all role-to-permission assignments within a realm.",
    ),

    // AccountRoleAssignment
    entry(
        "00000003-0005-4000-8000-000000000001",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON,
        "Read Common Account Role Assignments",
        "View account-to-role assignments within a realm.",
    ),
    entry(
        "00000003-0005-4000-8000-000000000002",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
        "Create Account Role Assignment",
        "Assign a role to an account.",
    ),
    entry(
        "00000003-0005-4000-8000-000000000003",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_REVOKE,
        "Revoke Account Role Assignment",
        "Soft-delete an account-to-role assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-000000000004",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_RESTORE,
        "Restore Account Role Assignment",
        "Restore a previously revoked account-to-role assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-000000000005",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
        "Purge Account Role Assignment",
        "Permanently delete a revoked account-to-role assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-000000000006",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_READ_ABSOLUTE,
        "Read Absolute Account Role Assignments",
        "View all account-to-role assignments within a realm.",
    ),

    // PermissionOverride
    entry(
        "00000003-0006-4000-8000-000000000001",
        PermissionCode.PERMISSION_OVERRIDE_READ_PERSONAL,
        "Read Personal Permission Overrides",
        "View DAC permission overrides of the current account.",
    ),
    entry(
        "00000003-0006-4000-8000-000000000002",
        PermissionCode.PERMISSION_OVERRIDE_READ_ABSOLUTE,
        "Read Absolute Permission Overrides",
        "View all DAC permission overrides within a realm.",
    ),
    entry(
        "00000003-0006-4000-8000-000000000003",
        PermissionCode.PERMISSION_OVERRIDE_CREATE,
        "Create Permission Override",
        "Create an explicit ALLOW or DENY override for an account.",
    ),
    entry(
        "00000003-0006-4000-8000-000000000004",
        PermissionCode.PERMISSION_OVERRIDE_REVOKE,
        "Revoke Permission Override",
        "Soft-delete a permission override.",
    ),
    entry(
        "00000003-0006-4000-8000-000000000005",
        PermissionCode.PERMISSION_OVERRIDE_RESTORE,
        "Restore Permission Override",
        "Restore a previously revoked permission override.",
    ),
    entry(
        "00000003-0006-4000-8000-000000000006",
        PermissionCode.PERMISSION_OVERRIDE_PURGE,
        "Purge Permission Override",
        "Permanently delete a revoked permission override.",
    ),

    // RoleDelegationPolicy
    entry(
        "00000003-0007-4000-8000-000000000001",
        PermissionCode.ROLE_DELEGATION_POLICY_READ_COMMON,
        "Read Common Role Delegation Policies",
        "View role delegation policies within a realm.",
    ),
    entry(
        "00000003-0007-4000-8000-000000000002",
        PermissionCode.ROLE_DELEGATION_POLICY_CREATE,
        "Create Role Delegation Policy",
        "Define a new role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-000000000003",
        PermissionCode.ROLE_DELEGATION_POLICY_UPDATE,
        "Update Role Delegation Policy",
        "Modify an existing role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-000000000004",
        PermissionCode.ROLE_DELEGATION_POLICY_REVOKE,
        "Revoke Role Delegation Policy",
        "Soft-delete a role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-000000000005",
        PermissionCode.ROLE_DELEGATION_POLICY_RESTORE,
        "Restore Role Delegation Policy",
        "Restore a previously revoked role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-000000000006",
        PermissionCode.ROLE_DELEGATION_POLICY_PURGE,
        "Purge Role Delegation Policy",
        "Permanently delete a revoked role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-000000000007",
        PermissionCode.ROLE_DELEGATION_POLICY_READ_ABSOLUTE,
        "Read Absolute Role Delegation Policies",
        "View all role delegation policies within a realm.",
    ),

    // RoleConflictGroup
    entry(
        "00000003-0008-4000-8000-000000000001",
        PermissionCode.ROLE_CONFLICT_GROUP_READ_ABSOLUTE,
        "Read Absolute Role Conflict Groups",
        "View all SoD conflict groups within a realm.",
    ),
    entry(
        "00000003-0008-4000-8000-000000000002",
        PermissionCode.ROLE_CONFLICT_GROUP_CREATE,
        "Create Role Conflict Group",
        "Define a new SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-000000000003",
        PermissionCode.ROLE_CONFLICT_GROUP_UPDATE,
        "Update Role Conflict Group",
        "Modify metadata of a SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-000000000004",
        PermissionCode.ROLE_CONFLICT_GROUP_REVOKE,
        "Revoke Role Conflict Group",
        "Soft-delete a SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-000000000005",
        PermissionCode.ROLE_CONFLICT_GROUP_RESTORE,
        "Restore Role Conflict Group",
        "Restore a previously revoked SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-000000000006",
        PermissionCode.ROLE_CONFLICT_GROUP_PURGE,
        "Purge Role Conflict Group",
        "Permanently delete a revoked SoD conflict group.",
    ),

    // RoleConflictMember
    entry(
        "00000003-0009-4000-8000-000000000001",
        PermissionCode.ROLE_CONFLICT_MEMBER_READ_ABSOLUTE,
        "Read Absolute Role Conflict Members",
        "View all role memberships in SoD conflict groups within a realm.",
    ),
    entry(
        "00000003-0009-4000-8000-000000000002",
        PermissionCode.ROLE_CONFLICT_MEMBER_CREATE,
        "Create Role Conflict Member",
        "Add a role as a member of a SoD conflict group.",
    ),
    entry(
        "00000003-0009-4000-8000-000000000003",
        PermissionCode.ROLE_CONFLICT_MEMBER_PURGE,
        "Purge Role Conflict Member",
        "Permanently remove a role from a SoD conflict group.",
    ),

    // AuditLog
    entry(
        "00000003-0010-4000-8000-000000000001",
        PermissionCode.AUDIT_LOG_READ_ABSOLUTE,
        "Read Absolute Audit Log",
        "View audit logs within a realm.",
    ),

    // ChangeLog
    entry(
        "00000003-0011-4000-8000-000000000001",
        PermissionCode.CHANGE_LOG_READ_ABSOLUTE,
        "Read Absolute Change Log",
        "View change logs within a realm.",
    ),

    // Invite
    entry(
        "00000003-0012-4000-8000-000000000001",
        PermissionCode.INVITE_READ_PERSONAL,
        "Read Personal Invites",
        "View invites sent or received by the current account.",
    ),
    entry(
        "00000003-0012-4000-8000-000000000002",
        PermissionCode.INVITE_READ_ABSOLUTE,
        "Read Absolute Invites",
        "View all invites within a realm.",
    ),
    entry(
        "00000003-0012-4000-8000-000000000003",
        PermissionCode.INVITE_CREATE,
        "Create Invite",
        "Send an invite to an account for a role within a realm.",
    ),
    entry(
        "00000003-0012-4000-8000-000000000004",
        PermissionCode.INVITE_CHANGE_STATUS,
        "Change Invite Status",
        "Accept, decline, or cancel a pending invite.",
    ),

    // ---------------------------------------------------------------------------
    // Identity
    // ---------------------------------------------------------------------------

    // Account
    entry(
        "00000003-0013-4000-8000-000000000001",
        PermissionCode.ACCOUNT_READ_PERSONAL,
        "Read Own Account",
        "View details of the current account.",
    ),
    entry(
        "00000003-0013-4000-8000-000000000002",
        PermissionCode.ACCOUNT_READ_COMMON,
        "Read Public Account",
        "View publicly available account details.",
    ),
    entry(
        "00000003-0013-4000-8000-000000000003",
        PermissionCode.ACCOUNT_READ_ABSOLUTE,
        "Read Any Account",
        "View details of any account.",
    ),
    entry(
        "00000003-0013-4000-8000-000000000004",
        PermissionCode.ACCOUNT_SUSPEND,
        "Suspend Account",
        "Suspend an account.",
    ),
    entry(
        "00000003-0013-4000-8000-000000000005",
        PermissionCode.ACCOUNT_RESTORE,
        "Restore Account",
        "Restore a suspended account.",
    ),

    // Reauthentication
    entry(
        "00000003-0014-4000-8000-000000000001",
        PermissionCode.REAUTHENTICATION_CONFIRM_PASSWORD,
        "Confirm Reauthentication by Password",
        "Confirm reauthentication using the current account password.",
    ),
    entry(
        "00000003-0014-4000-8000-000000000002",
        PermissionCode.REAUTHENTICATION_CONFIRM_SECOND_FACTOR,
        "Confirm Reauthentication by Second Factor",
        "Confirm reauthentication using a second factor.",
    ),

    // Identifier
    entry(
        "00000003-0015-4000-8000-000000000001",
        PermissionCode.IDENTIFIER_READ_PERSONAL,
        "Read Own Identifiers",
        "View identifiers owned by the current account.",
    ),
    entry(
        "00000003-0015-4000-8000-000000000002",
        PermissionCode.IDENTIFIER_READ_ABSOLUTE,
        "Read Any Identifier",
        "View identifiers owned by any account.",
    ),
    entry(
        "00000003-0015-4000-8000-000000000003",
        PermissionCode.IDENTIFIER_CREATE,
        "Create Identifier",
        "Add an identifier to the current account.",
    ),
    entry(
        "00000003-0015-4000-8000-000000000004",
        PermissionCode.IDENTIFIER_RESEND,
        "Resend Identifier Verification",
        "Resend verification for an account identifier.",
    ),
    entry(
        "00000003-0015-4000-8000-000000000005",
        PermissionCode.IDENTIFIER_VERIFY,
        "Verify Identifier",
        "Verify an account identifier using OTP.",
    ),
    entry(
        "00000003-0015-4000-8000-000000000006",
        PermissionCode.IDENTIFIER_TOGGLE_NOTIFICATIONS,
        "Toggle Identifier Notifications",
        "Enable or disable notifications for an account identifier.",
    ),
    entry(
        "00000003-0015-4000-8000-000000000007",
        PermissionCode.IDENTIFIER_TOGGLE_PUBLIC_CONTACT,
        "Toggle Identifier Public Contact",
        "Enable or disable public contact visibility for an account identifier.",
    ),
    entry(
        "00000003-0015-4000-8000-000000000008",
        PermissionCode.IDENTIFIER_PURGE,
        "Purge Identifier",
        "Permanently remove an identifier from the current account.",
    ),

    // Password
    entry(
        "00000003-0016-4000-8000-000000000001",
        PermissionCode.PASSWORD_CHANGE,
        "Change Password",
        "Change the current account password.",
    ),

    // Profile
    entry(
        "00000003-0017-4000-8000-000000000001",
        PermissionCode.PROFILE_UPDATE,
        "Update Profile",
        "Update the current account profile.",
    ),

    // RecoveryCode
    entry(
        "00000003-0018-4000-8000-000000000001",
        PermissionCode.RECOVERY_CODE_READ_STATUS,
        "Read Recovery Code Status",
        "View recovery code status for the current account.",
    ),
    entry(
        "00000003-0018-4000-8000-000000000002",
        PermissionCode.RECOVERY_CODE_REGENERATE,
        "Regenerate Recovery Codes",
        "Regenerate recovery codes for the current account.",
    ),

    // SecondFactor
    entry(
        "00000003-0019-4000-8000-000000000001",
        PermissionCode.SECOND_FACTOR_READ_PERSONAL,
        "Read Own Second Factors",
        "View second factors owned by the current account.",
    ),
    entry(
        "00000003-0019-4000-8000-000000000002",
        PermissionCode.SECOND_FACTOR_READ_ABSOLUTE,
        "Read Any Second Factor",
        "View second factors owned by any account.",
    ),
    entry(
        "00000003-0019-4000-8000-000000000003",
        PermissionCode.SECOND_FACTOR_CREATE,
        "Create Second Factor",
        "Create a second factor for the current account.",
    ),
    entry(
        "00000003-0019-4000-8000-000000000004",
        PermissionCode.SECOND_FACTOR_VERIFY,
        "Verify Second Factor",
        "Verify a second factor for the current account.",
    ),
    entry(
        "00000003-0019-4000-8000-000000000005",
        PermissionCode.SECOND_FACTOR_PURGE,
        "Purge Second Factor",
        "Permanently remove a second factor from the current account.",
    ),

    // Session
    entry(
        "00000003-0020-4000-8000-000000000001",
        PermissionCode.SESSION_READ_PERSONAL,
        "Read Own Sessions",
        "View sessions owned by the current account.",
    ),
    entry(
        "00000003-0020-4000-8000-000000000002",
        PermissionCode.SESSION_READ_ABSOLUTE,
        "Read Any Session",
        "View sessions owned by any account.",
    ),
    entry(
        "00000003-0020-4000-8000-000000000003",
        PermissionCode.SESSION_REVOKE,
        "Revoke Selected Sessions",
        "Revoke selected sessions for the current account.",
    ),
    entry(
        "00000003-0020-4000-8000-000000000004",
        PermissionCode.SESSION_REVOKE_ALL,
        "Revoke All Sessions",
        "Revoke all sessions for the current account.",
    ),

    // Application
    entry(
        "00000003-0021-4000-8000-000000000001",
        PermissionCode.APPLICATION_READ_ABSOLUTE,
        "Read Absolute Applications",
        "View all applications within a realm.",
    ),
    entry(
        "00000003-0021-4000-8000-000000000002",
        PermissionCode.APPLICATION_CREATE,
        "Create Application",
        "Create an application within a realm.",
    ),
    entry(
        "00000003-0021-4000-8000-000000000003",
        PermissionCode.APPLICATION_UPDATE,
        "Update Application",
        "Modify an application within a realm.",
    ),
    entry(
        "00000003-0021-4000-8000-000000000004",
        PermissionCode.APPLICATION_REVOKE,
        "Revoke Application",
        "Revoke an application within a realm.",
    ),
    entry(
        "00000003-0021-4000-8000-000000000005",
        PermissionCode.APPLICATION_RESTORE,
        "Restore Application",
        "Restore a revoked application within a realm.",
    ),
    entry(
        "00000003-0021-4000-8000-000000000006",
        PermissionCode.APPLICATION_PURGE,
        "Purge Application",
        "Permanently delete a revoked application within a realm.",
    ),

    // InterfaceClient
    entry(
        "00000003-0022-4000-8000-000000000001",
        PermissionCode.INTERFACE_CLIENT_READ_ABSOLUTE,
        "Read Absolute Interface Clients",
        "View all interface clients within a realm.",
    ),
    entry(
        "00000003-0022-4000-8000-000000000002",
        PermissionCode.INTERFACE_CLIENT_CREATE,
        "Create Interface Client",
        "Create an interface client within a realm.",
    ),
    entry(
        "00000003-0022-4000-8000-000000000003",
        PermissionCode.INTERFACE_CLIENT_UPDATE,
        "Update Interface Client",
        "Modify an interface client within a realm.",
    ),
    entry(
        "00000003-0022-4000-8000-000000000004",
        PermissionCode.INTERFACE_CLIENT_REVOKE,
        "Revoke Interface Client",
        "Revoke an interface client within a realm.",
    ),
    entry(
        "00000003-0022-4000-8000-000000000005",
        PermissionCode.INTERFACE_CLIENT_RESTORE,
        "Restore Interface Client",
        "Restore a revoked interface client within a realm.",
    ),
    entry(
        "00000003-0022-4000-8000-000000000006",
        PermissionCode.INTERFACE_CLIENT_PURGE,
        "Purge Interface Client",
        "Permanently delete a revoked interface client within a realm.",
    ),

    // ServiceClient
    entry(
        "00000003-0023-4000-8000-000000000001",
        PermissionCode.SERVICE_CLIENT_READ_ABSOLUTE,
        "Read Absolute Service Clients",
        "View all service clients within a realm.",
    ),
    entry(
        "00000003-0023-4000-8000-000000000002",
        PermissionCode.SERVICE_CLIENT_CREATE,
        "Create Service Client",
        "Create a service client within a realm.",
    ),
    entry(
        "00000003-0023-4000-8000-000000000003",
        PermissionCode.SERVICE_CLIENT_UPDATE,
        "Update Service Client",
        "Modify a service client within a realm.",
    ),
    entry(
        "00000003-0023-4000-8000-000000000004",
        PermissionCode.SERVICE_CLIENT_REVOKE,
        "Revoke Service Client",
        "Revoke a service client within a realm.",
    ),
    entry(
        "00000003-0023-4000-8000-000000000005",
        PermissionCode.SERVICE_CLIENT_RESTORE,
        "Restore Service Client",
        "Restore a revoked service client within a realm.",
    ),
    entry(
        "00000003-0023-4000-8000-000000000006",
        PermissionCode.SERVICE_CLIENT_PURGE,
        "Purge Service Client",
        "Permanently delete a revoked service client within a realm.",
    ),

    // ---------------------------------------------------------------------------
    // Certificate
    // ---------------------------------------------------------------------------

    entry(
        "00000003-0024-4000-8000-000000000001",
        PermissionCode.CERTIFICATE_READ_PERSONAL,
        "Read Personal Certificates",
        "View certificates within a realm.",
    ),
    entry(
        "00000003-0024-4000-8000-000000000002",
        PermissionCode.CERTIFICATE_READ_ABSOLUTE,
        "Read Absolute Certificates",
        "View all certificates across all realms.",
    ),
    entry(
        "00000003-0024-4000-8000-000000000003",
        PermissionCode.CERTIFICATE_REVOKE,
        "Revoke Certificate",
        "Revoke an issued certificate.",
    ),
];

export const Permissions = {
    postgresql: dataset,
    name: "permission",
    redis: dataset,
}
