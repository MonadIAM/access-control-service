import { AssignmentScope } from "~context/enums";

declare global {
    namespace Entities {
        type RolePermissionAssignment = RolePermissionAssignment.Contract;

        namespace RolePermissionAssignment {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                scope: AssignmentScope;
                isSystemManaged: boolean;
                isRevoked: boolean;

                permission: Entities.Permission;
                realm: Entities.Realm;
                role: Entities.Role;

                canAssign(): void;
                canPurge(): void;
                restore(): void;
                revoke(): void;
            }

            type ConstructorProps = {
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                permission: Entities.Permission;
                realm: Entities.Realm;
                role: Entities.Role;
            };
        }
    }
}
