import { Collection } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class RoleConflictGroup implements Entities.RoleConflictGroup.Contract {
    private static readonly dictionaryPath = "entities.role-conflict-group";

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public maxAllowed: number;
    public description?: string;
    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public realm: Entities.Realm;

    public members = new Collection<Entities.RoleConflictMember>(this);

    public constructor(props: Entities.RoleConflictGroup.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.code = props.code;
        this.name = props.name;
        this.maxAllowed = props.maxAllowed;
        this.description = props.description;

        this.realm = props.realm;
    }

    public update({ patch }: Entities.RoleConflictGroup.ChangeDataProps): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${RoleConflictGroup.dictionaryPath}.CANNOT_UPDATE_REVOKED` });
        }

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
            throw Exception.invariantViolation({ messageKey: `${RoleConflictGroup.dictionaryPath}.NO_CHANGES_DETECTED` });
        } else {
            throw Exception.invariantViolation({ messageKey: `${RoleConflictGroup.dictionaryPath}.EMPTY_UPDATE_PATCH` });
        }
    }

    public canModifyMembers(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({
                messageKey: `${RoleConflictGroup.dictionaryPath}.CANNOT_MODIFY_MEMBERS_REVOKED`,
            });
        }
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${RoleConflictGroup.dictionaryPath}.ALREADY_REVOKED` });
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
            throw Exception.invariantViolation({ messageKey: `${RoleConflictGroup.dictionaryPath}.ALREADY_ACTIVE` });
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${RoleConflictGroup.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
        } else if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${RoleConflictGroup.dictionaryPath}.CANNOT_PURGE_SYSTEM` });
        }
    }
}
