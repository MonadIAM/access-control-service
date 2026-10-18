import { ConfigService } from "@nestjs/config";
import { KafkaConfig } from "kafkajs";
import { readFileSync } from "fs";

export abstract class KafkaUtils {
    private constructor() {}

    public static buildClientConfig(config: ConfigService, options: { withClientId?: boolean } = {}): KafkaConfig {
        const clientId = config.getOrThrow<string>("SERVICE_NAME");
        const broker = config.getOrThrow<string>("KAFKA_BROKER");

        return {
            ...(options.withClientId ? { clientId } : {}),
            brokers: [broker],
            ...this.buildSslConfig(config),
            ...this.buildSaslConfig(config),
        };
    }

    private static buildSslConfig(config: ConfigService): Pick<KafkaConfig, "ssl"> {
        if (config.get<boolean>("KAFKA_SSL_ENABLED")) {
            return {
                ssl: {
                    rejectUnauthorized: config.getOrThrow<boolean>("KAFKA_SSL_REJECT_UNAUTHORIZED"),
                    ca: [readFileSync(config.getOrThrow<string>("KAFKA_SSL_CA_FILE"), "utf8")],
                },
            };
        } else {
            return {};
        }
    }

    private static buildSaslConfig(config: ConfigService): Pick<KafkaConfig, "sasl"> {
        if (config.get<boolean>("KAFKA_SASL_ENABLED")) {
            const password = readFileSync(config.getOrThrow<string>("KAFKA_SASL_PASSWORD_FILE"), "utf8").trim();

            return {
                sasl: {
                    mechanism: "scram-sha-512",
                    username: config.getOrThrow<string>("KAFKA_SASL_USERNAME"),
                    password,
                },
            };
        } else {
            return {};
        }
    }
}
