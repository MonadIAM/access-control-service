import { AccountTopicAction } from "@monadiam/shared";

import { ProjectionScript } from "~context/infrastructure/scripts";

declare global {
    namespace Consumers {
        namespace Account {
            interface Contract {
                handle(message: Payload): Promise<void>;
            }

            type Payload = Topics.Account.Message;

            type Handlers = {
                [K in AccountTopicAction]: (payload: Topics.Account.Message["payload"]) => Promise<void>;
            };
        }

        namespace Reauthentication {
            interface Contract {
                handle(props: Payload): Promise<void>;
            }

            type Payload = Topics.Reauthentication.Message;
        }

        namespace Blacklist {
            interface Contract {
                handle(props: Payload): Promise<void>;
            }

            type Payload = Topics.Blacklist.Message;
        }

        namespace Projection {
            interface Contract {
                handle(props: Payload): Promise<void>;
            }

            type Payload = {
                actionType: ProjectionScript;
                payload: UnknownObject;
            };
        }
    }
}
