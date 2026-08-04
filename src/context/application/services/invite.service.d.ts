declare namespace Services {
    namespace Invite {
        interface Contract extends CommandContract {}

        interface CommandContract {
            decline: Decline.Signature;
            accept: Accept.Signature;
            cancel: Cancel.Signature;
            create: Create.Signature;
        }

        namespace Decline {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Accept {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Cancel {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
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

            type Signature = (props: Props) => Result;
        }
    }
}
