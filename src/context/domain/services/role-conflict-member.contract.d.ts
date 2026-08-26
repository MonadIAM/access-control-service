declare namespace Services {
    namespace RoleConflictMember {
        interface Contract extends CommandContract {}

        interface CommandContract {
            create: Create.Signature;
            purge: Purge.Signature;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    group: Entities.RoleConflictGroup;
                    roles: Entities.Role[];
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RoleConflictMember[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
