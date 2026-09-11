import { Inject, Injectable, Scope } from "@nestjs/common";
import { SYSTEM_REALM_ID } from "@monadiam/shared";

import { Exception } from "~common/exceptions";
import {
    PERMISSION_OVERRIDE_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
} from "~context/infrastructure/repositories";

import { PermissionOverride } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideService implements Services.PermissionOverride.Contract {
    private readonly dictionaryPath = "services.permission-override";

    public constructor(
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.PublicContract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
    ) {}

    public async create(props: Services.PermissionOverride.Create.Props): Services.PermissionOverride.Create.Result {
        const { transaction, input, realm } = props;
        const [realmEntity, permission] = await Promise.all([
            this.realmRepository.findUniqueOrThrow({
                where: { id: realm },
                transaction,
            }),
            this.permissionRepository.findUniqueOrThrow({
                where: { id: input.permission, realm: { $in: [realm, SYSTEM_REALM_ID] } },
                transaction,
            }),
        ]);

        const limitExceeded = await this.permissionOverrideRepository.wouldExceedOverrideLimit({
            account: input.account,
            transaction,
            realm,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
        } else {
            const entity = new PermissionOverride({
                justification: input.justification,
                expiresAt: input.expiresAt,
                account: input.account,
                effect: input.effect,
                realm: realmEntity,
                permission,
            });

            entity.canCreate();
            transaction.persist(entity);
            return entity;
        }
    }

    public async revoke(props: Services.PermissionOverride.Revoke.Props): Services.PermissionOverride.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.permissionOverrideRepository.find({
            options: { populate: ["permission.realm"] },
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.OVERRIDES_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(props: Services.PermissionOverride.Restore.Props): Services.PermissionOverride.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.permissionOverrideRepository.find({
            options: { populate: ["permission.realm"] },
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.OVERRIDES_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            return entities;
        }
    }

    public expire(props: Services.PermissionOverride.Expire.Props): Services.PermissionOverride.Expire.Result {
        const { transaction, entities } = props;
        for (const entity of entities) {
            transaction.merge(entity);
            entity.revoke();
        }
    }

    public async purge(props: Services.PermissionOverride.Purge.Props): Services.PermissionOverride.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.permissionOverrideRepository.find({
            options: { populate: ["permission.realm"] },
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.OVERRIDES_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }

    public async clean(props: Services.PermissionOverride.Clean.Props): Services.PermissionOverride.Clean.Result {
        const { transaction, input } = props;
        const entities = await this.permissionOverrideRepository.find({
            where: { account: input.account, ...(input.realm ? { realm: input.realm } : {}) },
            options: { populate: ["permission.realm", "realm"] },
            transaction,
        });

        for (const entity of entities) {
            transaction.remove(entity);
        }

        return entities;
    }
}
