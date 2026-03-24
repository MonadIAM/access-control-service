import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ROLE_CLOSURE_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { ServiceException } from "~common/exceptions";
import { Role } from "~context/domain/entities";
import { RoleProtoType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RoleService implements Services.Role.Contract {
    private readonly dictionaryPath = "services.role";
    private readonly purgeSubtreeSizeLimit: number;

    public constructor(
        @Inject(ROLE_CLOSURE_REPOSITORY)
        private readonly roleClosureRepository: Repositories.RoleClosure.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        private readonly configService: ConfigService,
    ) {
        this.purgeSubtreeSizeLimit = this.configService.getOrThrow<number>("MAX_ROLE_SUBTREE_SIZE_FOR_PURGE");
    }

    public async create({ transaction, input, realm, actor }: Services.Role.Create): Promise<void> {
        if (input.parent.protoType === RoleProtoType.ATOMIC) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.CREATE_PARENT_NO_INHERITANCE`);
        } else {
            const isRoleLimitExceeded = await this.roleRepository.wouldExceedRoleLimit({
                realm: realm.id,
                transaction,
                count: 1,
            });

            if (isRoleLimitExceeded) {
                throw ServiceException.invariantViolation(`${this.dictionaryPath}.REALM_ROLE_LIMIT_EXCEEDED`);
            } else {
                const entity = new Role({
                    description: input.description,
                    actorType: input.actorType,
                    protoType: input.protoType,
                    code: input.code,
                    name: input.name,
                    realm,
                    actor,
                });

                transaction.persist(entity);

                await this.buildHierarchy({
                    transaction,
                    input: {
                        children: input.children,
                        parent: input.parent,
                        realm: realm.id,
                        entity,
                    },
                });
            }
        }
    }

    public update({ input, actor }: Services.Role.Update): void {
        input.entity.changeMetadata({ ...input, actor });
    }

    public async purge({ transaction, input, realm }: Services.Role.Purge): Promise<void> {
        input.entity.canPurge();
        transaction.clear();

        await this.roleClosureRepository.decreaseTransitiveDepth({
            role: input.entity.id,
            transaction,
            realm,
        });

        transaction.remove(input.entity);
    }

    public async purgeSubtree({ transaction, input, realm }: Services.Role.PurgeSubtree): Promise<number> {
        const descendants = await this.roleRepository.getDescendants({
            ancestor: input.entity.id,
            where: { realm },
            transaction,
        });

        transaction.clear();

        if (descendants.length > this.purgeSubtreeSizeLimit) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.SUBTREE_SIZE_LIMIT_EXCEEDED`, {
                limit: this.purgeSubtreeSizeLimit,
            });
        } else {
            for (const descendant of descendants) {
                descendant.canPurge();
                transaction.remove(descendant);
            }
            return descendants.length;
        }
    }

    public revoke({ input, actor }: Services.Role.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });
        }
    }

    public restore({ input, actor }: Services.Role.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });
        }
    }

    private async buildHierarchy({
        transaction,
        input: { children, parent, entity, realm },
    }: Services.Role.BuildHierarchy): Promise<void> {
        await this.roleClosureRepository.insertNewHierarchy({
            descendant: entity.id,
            ancestor: parent.id,
            realm: realm,
            transaction,
        });

        if (children?.length) {
            const descendants = await this.roleRepository.getDescendants({
                ancestor: parent.id,
                transaction,
                depth: 1,
            });

            const descendantsSet = new Set(descendants.map(({ id }) => id));

            for (const child of children) {
                if (!descendantsSet.has(child)) {
                    throw ServiceException.invariantViolation(`${this.dictionaryPath}.CREATE_CHILD_NOT_DIRECT_DESCENDANT`);
                }
            }

            await this.roleClosureRepository.moveSubtrees({
                newParent: entity.id,
                oldParent: parent.id,
                children: children,
                realm: realm,
                transaction,
            });
        }
    }
}
