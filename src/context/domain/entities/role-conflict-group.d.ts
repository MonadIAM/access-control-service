import { Collection } from "@mikro-orm/core";

declare global {
    namespace Entities {
        type RoleConflictGroup = RoleConflictGroup.Contract;

        namespace RoleConflictGroup {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                code: string;
                name: string;
                maxAllowed: number;
                description?: string;
                isSystemManaged: boolean;
                isRevoked: boolean;

                realm: Entities.Realm;

                members: Collection<Entities.RoleConflictMember>;

                update(props: ChangeDataProps): void;
                canPurge(): void;
                restore(): void;
                revoke(): void;
            }

            type MutableFields = Pick<Contract, "name" | "description" | "maxAllowed">;

            type ConstructorProps = {
                code: string;
                name: string;
                maxAllowed: number;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: Entities.Realm;
            };

            type ChangeDataProps = {
                patch: Partial<MutableFields>;
            };
        }
    }
}
