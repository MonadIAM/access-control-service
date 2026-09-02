import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class Realm implements Entities.Realm.Contract {
    private static readonly dictionaryPath = "entities.realm";

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public owner: string;
    public description?: string;

    public isSystemManaged: boolean;
    public isRevoked: boolean;

    public constructor(props: Entities.Realm.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.description = props.description;
        this.owner = props.owner;
        this.code = props.code;
        this.name = props.name;
    }

    public update({ patch }: Entities.Realm.ChangeDataProps): void {
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
            throw Exception.invariantViolation({ messageKey: `${Realm.dictionaryPath}.NO_CHANGES_DETECTED` });
        } else {
            throw Exception.invariantViolation({ messageKey: `${Realm.dictionaryPath}.EMPTY_UPDATE_PATCH` });
        }
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${Realm.dictionaryPath}.ALREADY_REVOKED` });
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
            throw Exception.invariantViolation({ messageKey: `${Realm.dictionaryPath}.ALREADY_ACTIVE` });
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${Realm.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
        } else if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${Realm.dictionaryPath}.CANNOT_PURGE_SYSTEM` });
        }
    }
}
