import { randomUUID } from "node:crypto";

import { PermissionOverrideEffect } from "~context/enums";
import { Exception } from "~common/exceptions";

export class PermissionOverride implements Entities.PermissionOverride.Contract {
    private get dictionaryPath(): string {
        return "entities.permission-override";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public account: string;
    public effect: PermissionOverrideEffect;
    public justification?: string;
    public isRevoked: boolean;
    public expiresAt?: Date;

    public permission: Entities.Permission;
    public realm: Entities.Realm;

    public constructor(props: Entities.PermissionOverride.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isRevoked = props.isRevoked ?? false;

        this.justification = props.justification;
        this.account = props.account;
        this.effect = props.effect;

        this.permission = props.permission;
        this.realm = props.realm;

        if (props.expiresAt) {
            const normalized = new Date(props.expiresAt);
            normalized.setHours(0, 0, 0, 0);
            this.expiresAt = normalized;
        }
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_REVOKED` });
        } else {
            const now = new Date();
            this.isRevoked = true;
            this.updatedAt = now;
        }
    }

    public restore(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_ACTIVE` });
        } else if ((this.expiresAt?.getTime() ?? Infinity) <= new Date().getTime()) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_RESTORE_EXPIRED` });
        } else {
            const now = new Date();
            this.isRevoked = false;
            this.updatedAt = now;
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
        }
    }

    public canCreate(): void {
        if ((this.expiresAt?.getTime() ?? Infinity) <= new Date().getTime()) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_CREATE_EXPIRED` });
        }
    }
}
