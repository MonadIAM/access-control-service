import { RoleActorType, RoleProtoType } from "~context/enums";

declare global {
    namespace Handlers {
        namespace Role {
            interface Contract {
                create: (props: Create) => Promise<MessageResult>;
                update: (props: Update) => Promise<MessageResult>;
                purge: (props: Purge) => Promise<MessageResult>;
                purgeSubtree: (props: PurgeSubtree) => Promise<MessageResult>;
                revoke: (props: Revoke) => Promise<MessageResult>;
                restore: (props: Restore) => Promise<MessageResult>;
            }

            type Create = {
                actor: string;
                realm: string;
                context: RequestContext;
                input: {
                    code: string;
                    name: string;
                    description?: string;
                    actorType: RoleActorType;
                    protoType: RoleProtoType;
                    nonDelegable: boolean;
                    parent: string;
                    children: string[];
                };
            };

            type Update = {
                id: string;
                actor: string;
                realm: string;
                input: {
                    patch: Partial<Entities.Role.MutableFields>;
                    reason: string;
                };
                context: RequestContext;
            };

            type Purge = {
                id: string;
                actor: string;
                realm: string;
                input: {
                    reason: string;
                };
                context: RequestContext;
            };

            type PurgeSubtree = {
                id: string;
                actor: string;
                realm: string;
                input: {
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
