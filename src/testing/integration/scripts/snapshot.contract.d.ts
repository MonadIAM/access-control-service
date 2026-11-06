export {};

declare global {
    namespace Fixtures.Projection.Snapshot {
        type Entity = { id: string; is_revoked: boolean };
        type Role = Entity & { realm_id: string };
        type Permission = Role & { code: string };
        type Path = { realm_id: string; ancestor_id: string; descendant_id: string; depth: number };
        type Assignment = Role & { role_id: string; account: string; expires_at?: Nullable<string | number | Date> };
        type Grant = Role & { role_id: string; permission_id: string; permission_realm_id: string; scope: string };
        type Override = Role & {
            account: string;
            permission_id: string;
            permission_realm_id: string;
            effect: string;
            expires_at?: Nullable<string | number | Date>;
        };
        type Data = {
            realms: Entity[];
            roles: Role[];
            permissions: Permission[];
            roleClosures: Path[];
            accountRoleAssignments: Assignment[];
            rolePermissionAssignments: Grant[];
            permissionOverrides: Override[];
        };
    }
}
