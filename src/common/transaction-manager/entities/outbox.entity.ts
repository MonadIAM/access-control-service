import { randomUUID } from "node:crypto";

import { OutboxTopic, AggregateType, EventType } from "~context/enums";

export class Outbox {
    declare public sequenceNumber: number;

    public id: string;
    public createdAt: Date;

    public eventType: EventType;
    public aggregateType: AggregateType;
    public destinationTopic: OutboxTopic;

    public payload: UnknownObject;
    public metadata?: UnknownObject;

    public ttlExpiresAt?: Date;

    public constructor(props: Entities.Outbox.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.eventType = props.eventType;
        this.aggregateType = props.aggregateType;
        this.destinationTopic = props.destinationTopic;

        this.payload = props.payload;
        this.metadata = props.metadata;

        this.ttlExpiresAt = props.ttlExpiresAt;
    }
}
