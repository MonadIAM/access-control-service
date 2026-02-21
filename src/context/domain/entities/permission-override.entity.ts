import { randomUUID } from "node:crypto";

import { PermissionOverrideEffect } from "~context/enums";
import { EntityException } from "~common/exceptions";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

export class PermissionOverride {
    private get dictionaryPath(): string {
        return "entities.permission-override";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public accountId: string;
    public effect: PermissionOverrideEffect;
    public lastActions: DeltaAudit.LastActionsSnapshot;
    public isRevoked: boolean;

    public permission: Permission;
    public realm: Realm;

    public constructor(props: Entities.PermissionOverride.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.lastActions = { create: { by: { id: props.actor } } };
        this.isRevoked = props.isRevoked ?? false;

        this.accountId = props.account;
        this.effect = props.effect;

        this.permission = props.permission;
        this.realm = props.realm;
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
        }
    }
}
