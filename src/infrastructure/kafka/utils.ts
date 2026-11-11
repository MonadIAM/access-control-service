import { KafkaJS } from "@confluentinc/kafka-javascript";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "fs";
import ms, { StringValue } from "ms";

export abstract class KafkaUtils {
    private constructor() {}

    public static buildClientConfig(config: ConfigService, options: { withClientId?: boolean } = {}): Kafka.Config {
        const clientId = config.getOrThrow<string>("SERVICE_NAME");
        const broker = config.getOrThrow<string>("KAFKA_BROKER");
        const ssl = config.get<boolean>("KAFKA_SSL_ENABLED", false);
        return {
            kafkaJS: {
                ...(options.withClientId ? { clientId } : {}),
                ...this.buildSaslConfig(config),
                brokers: [broker],
                ssl,
                retry: {
                    initialRetryTime: ms(config.get<StringValue>("KAFKA_RETRY_INITIAL_TIME", "300ms")),
                    retries: config.get<number>("KAFKA_RETRY_ATTEMPTS", 5),
                },
            },
            ...this.buildSslConfig(config),
        };
    }

    private static buildSslConfig(config: ConfigService): KafkaJS.CommonConstructorConfig {
        if (config.get<boolean>("KAFKA_SSL_ENABLED")) {
            const verify = config.getOrThrow<boolean>("KAFKA_SSL_REJECT_UNAUTHORIZED");
            return {
                "ssl.ca.pem": readFileSync(config.getOrThrow<string>("KAFKA_SSL_CA_FILE"), "utf8"),
                "enable.ssl.certificate.verification": verify,
                "ssl.endpoint.identification.algorithm": verify ? "https" : "none",
            };
        } else {
            return {};
        }
    }

    private static buildSaslConfig(config: ConfigService): Pick<KafkaJS.KafkaConfig, "sasl"> {
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
