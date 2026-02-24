import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccessControlActionType, AccessControlEntityType, RoleProtoType } from "~context/enums";
import { ROLE_CLOSURE_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { AuditJournal, Role } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleService implements Services.Role.Contract {
    private readonly entityType = AccessControlEntityType.ROLE;
    private readonly dictionaryPath = "services.role";

    public constructor(
        @Inject(ROLE_CLOSURE_REPOSITORY)
        private readonly roleClosureRepository: Repositories.RoleClosure.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
        private readonly configService: ConfigService,
    ) {}

    public async create({
        transaction,
        input: { parent, children, actor, realm, ...input },
        context: { userAgent, ip },
    }: Services.Role.Create): Promise<Role> {
        if (parent.protoType === RoleProtoType.ATOMIC) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.CREATE_PARENT_NO_INHERITANCE`);
        } else {
            const isRoleLimitExceeded = await this.roleRepository.wouldExceedRoleLimit({
                transaction,
                realm: realm.id,
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
                await transaction.flush();

                await this.buildHierarchy({ input: { realm: realm.id, children, parent, entity }, transaction });

                const auditEntity = new AuditJournal({
                    actionType: AccessControlActionType.CREATE,
                    entityType: this.entityType,
                    at: entity.createdAt,
                    entity: entity.id,
                    realm: realm.id,
                    userAgent,
                    by: actor,
                    ip,
                });

                transaction.persist(auditEntity);
                await transaction.flush();

                return entity;
            }
        }
    }

    public async update({
        transaction,
        input: { patch, reason },
        context: { userAgent, ip },
        entity,
        realm,
        actor,
    }: Services.Role.Update): Promise<void> {
        const historyPatch = entity.changeMetadata({ reason, patch, actor });

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.UPDATE,
            entityType: this.entityType,
            at: entity.updatedAt!,
            patch: historyPatch,
            entity: entity.id,
            realm: realm,
            userAgent,
            by: actor,
            reason,
            ip,
        });

        transaction.persist(auditEntity);
        await transaction.flush();
    }

    public async purge({
        transaction,
        context: { userAgent, ip },
        entity,
        reason,
        realm,
        actor,
    }: Services.Role.Purge): Promise<void> {
        entity.canPurge();

        transaction.clear();

        await this.roleClosureRepository.decreaseTransitiveDepth({
            role: entity.id,
            realm: realm,
            transaction,
        });

        transaction.remove(entity);

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.DELETE,
            entityType: this.entityType,
            entity: entity.id,
            at: new Date(),
            realm: realm,
            userAgent,
            by: actor,
            reason,
            ip,
        });

        transaction.persist(auditEntity);
        await transaction.flush();
    }

    public async purgeSubtree({
        transaction,
        context: { userAgent, ip },
        entity,
        reason,
        realm,
        actor,
    }: Services.Role.PurgeSubtree): Promise<number> {
        const descendants: Role[] = await this.roleRepository.getDescendants({
            ancestor: entity.id,
            transaction,
        });

        transaction.clear();

        const limit = this.configService.getOrThrow<number>("MAX_ROLE_SUBTREE_SIZE_FOR_PURGE");

        if (descendants.length > limit) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.SUBTREE_SIZE_LIMIT_EXCEEDED`, { limit });
        } else {
            for (const descendant of descendants) {
                descendant.canPurge();

                transaction.remove(descendant);

                const auditEntity = new AuditJournal({
                    actionType: AccessControlActionType.DELETE,
                    entityType: this.entityType,
                    entity: descendant.id,
                    at: new Date(),
                    realm: realm,
                    userAgent,
                    by: actor,
                    reason,
                    ip,
                });

                transaction.persist(auditEntity);
            }

            await transaction.flush();

            return descendants.length;
        }
    }

    public async revoke({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        realm,
        actor,
    }: Services.Role.Revoke): Promise<void> {
        for (const entity of entities) {
            entity.revoke({ reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.REVOKE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                entity: entity.id,
                realm: realm,
                userAgent,
                by: actor,
                reason,
                ip,
            });

            transaction.persist(auditEntity);
        }
        await transaction.flush();
    }

    public async restore({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        realm,
        actor,
    }: Services.Role.Restore): Promise<void> {
        for (const entity of entities) {
            entity.restore({ reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.RESTORE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                entity: entity.id,
                realm: realm,
                userAgent,
                by: actor,
                reason,
                ip,
            });

            transaction.persist(auditEntity);
        }
        await transaction.flush();
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
            const descendants: Role[] = await this.roleRepository.getDescendants({
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
