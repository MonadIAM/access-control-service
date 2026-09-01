import { randomUUID } from "node:crypto";

import { KafkaTopic } from "~context/enums";

export class Outbox {
    declare public sequenceNumber: number;

    public id: string;
    public createdAt: Date;

    public destinationTopic: KafkaTopic;
    public actionType: string;

    public metadata?: UnknownObject;
    public payload: UnknownObject;

    public constructor(props: SystemEntities.Outbox.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.destinationTopic = props.destinationTopic;
        this.actionType = props.actionType;

        this.metadata = props.metadata;
        this.payload = props.payload;
    }

    public envelope(): SystemEntities.Outbox.Envelope.Result {
        return { actionType: this.actionType, payload: this.payload };
    }
}
