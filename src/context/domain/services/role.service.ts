import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ROLE_CLOSURE_REPOSITORY, ROLE_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { RoleArchetype, MoveMode } from "~context/enums";
import { Exception } from "~common/exceptions";

import { Role } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleService implements Services.Role.Contract {
    private readonly dictionaryPath = "services.role";
    private readonly purgeSubtreeSizeLimit: number;

    public constructor(
        @Inject(ROLE_CLOSURE_REPOSITORY)
        private readonly roleClosureRepository: Repositories.RoleClosure.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
        private readonly configService: ConfigService,
    ) {
        this.purgeSubtreeSizeLimit = this.configService.getOrThrow<number>("MAX_ROLE_SUBTREE_SIZE_FOR_PURGE");
    }

    public async create(props: Services.Role.Create.Props): Services.Role.Create.Result {
        const { transaction, input, realm } = props;
        const [parent, realmEntity] = await Promise.all([
            this.roleRepository.findUniqueOrThrow({
                where: { id: input.parent, realm },
                transaction,
            }),
            this.realmRepository.findUniqueOrThrow({
                where: { id: realm },
                transaction,
            }),
        ]);

        if (parent.archetype === RoleArchetype.ATOMIC) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CREATE_PARENT_NO_INHERITANCE` });
        } else {
            const limitExceeded = await this.roleRepository.wouldExceedRoleLimit({
                transaction,
                realm,
            });

            if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REALM_ROLE_LIMIT_EXCEEDED` });
            } else {
                const entity = new Role({
                    description: input.description,
                    actorType: input.actorType,
                    archetype: input.archetype,
                    realm: realmEntity,
                    code: input.code,
                    name: input.name,
                });

                transaction.persist(entity);
                await transaction.flush();

                await this.buildHierarchy({
                    transaction,
                    input: {
                        children: input.children,
                        entity,
                        parent,
                        realm,
                    },
                });

                return { entity, parent };
            }
        }
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

    public async update(props: Services.Role.Update.Props): Services.Role.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.roleRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        entity.update({ patch });
    }

    public async move(props: Services.Role.Move.Props): Services.Role.Move.Result {
        const { transaction, realm, mode } = props;
        const [target, targetParent] = await Promise.all([
            this.roleRepository.findUniqueOrThrow({
                where: { id: props.target, realm, isSystemManaged: false },
                transaction,
            }),
            this.roleRepository.findUniqueOrThrow({
                where: { id: props.targetParent, realm },
                transaction,
            }),
        ]);

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

        const steps: Services.Role.Move.Steps = [];

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

        return { steps, target };
    }

    public async revoke(props: Services.Role.Revoke.Props): Services.Role.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.roleRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ROLES_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(props: Services.Role.Restore.Props): Services.Role.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.roleRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ROLES_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            return entities;
        }
    }

    public async purge(props: Services.Role.Purge.Props): Services.Role.Purge.Result {
        const { transaction, realm, id } = props;
        const entity = await this.roleRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        entity.canPurge();

        await this.roleClosureRepository.decreaseTransitiveDepth({
            role: entity.id,
            transaction,
            realm,
        });

        transaction.remove(entity);

        return entity;
    }

    public async purgeSubtree(props: Services.Role.PurgeSubtree.Props): Services.Role.PurgeSubtree.Result {
        const { transaction, realm, id } = props;
        const root = await this.roleRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        const descendants = await this.roleRepository.getDescendants({
            ancestor: root.id,
            where: { realm },
            transaction,
        });

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

            return { entities: descendants, root };
        }
    }
}
