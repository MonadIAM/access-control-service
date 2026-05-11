declare namespace Scripts {
    namespace RolePermissionAssignment {
        type Create = {
            assignments: {
                permissionRealm: string;
                permission: string;
                assignment: string;
                scope: string;
            }[];
            realm: string;
            role: string;
        };

        type Purge = {
            items: {
                permissionRealm: string;
                permission: string;
                realm: string;
                role: string;
            }[];
        };

        type Update = {
            isRevoked: boolean;
            items: {
                permissionRealm: string;
                permission: string;
                assignment: string;
                realm: string;
                role: string;
            }[];
        };
    }

    namespace AccountRoleAssignment {
        type Create = {
            assignments: {
                assignment: string;
                role: string;
            }[];
            account: string;
            realm: string;
        };

        type Purge = {
            items: {
                account: string;
                realm: string;
                role: string;
            }[];
        };

        type Update = {
            isRevoked: boolean;
            items: {
                assignment: string;
                account: string;
                realm: string;
                role: string;
            }[];
        };
    }

    namespace PermissionOverride {
        type Create = {
            permissionRealm: string;
            permission: string;
            override: string;
            account: string;
            effect: string;
            realm: string;
        };

        type Purge = {
            items: {
                permissionRealm: string;
                permission: string;
                account: string;
                realm: string;
            }[];
        };

        type Update = {
            isRevoked: boolean;
            items: {
                permissionRealm: string;
                permission: string;
                override: string;
                account: string;
                effect: string;
                realm: string;
            }[];
        };
    }

    namespace Permission {
        type Create = {
            permission: string;
            realm: string;
            code: string;
        };

        type Purge = {
            permissions: string[];
            realm: string;
        };

        type Update = {
            permissions: string[];
            isRevoked: boolean;
            realm: string;
        };
    }

    namespace Realm {
        type Create = {
            rolePermissionAssignments: {
                permission: string;
                assignment: string;
                scope: string;
                role: string;
            }[];
            accountRoleAssignments: {
                assignment: string;
                account: string;
                role: string;
            }[];
            paths: {
                descendant: string;
                ancestor: string;
                depth: number;
            }[];
            permissionRealm: string;
            roles: string[];
            realm: string;
        };

        type Purge = {
            realms: string[];
        };

        type Update = {
            isRevoked: boolean;
            realms: string[];
        };
    }

    namespace Role {
        type Create = {
            parent: string;
            realm: string;
            role: string;
        };

        type Purge = {
            realm: string;
            role: string;
        };

        type Update = {
            isRevoked: boolean;
            roles: string[];
            realm: string;
        };

        type Move = {
            steps: {
                removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
            }[];
            realm: string;
        };
    }
}
