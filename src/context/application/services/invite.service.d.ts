import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Invite {
            interface Contract {
                create(props: Create.Props): Create.Result;
                accept(props: Accept.Props): Accept.Result;
                decline(props: Decline.Props): Decline.Result;
                cancel(props: Cancel.Props): Cancel.Result;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        invitee: string;
                        inviter: string;
                    };
                    realm: Entities.Realm;
                    role: Entities.Role;
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
}
