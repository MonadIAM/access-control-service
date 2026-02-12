import { PermissionOverrideEffect } from "~context/enums";
import { EntityException } from "~common/exceptions";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

export class PermissionOverride {
    private readonly dictionaryPath = "entities.permission-override";

    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public accountId: string;
    public effect: PermissionOverrideEffect;
    public lastActions: DeltaAudit.LastActionsSnapshot;
    public isRevoked: boolean;

    public permission: Permission;
    public realm: Realm;

    public constructor(props: Entities.PermissionOverride.ConstructorProps) {
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
        }
    }
}
