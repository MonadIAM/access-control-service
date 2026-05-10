import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ROLE_CLOSURE_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { RoleProtoType, MoveMode } from "~context/enums";
import { ServiceException } from "~common/exceptions";
import { Role } from "~context/domain/entities";

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
            return descendants;
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

    public async move({
        targetParent,
        transaction,
        target,
        realm,
        mode,
    }: Services.Role.Move.Props): Promise<Services.Role.Move.Result> {
        if (targetParent.protoType === RoleProtoType.ATOMIC) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.REPARENT_TARGET_NO_INHERITANCE`);
        }

        if (targetParent.id === target.id) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.REPARENT_TARGET_IS_SELF`);
        }

        const [[currentParent], wouldFormCycle] = await Promise.all([
            this.roleRepository.getAncestors({
                descendant: target.id,
                transaction,
                depth: 1,
            }),
            this.roleClosureRepository.existsTransitivePath({
                descendant: targetParent.id,
                ancestor: target.id,
                transaction,
                realm,
            }),
        ]);

        if (!currentParent) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.REPARENT_ROOT_NOT_ALLOWED`);
        }

        if (mode !== MoveMode.LINEAR && currentParent.id === targetParent.id) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.REPARENT_TARGET_ALREADY_PARENT`);
        }

        if (wouldFormCycle) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.REPARENT_TARGET_IN_SUBTREE`);
        }

        const steps: Services.Role.Move.Result = [];

        if (mode !== MoveMode.SUBTREE) {
            const directChildren = await this.roleRepository.getDescendants({
                ancestor: target.id,
                transaction,
                depth: 1,
            });

            if (directChildren.length) {
                const result = await this.roleClosureRepository.moveSubtrees({
                    children: directChildren.map(({ id }) => id),
                    newParent: currentParent.id,
                    oldParent: target.id,
                    transaction,
                    realm,
                });

                steps.push(result);
            }
        }

        if (mode === MoveMode.LINEAR) {
            const displacedChildren = await this.roleRepository.getDescendants({
                ancestor: targetParent.id,
                transaction,
                depth: 1,
            });

            if (displacedChildren.length) {
                const result = await this.roleClosureRepository.moveSubtrees({
                    children: displacedChildren.map(({ id }) => id).filter((id) => id !== target.id),
                    oldParent: targetParent.id,
                    newParent: target.id,
                    transaction,
                    realm,
                });

                steps.push(result);
            }
        }

        const result = await this.roleClosureRepository.move({
            newParent: targetParent.id,
            target: target.id,
            transaction,
            realm,
        });

        steps.push(result);

        return steps;
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
