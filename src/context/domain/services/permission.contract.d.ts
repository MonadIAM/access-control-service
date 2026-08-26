declare namespace Services {
    namespace Permission {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            revoke: Revoke.Signature;
            create: Create.Signature;
            update: Update.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                entities: Entities.Permission[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
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

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.Permission.MutableFields>;
                entity: Entities.Permission;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.Permission[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.Permission[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
