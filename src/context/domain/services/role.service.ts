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
        private readonly roleRepository: Repositories.Role.InternalContract,
        private readonly configService: ConfigService,
    ) {
        this.purgeSubtreeSizeLimit = this.configService.getOrThrow<number>("MAX_ROLE_SUBTREE_SIZE_FOR_PURGE");
    }

    public async create({ transaction, input, realm }: Services.Role.Create.Props): Promise<Services.Role.Create.Result> {
        if (input.parent.protoType === RoleProtoType.ATOMIC) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.CREATE_PARENT_NO_INHERITANCE`);
        } else {
            const limitExceeded = await this.roleRepository.wouldExceedRoleLimit({
                realm: realm.id,
                transaction,
            });

            if (limitExceeded) {
                throw ServiceException.invariantViolation(`${this.dictionaryPath}.REALM_ROLE_LIMIT_EXCEEDED`);
            } else {
                const entity = new Role({
                    description: input.description,
                    actorType: input.actorType,
                    protoType: input.protoType,
                    code: input.code,
                    name: input.name,
                    realm,
                });

                transaction.persist(entity);
                await transaction.flush();

                await this.buildHierarchy({
                    transaction,
                    input: {
                        children: input.children,
                        parent: input.parent,
                        realm: realm.id,
                        entity,
                    },
                });

                return entity;
            }
        }
    }

    public update({ entity, patch }: Services.Role.Update): void {
        entity.update({ patch });
    }

    public async purge({ transaction, entity, realm }: Services.Role.Purge): Promise<void> {
        entity.canPurge();
        transaction.clear();

        await this.roleClosureRepository.decreaseTransitiveDepth({
            role: entity.id,
            transaction,
            realm,
        });

        transaction.remove(entity);
    }

    public async purgeSubtree({
        transaction,
        entity,
        realm,
    }: Services.Role.PurgeSubtree.Props): Promise<Services.Role.PurgeSubtree.Result> {
        const descendants = await this.roleRepository.getDescendants({
            ancestor: entity.id,
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

    public revoke({ entities }: Services.Role.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.Role.Restore): void {
        for (const entity of entities) {
            entity.restore();
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
