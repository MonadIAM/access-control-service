import { SchemaRegistry as ConfluentSchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { KafkaRequest } from "@nestjs/microservices/serializers";
import { KafkaContext } from "@nestjs/microservices";

declare global {
    namespace Kafka {
        type Message = Pick<Request, "value"> & Partial<Omit<Request, "value">>;

        type Request = KafkaRequest;

        namespace IncomingMapper {
            type Context = Pick<KafkaContext, "getMessage" | "getPartition" | "getTopic">;

            interface Contract {
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

                type Result = Promise<unknown>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace RetryRegistry {
            type Entry = {
                consumerKey: string;
                handler: Handler;
            };

            interface Handler {
                process(props: HandlerProcess.Props): HandlerProcess.Result;
            }

            namespace HandlerProcess {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            interface Contract {
                register: Register.Signature;
                resolve: Resolve.Signature;
            }

            namespace Register {
                type Props = Entry & {
                    topic: string;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Resolve {
                type Props = {
                    topic: string;
                };

                type Result = Optional<Entry>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
