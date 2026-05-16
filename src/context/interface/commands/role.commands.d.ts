import { MoveMode, RoleActorType, RoleProtoType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Role {
            interface ControllerContract {
                purgeSubtree: (props: PurgeSubtree.Props) => PurgeSubtree.Result;
                restore: (props: Restore.Props) => Restore.Result;
                create: (props: Create.Props) => Create.Result;
                update: (props: Update.Props) => Update.Result;
                revoke: (props: Revoke.Props) => Revoke.Result;
                purge: (props: Purge.Props) => Purge.Result;
                move: (props: Move.Props) => Move.Result;
            }

            interface PrivateContract {
                outboxPayloadMapper: (props: OutboxPayloadMapper.Props) => OutboxPayloadMapper.Result;
            }

            interface Contract extends ControllerContract, PrivateContract {}

            namespace Create {
                type Props = {
                    actor: string;
                    realm: string;
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
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace Update {
                type Props = {
                    id: string;
                    actor: string;
                    realm: string;
                    input: {
                        patch: Partial<Entities.Role.MutableFields>;
                        reason: string;
                    };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace Purge {
                type Props = {
                    id: string;
                    actor: string;
                    realm: string;
                    input: {
                        reason: string;
                    };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace PurgeSubtree {
                type Props = {
                    id: string;
                    actor: string;
                    realm: string;
                    input: {
                        reason: string;
                    };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace Revoke {
                type Props = {
                    actor: string;
                    realm: string;
                    input: {
                        identifiers: string[];
                        reason: string;
                    };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace Restore {
                type Props = {
                    actor: string;
                    realm: string;
                    input: {
                        identifiers: string[];
                        reason: string;
                    };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;
            }

            namespace Move {
                type Props = {
                    input: {
                        targetParent: string;
                        mode: MoveMode;
                        target: string;
                    };
                    context: Extract.Meta;
                    actor: string;
                    realm: string;
                };

                type Result = Promise<MessageResult>;
            }

            namespace OutboxPayloadMapper {
                type Props = Entities.Role[] | { realm: string }[];
                type Result = Events.AccessCache.Invalidation;
            }
        }
    }
}
