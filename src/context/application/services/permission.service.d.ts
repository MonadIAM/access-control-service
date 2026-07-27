declare namespace Services {
    namespace Permission {
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
                    code: string;
                    name: string;
                    description?: string;
                };
            };

            type Result = Promise<Entities.Permission>;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.Permission.MutableFields>;
                entity: Entities.Permission;
            };

            type Result = void;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.Permission[];
            };

            type Result = void;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.Permission[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.Permission[];
            };

            type Result = void;
        }
    }
}
