import { KafkaContext } from "@nestjs/microservices";

export abstract class KafkaUtils {
    private constructor() {}

    public static extractRetryCount(context: KafkaContext): number {
        const raw = context.getMessage().headers?.["x-retry-count"];
        return Number(Buffer.isBuffer(raw) ? raw.toString() : (raw ?? 0));
    }
}
