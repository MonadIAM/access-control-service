import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleArchetype, MoveMode } from "~context/enums";
import { Exception } from "~common/exceptions";

import { ROLE_CLOSURE_REPOSITORY, ROLE_REPOSITORY } from "../repositories";
import { Role } from "../entities";

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

    public async create(props: Services.Role.Create.Props): Services.Role.Create.Result {
        const { transaction, input, realm } = props;
        if (input.parent.archetype === RoleArchetype.ATOMIC) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CREATE_PARENT_NO_INHERITANCE` });
        } else {
            const limitExceeded = await this.roleRepository.wouldExceedRoleLimit({
                realm: realm.id,
                transaction,
            });

            if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REALM_ROLE_LIMIT_EXCEEDED` });
            } else {
                const entity = new Role({
                    description: input.description,
                    actorType: input.actorType,
                    archetype: input.archetype,
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

    public update(props: Services.Role.Update.Props): Services.Role.Update.Result {
        const { entity, patch } = props;
        entity.update({ patch });
    }

    public async purge(props: Services.Role.Purge.Props): Services.Role.Purge.Result {
        const { transaction, entity, realm } = props;
        entity.canPurge();
        transaction.clear();

        await this.roleClosureRepository.decreaseTransitiveDepth({
            role: entity.id,
            transaction,
            realm,
        });

        transaction.remove(entity);
    }

    public async purgeSubtree(props: Services.Role.PurgeSubtree.Props): Services.Role.PurgeSubtree.Result {
        const { transaction, entity, realm } = props;
        const descendants = await this.roleRepository.getDescendants({
            ancestor: entity.id,
            where: { realm },
            transaction,
        });

        transaction.clear();

        if (descendants.length > this.purgeSubtreeSizeLimit) {
            throw Exception.invariantViolation({
                messageKey: `${this.dictionaryPath}.SUBTREE_SIZE_LIMIT_EXCEEDED`,
                params: { limit: this.purgeSubtreeSizeLimit },
            });
        } else {
            for (const descendant of descendants) {
                descendant.canPurge();
                transaction.remove(descendant);
            }
            return descendants;
        }
    }

    public revoke(props: Services.Role.Revoke.Props): Services.Role.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.Role.Restore.Props): Services.Role.Restore.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.restore();
        }
    }

    public async move(props: Services.Role.Move.Props): Services.Role.Move.Result {
        const { targetParent, transaction, target, realm, mode } = props;
        if (targetParent.archetype === RoleArchetype.ATOMIC) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REPARENT_TARGET_NO_INHERITANCE` });
        }

        if (targetParent.id === target.id) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REPARENT_TARGET_IS_SELF` });
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
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REPARENT_ROOT_NOT_ALLOWED` });
        }

        if (mode !== MoveMode.LINEAR && currentParent.id === targetParent.id) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REPARENT_TARGET_ALREADY_PARENT` });
        }

        if (mode === MoveMode.SUBTREE && wouldFormCycle) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REPARENT_TARGET_IN_SUBTREE` });
        }

        const steps: Awaited<Services.Role.Move.Result> = [];

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

    public async buildHierarchy(props: Services.Role.BuildHierarchy.Props): Services.Role.BuildHierarchy.Result {
        const {
            input: { children, parent, entity, realm },
            transaction,
        } = props;
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
                    throw Exception.invariantViolation({
                        messageKey: `${this.dictionaryPath}.CREATE_CHILD_NOT_DIRECT_DESCENDANT`,
                    });
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
