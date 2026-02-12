import { EntityException } from "~common/exceptions";

export class Realm {
    private readonly dictionaryPath = "entities.realm";

    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public lastActions: DeltaAudit.LastActionsSnapshot<Entities.Realm.MutableFields>;
    public description?: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public constructor(props: Entities.Realm.ConstructorProps) {
        this.lastActions = { create: { by: { id: props.actor } } };
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.description = props.description;
    }

    public changeData({
        reason,
        patch,
        actor,
    }: Entities.Realm.ChangeDataProps): DeltaAudit.Patch<Entities.Realm.MutableFields> {
        const historyPatch: DeltaAudit.Patch<Entities.Realm.MutableFields> = {};

        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (historyPatch[key] as unknown) = { old: this[key], new: value };
                (this[key] as unknown) = value;
            }
        }

        if (Object.keys(historyPatch).length) {
            this.lastActions.update = { at: new Date(), by: { id: actor }, reason, patch: historyPatch };
            return historyPatch;
        } else if (Object.keys(patch).length) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.EMPTY_UPDATE_PATCH`);
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NO_CHANGES_DETECTED`);
        }
    }

    public revoke({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_REVOKED`);
        } else {
            this.isRevoked = true;
            this.lastActions.revoke = { at: new Date(), by: { id: actor }, reason };
        }
    }

    public restore({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            this.isRevoked = false;
            this.lastActions.restore = { at: new Date(), by: { id: actor }, reason };
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_ACTIVE`);
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_PURGE_ACTIVE`);
        } else if (this.isSystemManaged) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_PURGE_SYSTEM`);
        }
    }
}
