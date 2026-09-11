import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { Permission } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionService implements Services.Permission.Contract {
    private readonly dictionaryPath = "services.permission";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
    ) {}

    public async create(props: Services.Permission.Create.Props): Services.Permission.Create.Result {
        const { transaction, input, realm } = props;
        const [realmEntity, limitExceeded] = await Promise.all([
            this.realmRepository.findUniqueOrThrow({
                where: { id: realm },
                transaction,
            }),
            this.permissionRepository.wouldExceedPermissionLimit({
                realm,
                transaction,
            }),
        ]);

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
        } else {
            const entity = new Permission({ ...input, realm: realmEntity });
            transaction.persist(entity);
            return entity;
        }
    }

    public async update(props: Services.Permission.Update.Props): Services.Permission.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.permissionRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        entity.update({ patch });
    }

    public async revoke(props: Services.Permission.Revoke.Props): Services.Permission.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.permissionRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(props: Services.Permission.Restore.Props): Services.Permission.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.permissionRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            return entities;
        }
    }

    public async purge(props: Services.Permission.Purge.Props): Services.Permission.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.permissionRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }
}
