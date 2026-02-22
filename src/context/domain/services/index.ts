import { RolePermissionAssignmentService } from "./role-permission-assignment.service";
import { AccountRoleAssignmentService } from "./account-role-assignment.service";
import { RoleConflictMemberService } from "./role-conflict-member.service";
import { PermissionOverrideService } from "./permission-override.service";
import { RoleConflictGroupService } from "./role-conflict-group.service";
import { PermissionService } from "./permission.service";
import { RealmService } from "./realm.service";
import { RoleService } from "./role.service";

export const ROLE_PERMISSION_ASSIGNMENT_SERVICE = Symbol("Services.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_SERVICE = Symbol("Services.AccountRoleAssignment.Contract");
export const ROLE_CONFLICT_MEMBER_SERVICE = Symbol("Services.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_SERVICE = Symbol("Services.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_SERVICE = Symbol("Services.RoleConflictGroup.Contract");
export const PERMISSION_SERVICE = Symbol("Services.Permission.Contract");
export const REALM_SERVICE = Symbol("Services.Realm.Contract");
export const ROLE_SERVICE = Symbol("Services.Role.Contract");

export const SERVICES = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_SERVICE,
        useClass: RolePermissionAssignmentService,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_SERVICE,
        useClass: AccountRoleAssignmentService,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_SERVICE,
        useClass: RoleConflictMemberService,
    },
    {
        provide: PERMISSION_OVERRIDE_SERVICE,
        useClass: PermissionOverrideService,
    },
    {
        provide: ROLE_CONFLICT_GROUP_SERVICE,
        useClass: RoleConflictGroupService,
    },
    {
        provide: PERMISSION_SERVICE,
        useClass: PermissionService,
    },
    {
        provide: REALM_SERVICE,
        useClass: RealmService,
    },
    {
        provide: ROLE_SERVICE,
        useClass: RoleService,
    },
];
