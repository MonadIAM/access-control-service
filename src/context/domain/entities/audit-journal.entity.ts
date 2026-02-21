import { AnyEntity } from "@mikro-orm/postgresql";
import { randomUUID } from "node:crypto";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

export class AuditJournal {
    public id: string;
    public createdAt: Date;

    public actionType: AccessControlActionType;
    public entityType: AccessControlEntityType;

    public realm?: string;
    public entity: string;

    public by: string;
    public at: Date;

    public ip?: string;
    public userAgent?: string;

    public patch?: DeltaAudit.Patch<AnyEntity>;
    public reason?: string;

    public constructor(props: Entities.AuditJournal.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.actionType = props.actionType;
        this.entityType = props.entityType;

        this.realm = props.realm;
        this.entity = props.entity;

        this.by = props.by;
        this.at = props.at;

        this.ip = props.ip;
        this.userAgent = props.userAgent;

        this.patch = props.patch;
        this.reason = props.reason;
    }
}
