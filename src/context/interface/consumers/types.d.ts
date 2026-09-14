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
                payload: UnknownObject;
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

        namespace Membership {
            type Message = Topics.Membership.Message;

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

        namespace Retry {
            type Message = Consumers.DLQ.Message;

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
                    context: KafkaContext;
                    message: Message;
                    event: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    message: Message;
                    error: unknown;
                    event: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
