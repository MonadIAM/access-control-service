import { AccountTopicAction } from "@monadiam/contracts";

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
                operationType: ProjectionScript;
                lastError: Nullable<string>;
                appliedAt: Nullable<Date>;
                lockedAt: Nullable<Date>;
                lockedBy: Nullable<Date>;
                availableAt: Date;
                attempts: number;
                createdAt: Date;
                payload: string;
                status: string;
                id: string;
            };
        }
    }
}
