import { MoveMode, RoleActorType, RoleArchetype } from "~context/enums";

declare global {
    namespace Commands {
        namespace Role {
            interface Contract extends ControllerContract, InternalContract {}

            interface InternalContract {
                accessCachePayloadMapper: AccessCachePayloadMapper.Signature;
            }

            namespace AccessCachePayloadMapper {
                type Props = Entities.Role[] | { realm: string }[];

                type Result = Topics.AccessCache.Message["payload"];

                type Signature = (props: Props) => Result;
            }

            interface ControllerContract {
                purgeSubtree: PurgeSubtree.Signature;
                restore: Restore.Signature;
                create: Create.Signature;
                update: Update.Signature;
                revoke: Revoke.Signature;
                purge: Purge.Signature;
                move: Move.Signature;
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

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
            }

            namespace Create {
                type Props = {
                    actor: string;
                    realm: string;
                    input: {
                        code: string;
                        name: string;
                        description?: string;
                        actorType: RoleActorType;
                        archetype: RoleArchetype;
                        nonDelegable: boolean;
                        parent: string;
                        children: string[];
                    };
                    context: Extract.Meta;
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
            }
        }
    }
}
