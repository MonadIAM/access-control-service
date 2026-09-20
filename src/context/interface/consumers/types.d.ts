import { KafkaContext } from "@nestjs/microservices";

import { ProjectionScript } from "~context/infrastructure/scripts";

declare global {
    namespace Consumers {
        namespace Account {
            type Message = Topics.Account.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Reauthentication {
            type Message = Topics.Reauthentication.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Blacklist {
            type Message = Topics.Blacklist.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Projection {
            type Message = {
                actionType: ProjectionScript;
                payload: UnknownObject & {
                    realm: string;
                };
            };

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Realm {
            type Message = Topics.Realm.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
