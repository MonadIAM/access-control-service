declare namespace Commands {
    namespace RolePermissionAssignment {
        interface ControllerContract {
            restore(props: Restore.Props): Restore.Result;
            create(props: Create.Props): Create.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        interface PrivateContract {
            accessCachePayloadMapper(props: AccessCachePayloadMapper.Props): AccessCachePayloadMapper.Result;
        }

        interface Contract extends ControllerContract, PrivateContract {}

        namespace Create {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    permissions: string[];
                    role: string;
                };
                context: Extract.Meta;
            };

            type Result = Promise<MessageResult>;
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

        namespace AccessCachePayloadMapper {
            type Props = Entities.RolePermissionAssignment[];
            type Result = Topics.AccessCache.Message["payload"];
        }
    }
}
