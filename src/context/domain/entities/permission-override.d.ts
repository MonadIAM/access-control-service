import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Entities {
        type PermissionOverride = PermissionOverride.Contract;

        namespace PermissionOverride {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                account: string;
                effect: PermissionOverrideEffect;
                justification?: string;
                isRevoked: boolean;
                expiresAt?: Date;

                permission: Entities.Permission;
                realm: Entities.Realm;

                canCreate(): void;
                canPurge(): void;
                restore(): void;
                revoke(): void;
            }

            type ConstructorProps = {
                effect: PermissionOverrideEffect;
                permission: Entities.Permission;
                realm: Entities.Realm;
                isRevoked?: boolean;
                justification?: string;
                expiresAt?: Date;
                account: string;
            };
        }
    }
}
