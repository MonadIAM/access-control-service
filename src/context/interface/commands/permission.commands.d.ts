declare namespace Commands {
    namespace Permission {
        interface Contract extends ControllerContract, InternalContract {}

        interface InternalContract {
            accessCachePayloadMapper: AccessCachePayloadMapper.Signature;
        }

        namespace AccessCachePayloadMapper {
            type Result = Topics.AccessCache.Message["payload"];

            type Props = Entities.Permission[];

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
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
                    patch: Partial<Entities.Permission.MutableFields>;
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
    }
}
