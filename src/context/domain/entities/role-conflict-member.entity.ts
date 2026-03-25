import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";

import { RoleConflictGroup } from "./role-conflict-group.entity";
import { Role } from "./role.entity";

export class RoleConflictMember {
    private get dictionaryPath(): string {
        return "entities.role-conflict-member";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public group: RoleConflictGroup;
    public role: Role;

    public constructor(props: Entities.RoleConflictMember.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.group = props.group;
        this.role = props.role;
    }

    public canPurge(): void {
        if (this.isSystemManaged) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_PURGE_SYSTEM`);
        }
    }
}
