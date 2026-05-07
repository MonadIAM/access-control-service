import { MoveMode, RoleActorType, RoleProtoType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Role {
            interface Contract {
                purgeSubtree: (props: PurgeSubtree.Props) => Promise<PurgeSubtree.Result>;
                move: (props: Move.Props) => Promise<Move.Result>;
                restore: (props: Restore.Props) => Promise<Restore.Result>;
                create: (props: Create.Props) => Promise<Create.Result>;
                update: (props: Update.Props) => Promise<Update.Result>;
                revoke: (props: Revoke.Props) => Promise<Revoke.Result>;
                purge: (props: Purge.Props) => Promise<Purge.Result>;
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
                        protoType: RoleProtoType;
                        nonDelegable: boolean;
                        parent: string;
                        children: string[];
                    };
                    context: Extract.Meta;
                };

                type Result = MessageResult;
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

                type Result = MessageResult;
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

                type Result = MessageResult;
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

                type Result = MessageResult;
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

                type Result = MessageResult;
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

                type Result = MessageResult;
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

                type Result = MessageResult;
            }
        }
    }
}
