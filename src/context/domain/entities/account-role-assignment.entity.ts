import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

export class AccountRoleAssignment {
    private get dictionaryPath(): string {
        return "entities.account-role-assignment";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public account: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public realm: Realm;
    public role: Role;

    public constructor(props: Entities.AccountRoleAssignment.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.account = props.account;

        this.realm = props.realm;
        this.role = props.role;
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_REVOKED`);
        } else {
            const now = new Date();
            this.isRevoked = true;
            this.updatedAt = now;
        }
    }

    public restore(): void {
        if (this.isRevoked) {
            const now = new Date();
            this.isRevoked = false;
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

    public canAssign(): void {
        if (this.role.isRevoked) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_ASSIGN_REVOKED_ROLE`);
        } else if (this.role.isSystemManaged) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_ASSIGN_SYSTEM_ROLE`);
        }
    }
}
