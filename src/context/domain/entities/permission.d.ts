import { Collection } from "@mikro-orm/core";

declare global {
    namespace Entities {
        type Permission = Permission.Contract;

        namespace Permission {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                code: string;
                name: string;
                description?: string;
                isSystemManaged: boolean;
                isRevoked: boolean;

                realm: Entities.Realm;

                roleAssignments: Collection<Entities.RolePermissionAssignment>;
                accountOverrides: Collection<Entities.PermissionOverride>;

                update(props: ChangeDataProps): void;
                canPurge(): void;
                restore(): void;
                revoke(): void;
            }

            type MutableFields = Pick<Contract, "name" | "description">;

            type ConstructorProps = {
                code: string;
                name: string;
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
