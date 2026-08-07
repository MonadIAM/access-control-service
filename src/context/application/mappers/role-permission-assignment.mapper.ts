import { InvalidationScope } from "~context/enums";

export class RolePermissionAssignmentMapper implements Commands.Mappers.RolePermissionAssignment.Contract {
    public projectionCreatePayload(
        props: Commands.Mappers.RolePermissionAssignment.ProjectionCreatePayload.Props,
    ): Commands.Mappers.RolePermissionAssignment.ProjectionCreatePayload.Result {
        return {
            realm: props.assignments[0].realm.id,
            role: props.assignments[0].role.id,
            assignments: props.assignments.map(({ id, permission, scope }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                assignment: id,
                scope,
            })),
        };
    }

    public projectionPurgePayload(
        props: Commands.Mappers.RolePermissionAssignment.ProjectionPurgePayload.Props,
    ): Commands.Mappers.RolePermissionAssignment.ProjectionPurgePayload.Result {
        return {
            items: props.assignments.map(({ realm, role, permission }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                realm: realm.id,
                role: role.id,
            })),
        };
    }

    public projectionUpdatePayload(
        props: Commands.Mappers.RolePermissionAssignment.ProjectionUpdatePayload.Props,
    ): Commands.Mappers.RolePermissionAssignment.ProjectionUpdatePayload.Result {
        return {
            isRevoked: props.assignments[0].isRevoked,
            items: props.assignments.map(({ id, realm, role, permission }) => ({
                permissionRealm: permission.realm.id,
                permission: permission.id,
                realm: realm.id,
                assignment: id,
                role: role.id,
            })),
        };
    }

    public accessCachePayload(
        props: Commands.Mappers.RolePermissionAssignment.AccessCachePayload.Props,
    ): Commands.Mappers.RolePermissionAssignment.AccessCachePayload.Result {
        return {
            items: props.assignments.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
