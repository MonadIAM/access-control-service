import { Collection } from "@mikro-orm/core";

import { EntityException } from "~common/exceptions";

import { RolePermissionAssignment } from "./role-permission-assignment.entity";
import { PermissionOverride } from "./permission-override.entity";
import { Realm } from "./realm.entity";

export class Permission {
    private get dictionaryPath(): string {
        return "entities.permission";
    }

    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public lastActions: DeltaAudit.LastActionsSnapshot<Entities.Permission.MutableFields>;
    public description?: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public realm?: Realm;

    public roleAssignments = new Collection<RolePermissionAssignment>(this);
    public accountOverrides = new Collection<PermissionOverride>(this);

    public constructor(props: Entities.Permission.ConstructorProps) {
        this.lastActions = { create: { by: { id: props.actor } } };
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.description = props.description;

        this.realm = props.realm;
    }

    public changeMetadata({
        reason,
        patch,
        actor,
    }: Entities.Permission.ChangeDataProps): DeltaAudit.Patch<Entities.Permission.MutableFields> {
        const historyPatch: DeltaAudit.Patch<Entities.Permission.MutableFields> = {};
        const now = new Date();
        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (historyPatch[key] as unknown) = { old: this[key], new: value };
                (this[key] as unknown) = value;
            }
        }

        if (Object.keys(historyPatch).length) {
            this.lastActions.update = { at: now, by: { id: actor }, reason, patch: historyPatch };
            this.updatedAt = now;
            return historyPatch;
        } else if (Object.keys(patch).length) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NO_CHANGES_DETECTED`);
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.EMPTY_UPDATE_PATCH`);
        }
    }

    public revoke({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_REVOKED`);
        } else {
            const now = new Date();
            this.isRevoked = true;
            this.lastActions.revoke = { at: now, by: { id: actor }, reason };
            this.updatedAt = now;
        }
    }

    public restore({ actor, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            const now = new Date();
            this.isRevoked = false;
            this.lastActions.restore = { at: now, by: { id: actor }, reason };
            this.updatedAt = now;
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
