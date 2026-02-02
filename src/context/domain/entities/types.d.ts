import { RoleDelegationPolicy as RoleDelegationPolicyEntity } from "./role-delegation-policy.entity";
import { RoleConflictMember as RoleConflictMemberEntity } from "./role-conflict-member.entity";
import { RoleConflictGroup as RoleConflictGroupEntity } from "./role-conflict-group.entity";
import { Permission as PermissionEntity } from "./permission.entity";
import { Role as RoleEntity } from "./role.entity";

declare global {
    namespace Entities {
        type BaseMethodProps = {
            now: Date;
            actor: string;
            reason: string;
        };

        namespace Role {
            type MutableFields = Pick<RoleEntity, "name" | "description">;

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<Role.MutableFields>;
            };
        }

        namespace Permission {
            type MutableFields = Pick<PermissionEntity, "name" | "description">;

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<Permission.MutableFields>;
            };
        }

        namespace RoleConflictGroup {
            type MutableFields = Pick<RoleConflictGroupEntity, "name" | "description" | "maxAllowed">;

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<RoleConflictGroup.MutableFields>;
            };
        }

        namespace RoleConflictMember {
            type MutableFields = Pick<RoleConflictMemberEntity, "isInheritable">;

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<RoleConflictMember.MutableFields>;
            };
        }

        namespace RoleDelegationPolicy {
            type MutableFields = Pick<RoleDelegationPolicyEntity, "isAbsolute" | "depthLimit" | "description">;

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<RoleDelegationPolicy.MutableFields>;
            };
        }
    }
}
