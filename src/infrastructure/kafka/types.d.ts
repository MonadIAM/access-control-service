import { SchemaRegistry as ConfluentSchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { KafkaRequest } from "@nestjs/microservices/serializers";

declare global {
    namespace Kafka {
        type Message = Pick<Request, "value"> & Partial<Omit<Request, "value">>;

        type Request = KafkaRequest;

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
            interface Handler {
                process(message: unknown): Promise<void>;
            }

            interface Contract {
                register: Register.Signature;
                resolve: Resolve.Signature;
            }

            namespace Register {
                type Props = {
                    handler: Handler;
                    topic: string;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Resolve {
                type Props = {
                    topic: string;
                };

                type Result = Optional<Handler>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
