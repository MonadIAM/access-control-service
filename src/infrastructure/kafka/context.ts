import { KafkaJS } from "@confluentinc/kafka-javascript";
import { BaseRpcContext } from "@nestjs/microservices";

export class KafkaContext extends BaseRpcContext<[KafkaJS.EachMessagePayload]> {
    public getMessage(): KafkaJS.KafkaMessage {
        return this.args[0].message;
    }

    public getPartition(): number {
        return this.args[0].partition;
    }

    public getTopic(): string {
        return this.args[0].topic;
    }

    public getHeartbeat(): KafkaJS.EachMessagePayload["heartbeat"] {
        return this.args[0].heartbeat;
    }
}
