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

    public async create({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.Role.Create): Promise<Role> {
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

                return entity;
            }
        }
    }

    public update({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.Role.Update): void {
        const historyPatch = input.entity.changeMetadata({ ...input, actor });

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.UPDATE,
            entityType: this.entityType,
            at: input.entity.updatedAt!,
            entity: input.entity.id,
            reason: input.reason,
            patch: historyPatch,
            userAgent,
            by: actor,
            realm,
            ip,
        });

        transaction.persist(auditEntity);
    }

    public async purge({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.Role.Purge): Promise<void> {
        input.entity.canPurge();

        transaction.clear();

        await this.roleClosureRepository.decreaseTransitiveDepth({
            role: input.entity.id,
            transaction,
            realm,
        });

        transaction.remove(input.entity);

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.DELETE,
            entityType: this.entityType,
            entity: input.entity.id,
            reason: input.reason,
            at: new Date(),
            userAgent,
            by: actor,
            realm,
            ip,
        });

        transaction.persist(auditEntity);
    }

    public async purgeSubtree({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.Role.PurgeSubtree): Promise<number> {
        const descendants: Role[] = await this.roleRepository.getDescendants({
            ancestor: input.entity.id,
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

                const auditEntity = new AuditJournal({
                    actionType: AccessControlActionType.DELETE,
                    entityType: this.entityType,
                    entity: descendant.id,
                    reason: input.reason,
                    at: new Date(),
                    userAgent,
                    by: actor,
                    realm,
                    ip,
                });

                transaction.persist(auditEntity);
            }

            return descendants.length;
        }
    }

    public revoke({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.Role.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.REVOKE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                reason: input.reason,
                entity: entity.id,
                userAgent,
                by: actor,
                realm,
                ip,
            });

            transaction.persist(auditEntity);
        }
    }

    public restore({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.Role.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.RESTORE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                reason: input.reason,
                entity: entity.id,
                userAgent,
                by: actor,
                realm,
                ip,
            });

            transaction.persist(auditEntity);
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
