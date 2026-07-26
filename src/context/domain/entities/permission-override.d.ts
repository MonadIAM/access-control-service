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
                isRevoked: boolean;

                permission: Entities.Permission;
                realm: Entities.Realm;

                canPurge(): void;
                restore(): void;
                revoke(): void;
            }

            type ConstructorProps = {
                account: string;
                effect: PermissionOverrideEffect;
                isRevoked?: boolean;
                permission: Entities.Permission;
                realm: Entities.Realm;
            };
        }
    }
}
