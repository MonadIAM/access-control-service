import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Handlers {
        namespace PermissionOverride {
            interface Contract {
                create: (props: Create) => Promise<MessageResult>;
                purge: (props: Purge) => Promise<MessageResult>;
                revoke: (props: Revoke) => Promise<MessageResult>;
                restore: (props: Restore) => Promise<MessageResult>;
            }

            type Create = {
                actor: string;
                realm: string;
                context: RequestContext;
                input: {
                    effect: PermissionOverrideEffect;
                    permission: string;
                    account: string;
                };
            };

            type Purge = {
                actor: string;
                realm: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: RequestContext;
            };

            type Revoke = {
                actor: string;
                realm: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: RequestContext;
            };

            type Restore = {
                actor: string;
                realm: string;
                input: {
                    identifiers: string[];
                    reason: string;
                };
                context: RequestContext;
            };
        }
    }
}
