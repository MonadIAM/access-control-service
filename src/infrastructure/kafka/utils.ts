import { KafkaContext } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { KafkaConfig } from "kafkajs";
import { readFileSync } from "fs";

export abstract class KafkaUtils {
    private constructor() {}

    public static buildClientConfig(config: ConfigService, options: { withClientId?: boolean } = {}): KafkaConfig {
        const password = readFileSync(config.getOrThrow<string>("KAFKA_SASL_PASSWORD_FILE"), "utf8").trim();
        const clientId = config.getOrThrow<string>("SERVICE_NAME");
        const broker = config.getOrThrow<string>("KAFKA_BROKER");

        return {
            ...(options.withClientId ? { clientId } : {}),
            brokers: [broker],
            ssl: {
                rejectUnauthorized: config.getOrThrow("KAFKA_SSL_REJECT_UNAUTHORIZED") === "true",
                cert: readFileSync(config.getOrThrow<string>("KAFKA_SSL_CERT_FILE"), "utf8"),
                ca: [readFileSync(config.getOrThrow<string>("KAFKA_SSL_CA_FILE"), "utf8")],
                key: readFileSync(config.getOrThrow<string>("KAFKA_SSL_KEY_FILE"), "utf8"),
                servername: broker.split(":")[0],
            },
            sasl: {
                mechanism: "scram-sha-512",
                username: config.getOrThrow<string>("KAFKA_SASL_USERNAME"),
                password,
            },
        };
    }

    public static extractRetryCount(context: KafkaContext): number {
        const raw = context.getMessage().headers?.["x-retry-count"];
        return Number(Buffer.isBuffer(raw) ? raw.toString() : (raw ?? 0));
    }
}
