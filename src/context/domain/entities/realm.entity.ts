export class Realm {
    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public lastActions: DeltaAudit.LastActionsSnapshot;
    public description?: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public constructor(props: Entities.Realm.ConstructorProps) {
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.lastActions = props.lastActions;
        this.description = props.description;
    }

    public revoke({ actor, now, reason }: Entities.BaseMethodProps): void {
        if (!this.isRevoked) {
            this.isRevoked = true;
            this.lastActions.revoke = { at: now, by: { id: actor }, reason };
            this.version += 1;
        }
    }

    public restore({ actor, now, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            this.isRevoked = false;
            this.lastActions.restore = { at: now, by: { id: actor }, reason };
            this.version += 1;
        }
    }
}
