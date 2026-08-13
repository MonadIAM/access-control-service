import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class AccountRoleAssignment implements Entities.AccountRoleAssignment.Contract {
    private get dictionaryPath(): string {
        return "entities.account-role-assignment";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public account: string;
    public justification?: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;
    public expiresAt?: Date;

    public realm: Entities.Realm;
    public role: Entities.Role;

    public constructor(props: Entities.AccountRoleAssignment.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.justification = props.justification;
        this.account = props.account;

        this.realm = props.realm;
        this.role = props.role;

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
        } else if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_SYSTEM` });
        }
    }

    public canAssign(): void {
        if (this.role.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ASSIGN_REVOKED_ROLE` });
        } else if (this.role.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ASSIGN_SYSTEM_ROLE` });
        } else if ((this.expiresAt?.getTime() ?? Infinity) <= new Date().getTime()) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ASSIGN_EXPIRED` });
        }
    }
}
