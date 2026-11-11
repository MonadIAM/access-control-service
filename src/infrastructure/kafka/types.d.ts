import { JsonSerializer } from "@confluentinc/schemaregistry";
import { KafkaJS } from "@confluentinc/kafka-javascript";

import { KafkaContext } from "./context";

declare global {
    namespace Kafka {
        type Config = KafkaJS.CommonConstructorConfig & { kafkaJS: KafkaJS.KafkaConfig };
        namespace Retry {
            interface Contract {
                execute: Execute.Signature;
            }

            namespace Execute {
                type Props = {
                    heartbeat: ReturnType<KafkaContext["getHeartbeat"]>;
                    reject(error: unknown): Promise<void>;
                    process(): Promise<void>;
                    topic: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Retry {
                type Props = Execute.Props & {
                    attempt: number;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Wait {
                type Props = {
                    heartbeat: ReturnType<KafkaContext["getHeartbeat"]>;
                    deadline: number;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Backoff {
                type Props = {
                    attempt: number;
                };

                type Result = number;

                type Signature = (props: Props) => Result;
            }
        }

        type Message = Omit<KafkaJS.Message, "value"> & { value: unknown };

        type Request = KafkaJS.Message;

        namespace IncomingMapper {
            type Context = Pick<KafkaContext, "getMessage" | "getPartition" | "getTopic">;

            interface Contract {
                reference: Event.Signature;
                event: Event.Signature;
                map: Map.Signature;
            }

            namespace Event {
                type Props = {
                    context: IncomingMapper.Context;
                };

                type Result = string;

                type Signature = (props: Props) => Result;
            }

            namespace Map {
                type Props = {
                    context: IncomingMapper.Context;
                    consumerKey: string;
                };

                type Result = TransactionManager.Service.IncomingMessage;

                type Signature = (props: Props) => Result;
            }
        }

        namespace SchemaRegistry {
            type Validator = NonNullable<Awaited<ReturnType<JsonSerializer["toValidateFunction"]>>>;

            interface Contract extends PublicContract {}

            interface PublicContract {
                validate: Validate.Signature;
                decode: Decode.Signature;
                encode: Encode.Signature;
            }

            namespace Validate {
                type Props = {
                    value: object;
                    topic: string;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Encode {
                type Props = {
                    topic: string;
                    value: unknown;
                };

                type Result = Promise<unknown>;

                type Signature = (props: Props) => Result;
            }

            namespace Decode {
                type Props = {
                    value: unknown;
                    topic: string;
                };

                type Result<T> = Promise<T>;

                type Signature = <T>(props: Props) => Result<T>;
            }
        }
    }
}
