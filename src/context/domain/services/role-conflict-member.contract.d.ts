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
                realm: string;
                input: {
                    roles: string[];
                    group: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.RoleConflictMember[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
