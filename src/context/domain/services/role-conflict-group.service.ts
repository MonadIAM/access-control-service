import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ROLE_CONFLICT_GROUP_REPOSITORY } from "~context/infrastructure/repositories";
import { RoleConflictGroup, RoleConflictMember } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupService implements Services.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "services.role-conflict-group";
    private readonly membersLimit: number;

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
        private readonly configService: ConfigService,
    ) {
        this.membersLimit = this.configService.getOrThrow<number>("MAX_CONFLICT_MEMBERS_COUNT");
    }

    public async create({ transaction, input, realm }: Services.RoleConflictGroup.Create): Promise<void> {
        if (input.members.length > this.membersLimit) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED`);
        } else {
            const limitExceeded = await this.roleConflictGroupRepository.wouldExceedGroupLimit({
                realm: realm.id,
                transaction,
            });

            if (limitExceeded) {
                throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
            } else {
                const group = new RoleConflictGroup({
                    description: input.description,
                    maxAllowed: input.maxAllowed,
                    code: input.code,
                    name: input.name,
                    realm,
                });

                for (const role of input.members) {
                    transaction.persist(new RoleConflictMember({ group, role }));
                }

                transaction.persist(group);
            }
        }
    }

    public update({ entity, patch }: Services.RoleConflictGroup.Update): void {
        entity.update({ patch });
    }

    public purge({ transaction, entities }: Services.RoleConflictGroup.Purge): void {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.RoleConflictGroup.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.RoleConflictGroup.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }
}
