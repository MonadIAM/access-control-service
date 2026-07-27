declare namespace Services {
    namespace AccountRoleAssignment {
        interface Contract {
            restore(props: Restore.Props): Restore.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            create(props: Create.Props): Create.Result;
            assign(props: Assign.Props): Assign.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                actor: string;
                input: {
                    roles: Entities.Role[];
                    account: string;
                };
            };

            type Result = Promise<Entities.AccountRoleAssignment[]>;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.AccountRoleAssignment[];
            };

            type Result = void;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.AccountRoleAssignment[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.AccountRoleAssignment[];
            };

            type Result = void;
        }

        namespace Assign {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    realm: Entities.Realm;
                    role: Entities.Role;
                    account: string;
                };
            };

            type Result = Entities.AccountRoleAssignment;
        }
    }
}
