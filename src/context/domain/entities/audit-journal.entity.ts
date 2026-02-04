import { AnyEntity } from "@mikro-orm/postgresql";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

export class AuditJournal {
    public id?: string;
    public createdAt?: Date;

    public action: AccessControlActionType;
    public entity: AccessControlEntityType;

    public realmId: string;
    public entityId: string;

    public by: string;
    public at: Date;

    public ip?: string;
    public userAgent?: string;

    public patch?: DeltaAudit.Patch<AnyEntity>;
    public reason?: string;

    public constructor(props: Entities.AuditJournal.ConstructorProps) {
        this.action = props.action;
        this.entity = props.entity;

        this.realmId = props.realmId;
        this.entityId = props.entityId;

        this.by = props.by;
        this.at = props.at;

        this.ip = props.ip;
        this.userAgent = props.userAgent;

        this.patch = props.patch;
        this.reason = props.reason;
    }
}
