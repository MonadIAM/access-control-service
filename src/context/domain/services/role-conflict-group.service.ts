import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleConflictGroup, RoleConflictMember } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupService implements Services.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "services.role-conflict-group";
    private readonly membersLimit: number;

    public constructor(private readonly configService: ConfigService) {
        this.membersLimit = this.configService.getOrThrow<number>("MAX_CONFLICT_MEMBERS_COUNT");
    }

    public create({ transaction, input, realm, actor }: Services.RoleConflictGroup.Create): void {
        if (input.members.length > this.membersLimit) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED`);
        } else {
            const group = new RoleConflictGroup({
                description: input.description,
                maxAllowed: input.maxAllowed,
                code: input.code,
                name: input.name,
                realm,
                actor,
            });

            for (const role of input.members) {
                transaction.persist(
                    new RoleConflictMember({
                        group,
                        actor,
                        role,
                    }),
                );
            }

            transaction.persist(group);
        }
    }

    public update({ input, actor }: Services.RoleConflictGroup.Update): void {
        input.entity.changeMetadata({
            reason: input.reason,
            patch: input.patch,
            actor,
        });
    }

    public purge({ transaction, input }: Services.RoleConflictGroup.Purge): void {
        transaction.clear();
        for (const entity of input.entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ input, actor }: Services.RoleConflictGroup.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });
        }
    }

    public restore({ input, actor }: Services.RoleConflictGroup.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });
        }
    }
}
