import { randomUUID } from "node:crypto";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

export class AuditJournal {
    public id: string;
    public createdAt: Date;

    public actionType: AccessControlActionType;
    public entityType: AccessControlEntityType;

    public realm?: string;
    public actor: string;

    public ip?: string;
    public userAgent?: string;

    public input?: UnknownObject;

    public constructor(props: Entities.AuditJournal.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.actionType = props.actionType;
        this.entityType = props.entityType;

        this.realm = props.realm;
        this.actor = props.actor;
        this.input = props.input;

        this.userAgent = props.userAgent;
        this.ip = props.ip;
    }
}
