declare namespace Services {
    namespace Invite {
        interface Contract {
            create(props: Create.Props): Create.Result;
            accept(props: Accept.Props): Accept.Result;
            decline(props: Decline.Props): Decline.Result;
            cancel(props: Cancel.Props): Cancel.Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                role: Entities.Role;
                input: {
                    invitee: string;
                    inviter: string;
                };
            };

            type Result = Entities.Invite;
        }

        namespace Accept {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;
        }

        namespace Decline {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;
        }

        namespace Cancel {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;
        }
    }
}
