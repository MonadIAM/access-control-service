declare namespace Services {
    namespace RoleConflictGroup {
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
                    members: Entities.Role[];
                    description: string;
                    maxAllowed: number;
                    code: string;
                    name: string;
                };
            };

            type Result = Promise<void>;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                entity: Entities.RoleConflictGroup;
            };

            type Result = void;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RoleConflictGroup[];
            };

            type Result = void;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.RoleConflictGroup[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.RoleConflictGroup[];
            };

            type Result = void;
        }
    }
}
