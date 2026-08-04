declare namespace Services {
    namespace RoleConflictGroup {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                entities: Entities.RoleConflictGroup[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
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

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                entity: Entities.RoleConflictGroup;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.RoleConflictGroup[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RoleConflictGroup[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
