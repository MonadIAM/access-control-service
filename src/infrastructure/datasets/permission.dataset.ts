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
        "00000003-0001-4000-8000-100000000001",
        PermissionCode.REALM_READ_PERSONAL,
        "Read Personal Realms",
        "View details of realms available to the current account.",
    ),
    entry(
        "00000003-0001-4000-8000-100000000002",
        PermissionCode.REALM_READ_ABSOLUTE,
        "Read Absolute Realms",
        "View details of all realms.",
    ),
    entry(
        "00000003-0001-4000-8000-100000000003",
        PermissionCode.REALM_CREATE,
        "Create Realm",
        "Create a new realm.",
    ),
    entry(
        "00000003-0001-4000-8000-100000000004",
        PermissionCode.REALM_UPDATE,
        "Update Realm",
        "Modify metadata of a realm.",
    ),
    entry(
        "00000003-0001-4000-8000-100000000005",
        PermissionCode.REALM_REVOKE,
        "Revoke Realm",
        "Soft-delete a realm.",
    ),
    entry(
        "00000003-0001-4000-8000-100000000006",
        PermissionCode.REALM_RESTORE,
        "Restore Realm",
        "Restore a previously revoked realm.",
    ),
    entry(
        "00000003-0001-4000-8000-100000000007",
        PermissionCode.REALM_PURGE,
        "Purge Realm",
        "Permanently delete a revoked realm.",
    ),
    entry(
        "00000003-0001-4000-8000-100000000008",
        PermissionCode.REALM_EXCLUDE,
        "Exclude Account from Realm",
        "Remove an account from a realm, purging all role assignments and permission overrides.",
    ),

    // Role
    entry(
        "00000003-0002-4000-8000-100000000001",
        PermissionCode.ROLE_READ_COMMON,
        "Read Common Roles",
        "View common role data within a realm.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000002",
        PermissionCode.ROLE_READ_PERSONAL,
        "Read Personal Roles",
        "View personal role data derived from the current account.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000003",
        PermissionCode.ROLE_READ_ABSOLUTE,
        "Read Absolute Roles",
        "View all role data within a realm.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000004",
        PermissionCode.ROLE_CREATE,
        "Create Role",
        "Create a new role.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000005",
        PermissionCode.ROLE_UPDATE,
        "Update Role",
        "Modify metadata of a role.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000006",
        PermissionCode.ROLE_HIERARCHY_UPDATE,
        "Update Role Hierarchy",
        "Move roles or subtrees within the role hierarchy.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000007",
        PermissionCode.ROLE_REVOKE,
        "Revoke Role",
        "Soft-delete a role.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000008",
        PermissionCode.ROLE_RESTORE,
        "Restore Role",
        "Restore a previously revoked role.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000009",
        PermissionCode.ROLE_PURGE,
        "Purge Role",
        "Permanently delete a revoked role.",
    ),
    entry(
        "00000003-0002-4000-8000-100000000010",
        PermissionCode.ROLE_PURGE_SUBTREE,
        "Purge Role Subtree",
        "Permanently delete a role and its entire descendant hierarchy.",
    ),

    // Permission
    entry(
        "00000003-0003-4000-8000-100000000001",
        PermissionCode.PERMISSION_READ_COMMON,
        "Read Common Permissions",
        "View common permission data within a realm.",
    ),
    entry(
        "00000003-0003-4000-8000-100000000002",
        PermissionCode.PERMISSION_READ_PERSONAL,
        "Read Personal Permissions",
        "View personal permission data derived from the current account.",
    ),
    entry(
        "00000003-0003-4000-8000-100000000003",
        PermissionCode.PERMISSION_READ_ABSOLUTE,
        "Read Absolute Permissions",
        "View all permission data within a realm.",
    ),
    entry(
        "00000003-0003-4000-8000-100000000004",
        PermissionCode.PERMISSION_CREATE,
        "Create Permission",
        "Create a new permission.",
    ),
    entry(
        "00000003-0003-4000-8000-100000000005",
        PermissionCode.PERMISSION_UPDATE,
        "Update Permission",
        "Modify metadata of a permission.",
    ),
    entry(
        "00000003-0003-4000-8000-100000000006",
        PermissionCode.PERMISSION_REVOKE,
        "Revoke Permission",
        "Soft-delete a permission.",
    ),
    entry(
        "00000003-0003-4000-8000-100000000007",
        PermissionCode.PERMISSION_RESTORE,
        "Restore Permission",
        "Restore a previously revoked permission.",
    ),
    entry(
        "00000003-0003-4000-8000-100000000008",
        PermissionCode.PERMISSION_PURGE,
        "Purge Permission",
        "Permanently delete a revoked permission.",
    ),

    // RolePermissionAssignment
    entry(
        "00000003-0004-4000-8000-100000000001",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ_COMMON,
        "Read Common Role Permission Assignments",
        "View role-to-permission assignments within a realm.",
    ),
    entry(
        "00000003-0004-4000-8000-100000000002",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_CREATE,
        "Create Role Permission Assignment",
        "Assign a permission to a role.",
    ),
    entry(
        "00000003-0004-4000-8000-100000000003",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_REVOKE,
        "Revoke Role Permission Assignment",
        "Soft-delete a role-to-permission assignment.",
    ),
    entry(
        "00000003-0004-4000-8000-100000000004",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_RESTORE,
        "Restore Role Permission Assignment",
        "Restore a previously revoked role-to-permission assignment.",
    ),
    entry(
        "00000003-0004-4000-8000-100000000005",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_PURGE,
        "Purge Role Permission Assignment",
        "Permanently delete a revoked role-to-permission assignment.",
    ),
    entry(
        "00000003-0004-4000-8000-100000000006",
        PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ_ABSOLUTE,
        "Read Absolute Role Permission Assignments",
        "View all role-to-permission assignments within a realm.",
    ),

    // AccountRoleAssignment
    entry(
        "00000003-0005-4000-8000-100000000001",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON,
        "Read Common Account Role Assignments",
        "View account-to-role assignments within a realm.",
    ),
    entry(
        "00000003-0005-4000-8000-100000000002",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
        "Create Account Role Assignment",
        "Assign a role to an account.",
    ),
    entry(
        "00000003-0005-4000-8000-100000000003",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_REVOKE,
        "Revoke Account Role Assignment",
        "Soft-delete an account-to-role assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-100000000004",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_RESTORE,
        "Restore Account Role Assignment",
        "Restore a previously revoked account-to-role assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-100000000005",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_PURGE,
        "Purge Account Role Assignment",
        "Permanently delete a revoked account-to-role assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-100000000006",
        PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_READ_ABSOLUTE,
        "Read Absolute Account Role Assignments",
        "View all account-to-role assignments within a realm.",
    ),

    // PermissionOverride
    entry(
        "00000003-0006-4000-8000-100000000001",
        PermissionCode.PERMISSION_OVERRIDE_READ_PERSONAL,
        "Read Personal Permission Overrides",
        "View DAC permission overrides of the current account.",
    ),
    entry(
        "00000003-0006-4000-8000-100000000002",
        PermissionCode.PERMISSION_OVERRIDE_READ_ABSOLUTE,
        "Read Absolute Permission Overrides",
        "View all DAC permission overrides within a realm.",
    ),
    entry(
        "00000003-0006-4000-8000-100000000003",
        PermissionCode.PERMISSION_OVERRIDE_CREATE,
        "Create Permission Override",
        "Create an explicit ALLOW or DENY override for an account.",
    ),
    entry(
        "00000003-0006-4000-8000-100000000004",
        PermissionCode.PERMISSION_OVERRIDE_REVOKE,
        "Revoke Permission Override",
        "Soft-delete a permission override.",
    ),
    entry(
        "00000003-0006-4000-8000-100000000005",
        PermissionCode.PERMISSION_OVERRIDE_RESTORE,
        "Restore Permission Override",
        "Restore a previously revoked permission override.",
    ),
    entry(
        "00000003-0006-4000-8000-100000000006",
        PermissionCode.PERMISSION_OVERRIDE_PURGE,
        "Purge Permission Override",
        "Permanently delete a revoked permission override.",
    ),

    // RoleDelegationPolicy
    entry(
        "00000003-0007-4000-8000-100000000001",
        PermissionCode.ROLE_DELEGATION_POLICY_READ_COMMON,
        "Read Common Role Delegation Policies",
        "View role delegation policies within a realm.",
    ),
    entry(
        "00000003-0007-4000-8000-100000000002",
        PermissionCode.ROLE_DELEGATION_POLICY_CREATE,
        "Create Role Delegation Policy",
        "Define a new role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-100000000003",
        PermissionCode.ROLE_DELEGATION_POLICY_UPDATE,
        "Update Role Delegation Policy",
        "Modify an existing role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-100000000004",
        PermissionCode.ROLE_DELEGATION_POLICY_REVOKE,
        "Revoke Role Delegation Policy",
        "Soft-delete a role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-100000000005",
        PermissionCode.ROLE_DELEGATION_POLICY_RESTORE,
        "Restore Role Delegation Policy",
        "Restore a previously revoked role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-100000000006",
        PermissionCode.ROLE_DELEGATION_POLICY_PURGE,
        "Purge Role Delegation Policy",
        "Permanently delete a revoked role delegation policy.",
    ),
    entry(
        "00000003-0007-4000-8000-100000000007",
        PermissionCode.ROLE_DELEGATION_POLICY_READ_ABSOLUTE,
        "Read Absolute Role Delegation Policies",
        "View all role delegation policies within a realm.",
    ),

    // RoleConflictGroup
    entry(
        "00000003-0008-4000-8000-100000000001",
        PermissionCode.ROLE_CONFLICT_GROUP_READ_ABSOLUTE,
        "Read Absolute Role Conflict Groups",
        "View all SoD conflict groups within a realm.",
    ),
    entry(
        "00000003-0008-4000-8000-100000000002",
        PermissionCode.ROLE_CONFLICT_GROUP_CREATE,
        "Create Role Conflict Group",
        "Define a new SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-100000000003",
        PermissionCode.ROLE_CONFLICT_GROUP_UPDATE,
        "Update Role Conflict Group",
        "Modify metadata of a SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-100000000004",
        PermissionCode.ROLE_CONFLICT_GROUP_REVOKE,
        "Revoke Role Conflict Group",
        "Soft-delete a SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-100000000005",
        PermissionCode.ROLE_CONFLICT_GROUP_RESTORE,
        "Restore Role Conflict Group",
        "Restore a previously revoked SoD conflict group.",
    ),
    entry(
        "00000003-0008-4000-8000-100000000006",
        PermissionCode.ROLE_CONFLICT_GROUP_PURGE,
        "Purge Role Conflict Group",
        "Permanently delete a revoked SoD conflict group.",
    ),

    // RoleConflictMember
    entry(
        "00000003-0009-4000-8000-100000000001",
        PermissionCode.ROLE_CONFLICT_MEMBER_READ_ABSOLUTE,
        "Read Absolute Role Conflict Members",
        "View all role memberships in SoD conflict groups within a realm.",
    ),
    entry(
        "00000003-0009-4000-8000-100000000002",
        PermissionCode.ROLE_CONFLICT_MEMBER_CREATE,
        "Create Role Conflict Member",
        "Add a role as a member of a SoD conflict group.",
    ),
    entry(
        "00000003-0009-4000-8000-100000000003",
        PermissionCode.ROLE_CONFLICT_MEMBER_PURGE,
        "Purge Role Conflict Member",
        "Permanently remove a role from a SoD conflict group.",
    ),

    // AuditLog
    entry(
        "00000003-0010-4000-8000-100000000001",
        PermissionCode.AUDIT_LOG_READ_ABSOLUTE,
        "Read Absolute Audit Log",
        "View audit logs within a realm.",
    ),

    // ChangeLog
    entry(
        "00000003-0011-4000-8000-100000000001",
        PermissionCode.CHANGE_LOG_READ_ABSOLUTE,
        "Read Absolute Change Log",
        "View change logs within a realm.",
    ),

    // ---------------------------------------------------------------------------
    // Identity
    // ---------------------------------------------------------------------------

    // Account
    entry(
        "00000003-0002-4000-8000-200000000001",
        PermissionCode.ACCOUNT_READ_PERSONAL,
        "Read Own Account",
        "View details of the current account.",
    ),
    entry(
        "00000003-0002-4000-8000-200000000002",
        PermissionCode.ACCOUNT_READ_COMMON,
        "Read Public Account",
        "View publicly available account details.",
    ),
    entry(
        "00000003-0002-4000-8000-200000000003",
        PermissionCode.ACCOUNT_READ_ABSOLUTE,
        "Read Any Account",
        "View details of any account.",
    ),
    entry(
        "00000003-0002-4000-8000-200000000004",
        PermissionCode.ACCOUNT_SUSPEND,
        "Suspend Account",
        "Suspend an account.",
    ),
    entry(
        "00000003-0002-4000-8000-200000000005",
        PermissionCode.ACCOUNT_RESTORE,
        "Restore Account",
        "Restore a suspended account.",
    ),

    // Reauthentication
    entry(
        "00000003-0003-4000-8000-200000000001",
        PermissionCode.REAUTHENTICATION_CONFIRM_PASSWORD,
        "Confirm Reauthentication by Password",
        "Confirm reauthentication using the current account password.",
    ),
    entry(
        "00000003-0003-4000-8000-200000000002",
        PermissionCode.REAUTHENTICATION_CONFIRM_SECOND_FACTOR,
        "Confirm Reauthentication by Second Factor",
        "Confirm reauthentication using a second factor.",
    ),

    // Identifier
    entry(
        "00000003-0004-4000-8000-200000000001",
        PermissionCode.IDENTIFIER_READ_PERSONAL,
        "Read Own Identifiers",
        "View identifiers owned by the current account.",
    ),
    entry(
        "00000003-0004-4000-8000-200000000002",
        PermissionCode.IDENTIFIER_READ_ABSOLUTE,
        "Read Any Identifier",
        "View identifiers owned by any account.",
    ),
    entry(
        "00000003-0004-4000-8000-200000000003",
        PermissionCode.IDENTIFIER_CREATE,
        "Create Identifier",
        "Add an identifier to the current account.",
    ),
    entry(
        "00000003-0004-4000-8000-200000000004",
        PermissionCode.IDENTIFIER_RESEND,
        "Resend Identifier Verification",
        "Resend verification for an account identifier.",
    ),
    entry(
        "00000003-0004-4000-8000-200000000005",
        PermissionCode.IDENTIFIER_VERIFY,
        "Verify Identifier",
        "Verify an account identifier using OTP.",
    ),
    entry(
        "00000003-0004-4000-8000-200000000006",
        PermissionCode.IDENTIFIER_TOGGLE_NOTIFICATIONS,
        "Toggle Identifier Notifications",
        "Enable or disable notifications for an account identifier.",
    ),
    entry(
        "00000003-0004-4000-8000-200000000007",
        PermissionCode.IDENTIFIER_TOGGLE_PUBLIC_CONTACT,
        "Toggle Identifier Public Contact",
        "Enable or disable public contact visibility for an account identifier.",
    ),
    entry(
        "00000003-0004-4000-8000-200000000008",
        PermissionCode.IDENTIFIER_PURGE,
        "Purge Identifier",
        "Permanently remove an identifier from the current account.",
    ),

    // Password
    entry(
        "00000003-0005-4000-8000-200000000001",
        PermissionCode.PASSWORD_CHANGE,
        "Change Password",
        "Change the current account password.",
    ),

    // Profile
    entry(
        "00000003-0006-4000-8000-200000000001",
        PermissionCode.PROFILE_UPDATE,
        "Update Profile",
        "Update the current account profile.",
    ),

    // RecoveryCode
    entry(
        "00000003-0007-4000-8000-200000000001",
        PermissionCode.RECOVERY_CODE_READ_STATUS,
        "Read Recovery Code Status",
        "View recovery code status for the current account.",
    ),
    entry(
        "00000003-0007-4000-8000-200000000002",
        PermissionCode.RECOVERY_CODE_REGENERATE,
        "Regenerate Recovery Codes",
        "Regenerate recovery codes for the current account.",
    ),

    // SecondFactor
    entry(
        "00000003-0008-4000-8000-200000000001",
        PermissionCode.SECOND_FACTOR_READ_PERSONAL,
        "Read Own Second Factors",
        "View second factors owned by the current account.",
    ),
    entry(
        "00000003-0008-4000-8000-200000000002",
        PermissionCode.SECOND_FACTOR_READ_ABSOLUTE,
        "Read Any Second Factor",
        "View second factors owned by any account.",
    ),
    entry(
        "00000003-0008-4000-8000-200000000003",
        PermissionCode.SECOND_FACTOR_CREATE,
        "Create Second Factor",
        "Create a second factor for the current account.",
    ),
    entry(
        "00000003-0008-4000-8000-200000000004",
        PermissionCode.SECOND_FACTOR_VERIFY,
        "Verify Second Factor",
        "Verify a second factor for the current account.",
    ),
    entry(
        "00000003-0008-4000-8000-200000000005",
        PermissionCode.SECOND_FACTOR_PURGE,
        "Purge Second Factor",
        "Permanently remove a second factor from the current account.",
    ),

    // Session
    entry(
        "00000003-0009-4000-8000-200000000001",
        PermissionCode.SESSION_READ_PERSONAL,
        "Read Own Sessions",
        "View sessions owned by the current account.",
    ),
    entry(
        "00000003-0009-4000-8000-200000000002",
        PermissionCode.SESSION_READ_ABSOLUTE,
        "Read Any Session",
        "View sessions owned by any account.",
    ),
    entry(
        "00000003-0009-4000-8000-200000000003",
        PermissionCode.SESSION_REVOKE,
        "Revoke Selected Sessions",
        "Revoke selected sessions for the current account.",
    ),
    entry(
        "00000003-0009-4000-8000-200000000004",
        PermissionCode.SESSION_REVOKE_ALL,
        "Revoke All Sessions",
        "Revoke all sessions for the current account.",
    ),

    // InterfaceClient
    entry(
        "00000003-0011-4000-8000-200000000001",
        PermissionCode.INTERFACE_CLIENT_READ_ABSOLUTE,
        "Read Absolute Interface Clients",
        "View all interface clients within a realm.",
    ),
    entry(
        "00000003-0011-4000-8000-200000000002",
        PermissionCode.INTERFACE_CLIENT_CREATE,
        "Create Interface Client",
        "Create an interface client within a realm.",
    ),
    entry(
        "00000003-0011-4000-8000-200000000003",
        PermissionCode.INTERFACE_CLIENT_UPDATE,
        "Update Interface Client",
        "Modify an interface client within a realm.",
    ),
    entry(
        "00000003-0011-4000-8000-200000000004",
        PermissionCode.INTERFACE_CLIENT_REVOKE,
        "Revoke Interface Client",
        "Revoke an interface client within a realm.",
    ),
    entry(
        "00000003-0011-4000-8000-200000000005",
        PermissionCode.INTERFACE_CLIENT_RESTORE,
        "Restore Interface Client",
        "Restore a revoked interface client within a realm.",
    ),
    entry(
        "00000003-0011-4000-8000-200000000006",
        PermissionCode.INTERFACE_CLIENT_PURGE,
        "Purge Interface Client",
        "Permanently delete a revoked interface client within a realm.",
    ),

    // ServiceClient
    entry(
        "00000003-0012-4000-8000-200000000001",
        PermissionCode.SERVICE_CLIENT_READ_ABSOLUTE,
        "Read Absolute Service Clients",
        "View all service clients within a realm.",
    ),
    entry(
        "00000003-0012-4000-8000-200000000002",
        PermissionCode.SERVICE_CLIENT_CREATE,
        "Create Service Client",
        "Create a service client within a realm.",
    ),
    entry(
        "00000003-0012-4000-8000-200000000003",
        PermissionCode.SERVICE_CLIENT_UPDATE,
        "Update Service Client",
        "Modify a service client within a realm.",
    ),
    entry(
        "00000003-0012-4000-8000-200000000004",
        PermissionCode.SERVICE_CLIENT_REVOKE,
        "Revoke Service Client",
        "Revoke a service client within a realm.",
    ),
    entry(
        "00000003-0012-4000-8000-200000000005",
        PermissionCode.SERVICE_CLIENT_RESTORE,
        "Restore Service Client",
        "Restore a revoked service client within a realm.",
    ),
    entry(
        "00000003-0012-4000-8000-200000000006",
        PermissionCode.SERVICE_CLIENT_PURGE,
        "Purge Service Client",
        "Permanently delete a revoked service client within a realm.",
    ),

    // Membership History
    entry(
        "00000003-0014-4000-8000-200000000001",
        PermissionCode.MEMBERSHIP_HISTORY_READ_PERSONAL,
        "Read Personal Membership History",
        "View realm membership history records for the current account.",
    ),
    entry(
        "00000003-0014-4000-8000-200000000002",
        PermissionCode.MEMBERSHIP_HISTORY_READ_ABSOLUTE,
        "Read Absolute Membership History",
        "View all realm membership history records.",
    ),
    entry(
        "00000003-0014-4000-8000-200000000003",
        PermissionCode.MEMBERSHIP_HISTORY_READ_COMMON,
        "Read Common Membership History",
        "View realm membership history records within a realm.",
    ),

    // ---------------------------------------------------------------------------
    // Multitenancy
    // ---------------------------------------------------------------------------

    // Organization
    entry(
        "00000003-0001-4000-8000-400000000001",
        PermissionCode.ORGANIZATION_READ_PERSONAL,
        "Read Personal Organizations",
        "View organizations associated with the current account.",
    ),
    entry(
        "00000003-0001-4000-8000-400000000002",
        PermissionCode.ORGANIZATION_READ_ABSOLUTE,
        "Read Absolute Organizations",
        "View all organizations.",
    ),
    entry(
        "00000003-0001-4000-8000-400000000003",
        PermissionCode.ORGANIZATION_CREATE,
        "Create Organization",
        "Create an organization owned by the current account.",
    ),
    entry(
        "00000003-0001-4000-8000-400000000004",
        PermissionCode.ORGANIZATION_UPDATE,
        "Update Organization",
        "Modify metadata of an organization.",
    ),
    entry(
        "00000003-0001-4000-8000-400000000005",
        PermissionCode.ORGANIZATION_TRANSFER_OWNERSHIP,
        "Transfer Organization Ownership",
        "Transfer ownership of an organization to another active member.",
    ),
    entry(
        "00000003-0001-4000-8000-400000000006",
        PermissionCode.ORGANIZATION_REVOKE,
        "Revoke Organization",
        "Revoke an organization.",
    ),
    entry(
        "00000003-0001-4000-8000-400000000007",
        PermissionCode.ORGANIZATION_RESTORE,
        "Restore Organization",
        "Restore a previously revoked organization.",
    ),
    entry(
        "00000003-0001-4000-8000-400000000008",
        PermissionCode.ORGANIZATION_PURGE,
        "Purge Organization",
        "Permanently delete a revoked organization.",
    ),

    // Invite
    entry(
        "00000003-0002-4000-8000-400000000001",
        PermissionCode.INVITE_READ_PERSONAL,
        "Read Personal Invites",
        "View invites sent or received by the current account.",
    ),
    entry(
        "00000003-0002-4000-8000-400000000002",
        PermissionCode.INVITE_READ_COMMON,
        "Read Common Invites",
        "View all invites within an organization realm.",
    ),
    entry(
        "00000003-0002-4000-8000-400000000003",
        PermissionCode.INVITE_READ_ABSOLUTE,
        "Read Absolute Invites",
        "View all invites.",
    ),
    entry(
        "00000003-0002-4000-8000-400000000004",
        PermissionCode.INVITE_CREATE,
        "Create Invite",
        "Invite an account to an organization.",
    ),
    entry(
        "00000003-0002-4000-8000-400000000005",
        PermissionCode.INVITE_CHANGE_STATUS,
        "Change Invite Status",
        "Accept, decline, cancel, or invalidate a pending invite.",
    ),
    entry(
        "00000003-0002-4000-8000-400000000006",
        PermissionCode.INVITE_ACCEPT,
        "Accept Invite",
        "Accept an invitation addressed to the current account.",
    ),
    entry(
        "00000003-0002-4000-8000-400000000007",
        PermissionCode.INVITE_DECLINE,
        "Decline Invite",
        "Decline an invitation addressed to the current account.",
    ),
    entry(
        "00000003-0002-4000-8000-400000000008",
        PermissionCode.INVITE_CANCEL,
        "Cancel Invite",
        "Cancel a pending organization invitation.",
    ),

    // Membership
    entry(
        "00000003-0003-4000-8000-400000000001",
        PermissionCode.MEMBERSHIP_READ_PERSONAL,
        "Read Personal Memberships",
        "View organization memberships of the current account.",
    ),
    entry(
        "00000003-0003-4000-8000-400000000002",
        PermissionCode.MEMBERSHIP_READ_COMMON,
        "Read Common Memberships",
        "View all memberships within an organization realm.",
    ),
    entry(
        "00000003-0003-4000-8000-400000000003",
        PermissionCode.MEMBERSHIP_READ_ABSOLUTE,
        "Read Absolute Memberships",
        "View all organization memberships.",
    ),
    entry(
        "00000003-0003-4000-8000-400000000004",
        PermissionCode.MEMBERSHIP_SUSPEND,
        "Suspend Membership",
        "Suspend an organization membership.",
    ),
    entry(
        "00000003-0003-4000-8000-400000000005",
        PermissionCode.MEMBERSHIP_RESUME,
        "Resume Membership",
        "Resume a suspended organization membership.",
    ),
    entry(
        "00000003-0003-4000-8000-400000000006",
        PermissionCode.MEMBERSHIP_LEAVE,
        "Leave Organization",
        "End the current account's organization membership.",
    ),
    entry(
        "00000003-0003-4000-8000-400000000007",
        PermissionCode.MEMBERSHIP_BLOCK,
        "Block Membership",
        "Block an organization membership.",
    ),

    // Project
    entry(
        "00000003-0004-4000-8000-400000000001",
        PermissionCode.PROJECT_READ_PERSONAL,
        "Read Personal Projects",
        "View projects assigned to the current account.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000002",
        PermissionCode.PROJECT_READ_COMMON,
        "Read Common Projects",
        "View all projects within a realm.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000003",
        PermissionCode.PROJECT_READ_ABSOLUTE,
        "Read Absolute Projects",
        "View all projects.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000004",
        PermissionCode.PROJECT_CREATE,
        "Create Project",
        "Create a project within an organization.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000005",
        PermissionCode.PROJECT_UPDATE,
        "Update Project",
        "Modify metadata of a project.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000006",
        PermissionCode.PROJECT_CHANGE_MANAGER,
        "Change Project Manager",
        "Assign, replace, or remove the manager of a project.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000007",
        PermissionCode.PROJECT_ARCHIVE,
        "Archive Project",
        "Archive a project.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000008",
        PermissionCode.PROJECT_RESTORE,
        "Restore Project",
        "Restore an archived project.",
    ),
    entry(
        "00000003-0004-4000-8000-400000000009",
        PermissionCode.PROJECT_PURGE,
        "Purge Project",
        "Permanently delete an archived project.",
    ),

    // ProjectAccountAssignment
    entry(
        "00000003-0005-4000-8000-400000000001",
        PermissionCode.PROJECT_ACCOUNT_ASSIGNMENT_READ_PERSONAL,
        "Read Personal Project Account Assignments",
        "View project assignments of the current account.",
    ),
    entry(
        "00000003-0005-4000-8000-400000000002",
        PermissionCode.PROJECT_ACCOUNT_ASSIGNMENT_READ_COMMON,
        "Read Common Project Account Assignments",
        "View all project assignments within a realm.",
    ),
    entry(
        "00000003-0005-4000-8000-400000000003",
        PermissionCode.PROJECT_ACCOUNT_ASSIGNMENT_READ_ABSOLUTE,
        "Read Absolute Project Account Assignments",
        "View all project assignments.",
    ),
    entry(
        "00000003-0005-4000-8000-400000000004",
        PermissionCode.PROJECT_ACCOUNT_ASSIGNMENT_CREATE,
        "Create Project Account Assignment",
        "Assign an organization member to a project.",
    ),
    entry(
        "00000003-0005-4000-8000-400000000005",
        PermissionCode.PROJECT_ACCOUNT_ASSIGNMENT_REVOKE,
        "Revoke Project Account Assignment",
        "Revoke an account's project assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-400000000006",
        PermissionCode.PROJECT_ACCOUNT_ASSIGNMENT_RESTORE,
        "Restore Project Account Assignment",
        "Restore a revoked project account assignment.",
    ),
    entry(
        "00000003-0005-4000-8000-400000000007",
        PermissionCode.PROJECT_ACCOUNT_ASSIGNMENT_PURGE,
        "Purge Project Account Assignment",
        "Permanently delete a revoked project account assignment.",
    ),

    // Department
    entry(
        "00000003-0006-4000-8000-400000000001",
        PermissionCode.DEPARTMENT_READ_PERSONAL,
        "Read Personal Departments",
        "View departments assigned to the current account.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000002",
        PermissionCode.DEPARTMENT_READ_COMMON,
        "Read Common Departments",
        "View all departments within an organization realm.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000003",
        PermissionCode.DEPARTMENT_READ_ABSOLUTE,
        "Read Absolute Departments",
        "View all departments.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000004",
        PermissionCode.DEPARTMENT_CREATE,
        "Create Department",
        "Create a department within an organization.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000005",
        PermissionCode.DEPARTMENT_UPDATE,
        "Update Department",
        "Modify metadata of a department.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000006",
        PermissionCode.DEPARTMENT_CHANGE_MANAGER,
        "Change Department Manager",
        "Assign, replace, or remove the manager of a department.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000007",
        PermissionCode.DEPARTMENT_ARCHIVE,
        "Archive Department",
        "Archive a department.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000008",
        PermissionCode.DEPARTMENT_RESTORE,
        "Restore Department",
        "Restore an archived department.",
    ),
    entry(
        "00000003-0006-4000-8000-400000000009",
        PermissionCode.DEPARTMENT_PURGE,
        "Purge Department",
        "Permanently delete an archived department.",
    ),

    // DeptAccountAssignment
    entry(
        "00000003-0007-4000-8000-400000000001",
        PermissionCode.DEPT_ACCOUNT_ASSIGNMENT_READ_PERSONAL,
        "Read Personal Department Account Assignments",
        "View department assignments of the current account.",
    ),
    entry(
        "00000003-0007-4000-8000-400000000002",
        PermissionCode.DEPT_ACCOUNT_ASSIGNMENT_READ_COMMON,
        "Read Common Department Account Assignments",
        "View all department assignments within an organization realm.",
    ),
    entry(
        "00000003-0007-4000-8000-400000000003",
        PermissionCode.DEPT_ACCOUNT_ASSIGNMENT_READ_ABSOLUTE,
        "Read Absolute Department Account Assignments",
        "View all department assignments.",
    ),
    entry(
        "00000003-0007-4000-8000-400000000004",
        PermissionCode.DEPT_ACCOUNT_ASSIGNMENT_CREATE,
        "Create Department Account Assignment",
        "Assign an organization member to a department.",
    ),
    entry(
        "00000003-0007-4000-8000-400000000005",
        PermissionCode.DEPT_ACCOUNT_ASSIGNMENT_REVOKE,
        "Revoke Department Account Assignment",
        "Revoke an account's department assignment.",
    ),
    entry(
        "00000003-0007-4000-8000-400000000006",
        PermissionCode.DEPT_ACCOUNT_ASSIGNMENT_RESTORE,
        "Restore Department Account Assignment",
        "Restore a revoked department account assignment.",
    ),
    entry(
        "00000003-0007-4000-8000-400000000007",
        PermissionCode.DEPT_ACCOUNT_ASSIGNMENT_PURGE,
        "Purge Department Account Assignment",
        "Permanently delete a revoked department account assignment.",
    ),

    // Team
    entry(
        "00000003-0008-4000-8000-400000000001",
        PermissionCode.TEAM_READ_PERSONAL,
        "Read Personal Teams",
        "View teams assigned to the current account.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000002",
        PermissionCode.TEAM_READ_COMMON,
        "Read Common Teams",
        "View all teams within an organization realm.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000003",
        PermissionCode.TEAM_READ_ABSOLUTE,
        "Read Absolute Teams",
        "View all teams.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000004",
        PermissionCode.TEAM_CREATE,
        "Create Team",
        "Create a team within an organization.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000005",
        PermissionCode.TEAM_UPDATE,
        "Update Team",
        "Modify metadata of a team.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000006",
        PermissionCode.TEAM_CHANGE_LEAD,
        "Change Team Lead",
        "Assign, replace, or remove the lead of a team.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000007",
        PermissionCode.TEAM_ARCHIVE,
        "Archive Team",
        "Archive a team.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000008",
        PermissionCode.TEAM_RESTORE,
        "Restore Team",
        "Restore an archived team.",
    ),
    entry(
        "00000003-0008-4000-8000-400000000009",
        PermissionCode.TEAM_PURGE,
        "Purge Team",
        "Permanently delete an archived team.",
    ),

    // TeamAccountAssignment
    entry(
        "00000003-0009-4000-8000-400000000001",
        PermissionCode.TEAM_ACCOUNT_ASSIGNMENT_READ_PERSONAL,
        "Read Personal Team Account Assignments",
        "View team assignments of the current account.",
    ),
    entry(
        "00000003-0009-4000-8000-400000000002",
        PermissionCode.TEAM_ACCOUNT_ASSIGNMENT_READ_COMMON,
        "Read Common Team Account Assignments",
        "View all team assignments within an organization realm.",
    ),
    entry(
        "00000003-0009-4000-8000-400000000003",
        PermissionCode.TEAM_ACCOUNT_ASSIGNMENT_READ_ABSOLUTE,
        "Read Absolute Team Account Assignments",
        "View all team assignments.",
    ),
    entry(
        "00000003-0009-4000-8000-400000000004",
        PermissionCode.TEAM_ACCOUNT_ASSIGNMENT_CREATE,
        "Create Team Account Assignment",
        "Assign an organization member to a team.",
    ),
    entry(
        "00000003-0009-4000-8000-400000000005",
        PermissionCode.TEAM_ACCOUNT_ASSIGNMENT_REVOKE,
        "Revoke Team Account Assignment",
        "Revoke an account's team assignment.",
    ),
    entry(
        "00000003-0009-4000-8000-400000000006",
        PermissionCode.TEAM_ACCOUNT_ASSIGNMENT_RESTORE,
        "Restore Team Account Assignment",
        "Restore a revoked team account assignment.",
    ),
    entry(
        "00000003-0009-4000-8000-400000000007",
        PermissionCode.TEAM_ACCOUNT_ASSIGNMENT_PURGE,
        "Purge Team Account Assignment",
        "Permanently delete a revoked team account assignment.",
    ),

    // ---------------------------------------------------------------------------
    // Notification
    // ---------------------------------------------------------------------------

    // Recipient
    entry(
        "00000003-0001-4000-8000-300000000001",
        PermissionCode.RECIPIENT_READ_PERSONAL,
        "Read Personal Recipient",
        "View your own notification recipient profile.",
    ),
    entry(
        "00000003-0001-4000-8000-300000000002",
        PermissionCode.RECIPIENT_READ_ABSOLUTE,
        "Read Absolute Recipient",
        "View the notification recipient profile of any account.",
    ),
    entry(
        "00000003-0001-4000-8000-300000000003",
        PermissionCode.RECIPIENT_UPDATE,
        "Update Recipient",
        "Update your own notification recipient profile.",
    ),
    entry(
        "00000003-0001-4000-8000-300000000004",
        PermissionCode.RECIPIENT_SELECT_OTP_CHANNEL,
        "Select OTP Channel",
        "Select which of your verified channels receives OTP codes.",
    ),

    // Channel
    entry(
        "00000003-0002-4000-8000-300000000001",
        PermissionCode.CHANNEL_READ_PERSONAL,
        "Read Personal Channels",
        "View your own notification channels.",
    ),
    entry(
        "00000003-0002-4000-8000-300000000002",
        PermissionCode.CHANNEL_READ_ABSOLUTE,
        "Read Absolute Channels",
        "View notification channels of any account.",
    ),
    entry(
        "00000003-0002-4000-8000-300000000003",
        PermissionCode.CHANNEL_TOGGLE_SOUND,
        "Toggle Channel Sound",
        "Toggle sound for your in-app notification channel.",
    ),

    // Notification
    entry(
        "00000003-0003-4000-8000-300000000001",
        PermissionCode.NOTIFICATION_READ_PERSONAL,
        "Read Personal Notifications",
        "View your own notifications.",
    ),
    entry(
        "00000003-0003-4000-8000-300000000002",
        PermissionCode.NOTIFICATION_READ_ABSOLUTE,
        "Read Absolute Notifications",
        "View notifications of any account.",
    ),

    // Message
    entry(
        "00000003-0004-4000-8000-300000000001",
        PermissionCode.MESSAGE_READ_PERSONAL,
        "Read Personal Messages",
        "View delivery status of your own notification messages.",
    ),
    entry(
        "00000003-0004-4000-8000-300000000002",
        PermissionCode.MESSAGE_READ_ABSOLUTE,
        "Read Absolute Messages",
        "View delivery status of notification messages of any account.",
    ),
    entry(
        "00000003-0004-4000-8000-300000000003",
        PermissionCode.MESSAGE_MARK_READ,
        "Mark Message Read",
        "Mark your own in-app notification message as read.",
    ),

    // Preference
    entry(
        "00000003-0005-4000-8000-300000000001",
        PermissionCode.PREFERENCE_READ_PERSONAL,
        "Read Personal Preferences",
        "View your own notification duplication preferences.",
    ),
    entry(
        "00000003-0005-4000-8000-300000000002",
        PermissionCode.PREFERENCE_READ_ABSOLUTE,
        "Read Absolute Preferences",
        "View notification duplication preferences of any account.",
    ),
    entry(
        "00000003-0005-4000-8000-300000000003",
        PermissionCode.PREFERENCE_TOGGLE,
        "Toggle Preference",
        "Toggle notification duplication for a channel and category.",
    ),
];

export const Permissions = {
    postgresql: dataset,
    name: "permission",
    redis: dataset,
}
