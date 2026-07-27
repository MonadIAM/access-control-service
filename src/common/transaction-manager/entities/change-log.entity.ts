import { randomUUID } from "node:crypto";

export class ChangeLog {
    public id: string;
    public createdAt: Date;

    public auditEntry: string;

    public changeType: ORM.ChangeSetType;
    public entityType: string;
    public entity: string;

    public delta: DeltaChanges;

    public constructor(props: SystemEntities.ChangeLog.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.auditEntry = props.auditEntry;

        this.changeType = props.changeType;
        this.entityType = props.entityType;
        this.entity = props.entity;

        this.delta = props.delta;
    }
}
