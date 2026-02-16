import { RolePermissionAssignmentService } from "./role-permission-assignment.service";
import { PermissionService } from "./permission.service";
import { RealmService } from "./realm.service";
import { RoleService } from "./role.service";

export const ROLE_PERMISSION_ASSIGNMENT_SERVICE = Symbol("Services.RolePermissionAssignment.Contract");
export const PERMISSION_SERVICE = Symbol("Services.Permission.Contract");
export const REALM_SERVICE = Symbol("Services.Realm.Contract");
export const ROLE_SERVICE = Symbol("Services.Role.Contract");

export const SERVICES = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_SERVICE,
        useClass: RolePermissionAssignmentService,
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
