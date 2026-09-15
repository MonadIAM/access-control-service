declare namespace Scripts {
    namespace RolePermissionAssignment {
        namespace Create {
            type Props = {
                assignments: {
                    permissionRealm: string;
                    permission: string;
                    assignment: string;
                    scope: string;
                }[];
                realm: string;
                role: string;
            };

            type Result = "OK";
        }

        namespace Purge {
            type Props = {
                realm: string;
                items: {
                    permissionRealm: string;
                    permission: string;
                    realm: string;
                    role: string;
                }[];
            };

            type Result = "OK";
        }

        namespace Update {
            type Props = {
                isRevoked: boolean;
                realm: string;
                items: {
                    permissionRealm: string;
                    permission: string;
                    assignment: string;
                    realm: string;
                    role: string;
                }[];
            };

            type Result = "OK";
        }
    }

    namespace AccountRoleAssignment {
        namespace Create {
            type Props = {
                assignments: {
                    assignment: string;
                    role: string;
                }[];
                account: string;
                realm: string;
            };

            type Result = "OK";
        }

        namespace Purge {
            type Props = {
                realm: string;
                items: {
                    account: string;
                    realm: string;
                    role: string;
                }[];
            };

            type Result = "OK";
        }

        namespace Update {
            type Props = {
                isRevoked: boolean;
                realm: string;
                items: {
                    assignment: string;
                    account: string;
                    realm: string;
                    role: string;
                }[];
            };

            type Result = "OK";
        }

        namespace Validate {
            type Props = {
                items: {
                    account: string;
                    realm: string;
                    role: string;
                }[];
            };

            type Result = {
                missing: string[];
                groups: {
                    remaining: number;
                    account: string;
                    realm: string;
                }[];
            };
        }
    }

    namespace PermissionOverride {
        namespace Create {
            type Props = {
                permissionRealm: string;
                permission: string;
                override: string;
                account: string;
                effect: string;
                realm: string;
            };

            type Result = "OK";
        }

        namespace Purge {
            type Props = {
                realm: string;
                items: {
                    permissionRealm: string;
                    permission: string;
                    account: string;
                    realm: string;
                }[];
            };

            type Result = "OK";
        }

        namespace Update {
            type Props = {
                isRevoked: boolean;
                realm: string;
                items: {
                    permissionRealm: string;
                    permission: string;
                    override: string;
                    account: string;
                    effect: string;
                    realm: string;
                }[];
            };

            type Result = "OK";
        }
    }

    namespace Permission {
        namespace Create {
            type Props = {
                permission: string;
                realm: string;
                code: string;
            };

            type Result = "OK";
        }

        namespace Purge {
            type Props = {
                permissions: string[];
                realm: string;
            };

            type Result = "OK";
        }

        namespace Update {
            type Props = {
                permissions: string[];
                isRevoked: boolean;
                realm: string;
            };

            type Result = "OK";
        }

        namespace Check {
            type Props = {
                permissionRealm: string;
                permissions: string[];
                globalOnly?: boolean;
                systemRealm: string;
                account: string;
                realm: string;
            };

            type Result = string[];
        }

        namespace Collect {
            type Props = {
                permissionRealm: string;
                systemRealm: string;
                account: string;
                realm: string;
            };

            type Result = Record<string, string>;
        }
    }

    namespace Realm {
        namespace Create {
            type Props = {
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

            type Result = "OK";
        }

        namespace Purge {
            type Props = {
                realm: string;
            };

            type Result = "OK";
        }

        namespace Update {
            type Props = {
                isRevoked: boolean;
                realm: string;
            };

            type Result = "OK";
        }

        namespace Collect {
            type Props = {
                account: string;
            };

            type Result = string[];
        }

        namespace Check {
            type Props = {
                account: string;
                realm: string;
            };

            type Result = boolean;
        }
    }

    namespace Role {
        namespace Create {
            type Props = {
                parent: string;
                realm: string;
                role: string;
            };

            type Result = "OK";
        }

        namespace Purge {
            type Props = {
                realm: string;
                role: string;
            };

            type Result = "OK";
        }

        namespace Update {
            type Props = {
                isRevoked: boolean;
                roles: string[];
                realm: string;
            };

            type Result = "OK";
        }
    }

    namespace RoleClosure {
        namespace Update {
            type Props = {
                steps: {
                    removedPaths: {
                        descendant: { id: string };
                        ancestor: { id: string };
                    }[];
                    upsertedPaths: {
                        descendant: { id: string };
                        ancestor: { id: string };
                        depth: number;
                    }[];
                }[];
                realm: string;
            };

            type Result = "OK";
        }
    }
}
