import { SchemaRegistry as ConfluentSchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { KafkaRequest } from "@nestjs/microservices/serializers";
import { KafkaContext } from "@nestjs/microservices";

declare global {
    namespace Kafka {
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

        type Message = Pick<Request, "value"> & Partial<Omit<Request, "value">>;

        type Request = KafkaRequest;

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
            type Config = {
                registryUrl: string;
                enabled: boolean;
            };

            type Schema = Awaited<ReturnType<ConfluentSchemaRegistry["getSchema"]>>;

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
