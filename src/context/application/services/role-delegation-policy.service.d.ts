declare namespace Services {
    namespace RoleDelegationPolicy {
        interface Contract {
            restore(props: Restore.Props): Restore.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                input: {
                    delegator: Entities.Role;
                    target: Entities.Role;
                    description: string;
                    depthLimit?: number;
                };
            };

            type Result = Promise<void>;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                entity: Entities.RoleDelegationPolicy;
            };

            type Result = void;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RoleDelegationPolicy[];
            };

            type Result = void;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.RoleDelegationPolicy[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.RoleDelegationPolicy[];
            };

            type Result = void;
        }
    }
}
