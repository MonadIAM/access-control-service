import { Collection, Ref } from "@mikro-orm/core";

import { RoleActorType, RoleProtoType } from "~context/enums";

import { RoleDelegationPolicy } from "./role-delegation-policy.entity";
import { RolePermissionMatrix } from "./role-permission-matrix.entity";
import { RoleConflictMember } from "./role-conflict-member.entity";
import { AccountRoleMatrix } from "./account-role-matrix.entity";
import { Realm } from "./realm.entity";

export class Role {
    public id?: string;
    public updatedAt?: Date;
    public createdAt?: Date;
    public version: number = 1;

    public delegationPoliciesAsDelegator = new Collection<RoleDelegationPolicy>(this);
    public delegationPoliciesAsTarget = new Collection<RoleDelegationPolicy>(this);
    public conflictMemberships = new Collection<RoleConflictMember>(this);
    public permissionMatrix = new Collection<RolePermissionMatrix>(this);
    public accountMatrix = new Collection<AccountRoleMatrix>(this);

    public constructor(
        public realm: Ref<Realm>,

        public code: string,
        public name: string,

        public actorType: RoleActorType,
        public protoType: RoleProtoType,

        public lastActions: DeltaAudit.LastActionsSnapshot<Entities.Role.MutableFields>,

        public description?: string,

        public isSystemManaged: boolean = false,
        public nonDelegable: boolean = false,
        public isRevoked: boolean = false,
    ) {}

    public changeMetadata({ reason, patch, actor, now }: Entities.Role.ChangeDataProps): void {
        const historyPatch: DeltaAudit.Patch<Entities.Role.MutableFields> = {};

        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (historyPatch[key] as unknown) = { old: this[key], new: value };
                (this[key] as unknown) = value;
            }
        }

        if (Object.keys(historyPatch).length) {
            this.lastActions.update = { at: now, by: { id: actor }, reason, patch: historyPatch };
            this.version += 1;
        }
    }

    public revoke({ actor, now, reason }: Entities.BaseMethodProps): void {
        if (!this.isRevoked) {
            this.isRevoked = true;
            this.lastActions.revoke = { at: now, by: { id: actor }, reason };
            this.version += 1;
        }
    }

    public restore({ actor, now, reason }: Entities.BaseMethodProps): void {
        if (this.isRevoked) {
            this.isRevoked = false;
            this.lastActions.restore = { at: now, by: { id: actor }, reason };
            this.version += 1;
        }
    }
}
