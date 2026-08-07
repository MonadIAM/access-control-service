import { InvalidationScope } from "~context/enums";

export class RolePermissionAssignmentMapper implements Mappers.RolePermissionAssignment.Contract {
    public projectionCreatePayload(
        props: Mappers.RolePermissionAssignment.ProjectionCreatePayload.Props,
    ): Mappers.RolePermissionAssignment.ProjectionCreatePayload.Result {
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
        props: Mappers.RolePermissionAssignment.ProjectionPurgePayload.Props,
    ): Mappers.RolePermissionAssignment.ProjectionPurgePayload.Result {
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
        props: Mappers.RolePermissionAssignment.ProjectionUpdatePayload.Props,
    ): Mappers.RolePermissionAssignment.ProjectionUpdatePayload.Result {
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
        props: Mappers.RolePermissionAssignment.AccessCachePayload.Props,
    ): Mappers.RolePermissionAssignment.AccessCachePayload.Result {
        return {
            items: props.assignments.map(({ realm }) => ({
                scope: InvalidationScope.REALM,
                realm: realm.id,
            })),
        };
    }
}
