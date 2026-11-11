import {
    JsonDeserializer,
    JsonSerializer,
    SchemaRegistryClient,
    SerdeType,
    Client,
    SubjectNameStrategyType,
} from "@confluentinc/schemaregistry";
import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KafkaTopic } from "@monadiam/shared";
import formats from "ajv-formats";

import { Exception } from "~common/exceptions";

@Injectable()
export class KafkaSchemaRegistry implements Kafka.SchemaRegistry.Contract, OnApplicationBootstrap, OnApplicationShutdown {
    private readonly dictionaryPath = "services.schema-registry";
    private static readonly MAGIC_BYTE = 0;

    private readonly validators = new Map<string, Kafka.SchemaRegistry.Validator>();
    private readonly logger = new Logger(KafkaSchemaRegistry.name);
    private readonly registry: Nullable<Client>;
    private readonly serializer: Nullable<JsonSerializer>;
    private readonly deserializer: Nullable<JsonDeserializer>;

    public constructor(configService: ConfigService) {
        const enabled = configService.get<boolean>("SCHEMA_REGISTRY_ENABLED") ?? false;
        const registryUrl = configService.getOrThrow<string>("SCHEMA_REGISTRY_URL");
        this.registry = enabled ? SchemaRegistryClient.newClient({ baseURLs: [registryUrl] }) : null;
        const options = {
            validate: true,
            strict: false,
            formats: { uuid: formats.get("uuid") },
            subjectNameStrategyType: SubjectNameStrategyType.TOPIC,
        };
        this.serializer = this.registry
            ? new JsonSerializer(this.registry, SerdeType.VALUE, {
                  ...options,
                  autoRegisterSchemas: false,
                  useLatestVersion: true,
              })
            : null;
        this.deserializer = this.registry ? new JsonDeserializer(this.registry, SerdeType.VALUE, options) : null;

        if (!this.registry) {
            this.logger.warn("Schema Registry disabled: messages are produced and consumed as plain JSON");
        }
    }

    public async onApplicationBootstrap(): Promise<void> {
        if (this.registry) {
            const pending: Promise<void>[] = [];
            for (const topic of Object.values(KafkaTopic)) {
                pending.push(this.warm(topic));
            }
            await Promise.all(pending);
            this.logger.log(`Schema Registry warmed up: ${this.validators.size} subjects`);
        }
    }

    public async onApplicationShutdown(): Promise<void> {
        await this.registry?.close();
    }

    public async encode({ topic, value }: Kafka.SchemaRegistry.Encode.Props): Kafka.SchemaRegistry.Encode.Result {
        const subject = `${topic}-value`;
        if (this.serializer && this.validators.has(subject)) {
            try {
                return await this.serializer.serialize(topic, value);
            } catch (error) {
                throw Exception.externalServiceFailed({
                    messageKey: `${this.dictionaryPath}.ENCODE_FAILED`,
                    params: { reason: String(error), subject },
                });
            }
        }
        return value;
    }

    public async decode<T>({ topic, value }: Kafka.SchemaRegistry.Decode.Props): Kafka.SchemaRegistry.Decode.Result<T> {
        if (this.deserializer && KafkaSchemaRegistry.isFramed(value)) {
            try {
                return await this.deserializer.deserialize(topic, value);
            } catch (error) {
                throw Exception.externalServiceFailed({
                    messageKey: `${this.dictionaryPath}.DECODE_FAILED`,
                    params: { reason: String(error), subject: `${topic}-value` },
                });
            }
        } else {
            return value as T;
        }
    }

    public validate({ topic, value }: Kafka.SchemaRegistry.Validate.Props): Kafka.SchemaRegistry.Validate.Result {
        const subject = `${topic}-value`;
        const validate = this.validators.get(subject);
        if (validate && !validate(value)) {
            const paths: string[] = [];
            for (const error of validate.errors ?? []) {
                paths.push(error.instancePath);
            }
            throw Exception.unprocessable({
                messageKey: `${this.dictionaryPath}.MESSAGE_INVALID`,
                params: { fields: paths.join(", "), subject },
            });
        }
    }

    private async warm(topic: string): Promise<void> {
        const subject = `${topic}-value`;
        if (this.registry && this.serializer) {
            try {
                const metadata = await this.registry.getLatestSchemaMetadata(subject);
                const validate = await this.serializer.toValidateFunction(metadata);
                if (validate) {
                    this.validators.set(subject, validate);
                }
            } catch {
                this.logger.debug(`No registered subject ${subject}: messages for this topic stay unvalidated`);
            }
        }
    }

    private static isFramed(value: unknown): value is Buffer {
        return Buffer.isBuffer(value) && value.length > 0 && value.readUInt8(0) === KafkaSchemaRegistry.MAGIC_BYTE;
    }
}
