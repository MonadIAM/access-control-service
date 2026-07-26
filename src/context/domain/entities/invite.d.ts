import { InviteStatus } from "~context/enums";

declare global {
    namespace Entities {
        type Invite = Invite.Contract;

        namespace Invite {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                status: InviteStatus;
                invitee: string;
                inviter: string;

                realm: Entities.Realm;
                role: Entities.Role;

                cancel(): void;
                accept(): void;
                decline(): void;
            }

            type ConstructorProps = {
                invitee: string;
                inviter: string;
                realm: Entities.Realm;
                role: Entities.Role;
            };
        }
    }
}
