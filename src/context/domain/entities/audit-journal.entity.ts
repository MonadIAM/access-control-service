import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

export class AuditJournal {
    public id?: string;
    public createdAt?: Date;

    public constructor(
        public action: AccessControlActionType,
        public entity: AccessControlEntityType,

        public realmId: string,
        public entityId: string,

        public by: string,
        public at: Date,

        public ip?: string,
        public userAgent?: string,

        public patch?: DeltaAudit.Patch<unknown>,
        public reason?: string,
    ) {}
}
