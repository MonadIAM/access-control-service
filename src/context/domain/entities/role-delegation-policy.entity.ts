import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class RoleDelegationPolicy implements Entities.RoleDelegationPolicy.Contract {
    private static readonly dictionaryPath = "entities.role-delegation-policy";

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public justification?: string;
    public depthLimit?: number;
    public isSystemManaged: boolean;
    public isRevoked: boolean;
    public expiresAt?: Date;

    public delegator: Entities.Role;
    public target: Entities.Role;
    public realm: Entities.Realm;

    public constructor(props: Entities.RoleDelegationPolicy.ConstructorProps) {
        const now = new Date();
        this.createdAt = now;
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;
        this.depthLimit = props.depthLimit ?? 0;

        this.justification = props.justification;

        this.delegator = props.delegator;
        this.target = props.target;
        this.realm = props.realm;

        if (props.expiresAt) {
            const normalized = new Date(props.expiresAt);
            normalized.setHours(0, 0, 0, 0);
            this.expiresAt = normalized;
        }
    }

    public update({ patch }: Entities.RoleDelegationPolicy.ChangeDataProps): void {
        const now = new Date();
        let affected = 0;
        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (this[key] as unknown) = value;
                ++affected;
            }
        }

        if (affected) {
            this.updatedAt = now;
        } else if (Object.keys(patch).length) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.NO_CHANGES_DETECTED`,
            });
        } else {
            throw Exception.invariantViolation({ messageKey: `${RoleDelegationPolicy.dictionaryPath}.EMPTY_UPDATE_PATCH` });
        }
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${RoleDelegationPolicy.dictionaryPath}.ALREADY_REVOKED` });
        } else {
            const now = new Date();
            this.isRevoked = true;
            this.updatedAt = now;
        }
    }

    public restore(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${RoleDelegationPolicy.dictionaryPath}.ALREADY_ACTIVE` });
        } else if ((this.expiresAt?.getTime() ?? Infinity) <= new Date().getTime()) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.CANNOT_RESTORE_EXPIRED`,
            });
        } else {
            const now = new Date();
            this.isRevoked = false;
            this.updatedAt = now;
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.CANNOT_PURGE_ACTIVE`,
            });
        } else if (this.isSystemManaged) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.CANNOT_PURGE_SYSTEM`,
            });
        }
    }

    public canCreate(): void {
        if (this.target.isRevoked) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.CANNOT_DELEGATE_REVOKED_TARGET`,
            });
        } else if (this.target.isSystemManaged) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.CANNOT_DELEGATE_SYSTEM_TARGET`,
            });
        } else if (this.delegator.isRevoked) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.REVOKED_ROLE_CANNOT_DELEGATE_ROLES`,
            });
        } else if ((this.expiresAt?.getTime() ?? Infinity) <= new Date().getTime()) {
            throw Exception.invariantViolation({
                messageKey: `${RoleDelegationPolicy.dictionaryPath}.CANNOT_DELEGATE_EXPIRED`,
            });
        }
    }
}
