import { AccountTopicAction } from "@monadiam/shared";
import { KafkaContext } from "@nestjs/microservices";

import { ProjectionScript } from "~context/infrastructure/scripts";

declare global {
    namespace Consumers {
        namespace Account {
            type Message = Topics.Account.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }

            type Handlers = {
                [K in AccountTopicAction]: (payload: Topics.Account.Message["payload"]) => Promise<void>;
            };
        }

        namespace Reauthentication {
            type Message = Topics.Reauthentication.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }
        }

        namespace Blacklist {
            type Message = Topics.Blacklist.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }
        }

        namespace Projection {
            type Message = {
                actionType: ProjectionScript;
                payload: UnknownObject;
            };

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }
        }

        namespace Membership {
            type Message = Topics.Membership.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }
        }

        namespace Retry {
            type Message = Consumers.DLQ.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }
        }
    }
}
