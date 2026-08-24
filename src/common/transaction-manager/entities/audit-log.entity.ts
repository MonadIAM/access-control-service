import { randomUUID } from "node:crypto";

export class AuditLog {
    public id: string;
    public createdAt: Date;

    public actionType: string;
    public entityType: string;

    public realm?: string;
    public actor?: string;

    public ip?: string;
    public userAgent?: string;

    public input?: UnknownObject;
    public keyVersion?: number;
    public signature?: string;

    public constructor(props: SystemEntities.AuditLog.ConstructorProps) {
        this.id = randomUUID();
        this.createdAt = new Date();

        this.actionType = props.actionType;
        this.entityType = props.entityType;

        this.realm = props.realm;
        this.actor = props.actor;

        this.userAgent = props.context.userAgent;
        this.ip = props.context.ip;

        this.input = props.input;
    }

    public sign(props: SystemEntities.AuditLog.Sign.Props): SystemEntities.AuditLog.Sign.Result {
        this.keyVersion = props.keyVersion;
        this.signature = props.signature;
    }
}
