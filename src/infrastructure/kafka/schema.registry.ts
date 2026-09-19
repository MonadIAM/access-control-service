import { SchemaRegistry as ConfluentSchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KafkaTopic } from "@monadiam/shared";

import { Exception } from "~common/exceptions";

@Injectable()
export class KafkaSchemaRegistry implements Kafka.SchemaRegistry.Contract, OnApplicationBootstrap {
    private readonly dictionaryPath = "services.schema-registry";
    private static readonly MAGIC_BYTE = 0;

    private readonly schemas = new Map<string, Kafka.SchemaRegistry.Schema>();
    private readonly logger = new Logger(KafkaSchemaRegistry.name);
    private readonly registry: Nullable<ConfluentSchemaRegistry>;
    private readonly config: Kafka.SchemaRegistry.Config;
    private readonly ids = new Map<string, number>();

    public constructor(private readonly configService: ConfigService) {
        this.config = {
            registryUrl: this.configService.getOrThrow<string>("SCHEMA_REGISTRY_URL"),
            enabled: this.configService.get<boolean>("SCHEMA_REGISTRY_ENABLED") ?? false,
        };

        this.registry = this.config.enabled ? new ConfluentSchemaRegistry({ host: this.config.registryUrl }) : null;

        if (!this.registry) {
            this.logger.warn("Schema Registry disabled: messages are produced and consumed as plain JSON");
        }
    }

    public async onApplicationBootstrap(): Promise<void> {
        const { registry } = this;

        if (registry) {
            await Promise.all(
                Object.values(KafkaTopic).map(async (topic) => {
                    try {
                        const id = await registry.getLatestSchemaId(`${topic}-value`);
                        this.schemas.set(`${topic}-value`, await registry.getSchema(id));
                        this.ids.set(`${topic}-value`, id);
                    } catch {
                        this.logger.debug(`No registered subject ${topic}-value: messages for this topic stay unvalidated`);
                    }
                }),
            );
            this.logger.log(`Schema Registry warmed up: ${this.schemas.size} subjects`);
        }
    }

    public async encode({ topic, value }: Kafka.SchemaRegistry.Encode.Props): Kafka.SchemaRegistry.Encode.Result {
        const subject = `${topic}-value`;
        const id = this.ids.get(subject);

        if (this.registry && id !== undefined) {
            try {
                return await this.registry.encode(id, value);
            } catch (error) {
                throw Exception.externalServiceFailed({
                    messageKey: `${this.dictionaryPath}.ENCODE_FAILED`,
                    params: {
                        reason: error instanceof Error ? error.message : "encode failed",
                        subject,
                    },
                });
            }
        }

        return value;
    }

    public async decode<T>(props: Kafka.SchemaRegistry.Decode.Props): Kafka.SchemaRegistry.Decode.Result<T> {
        const { topic, value } = props;
        const { registry } = this;

        if (registry && KafkaSchemaRegistry.isFramed(value)) {
            try {
                return await registry.decode(value);
            } catch (error) {
                throw Exception.externalServiceFailed({
                    messageKey: `${this.dictionaryPath}.DECODE_FAILED`,
                    params: {
                        reason: error instanceof Error ? error.message : "decode failed",
                        subject: `${topic}-value`,
                    },
                });
            }
        } else {
            return value as T;
        }
    }

    public validate({ topic, value }: Kafka.SchemaRegistry.Validate.Props): Kafka.SchemaRegistry.Validate.Result {
        const subject = `${topic}-value`;
        const schema = this.schemas.get(subject);

        if (schema) {
            const paths: string[] = [];

            if (!schema.isValid(value, { errorHook: (path) => paths.push(path.join(".")) })) {
                throw Exception.unprocessable({
                    messageKey: `${this.dictionaryPath}.MESSAGE_INVALID`,
                    params: { fields: paths.join(", "), subject },
                });
            }
        }
    }

    private static isFramed(value: unknown): value is Buffer {
        return Buffer.isBuffer(value) && value.length > 0 && value.readUInt8(0) === KafkaSchemaRegistry.MAGIC_BYTE;
    }
}
