import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { Permission } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionService implements Services.Permission.Contract {
    private readonly dictionaryPath = "services.permission";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.PublicContract,
    ) {}

    public async create(props: Services.Permission.Create.Props): Services.Permission.Create.Result {
        const { transaction, input, realm } = props;
        const limitExceeded = await this.permissionRepository.wouldExceedPermissionLimit({
            realm: realm.id,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
        } else {
            const entity = new Permission({ ...input, realm });

            transaction.persist(entity);

            return entity;
        }
    }

    public update(props: Services.Permission.Update.Props): Services.Permission.Update.Result {
        const { entity, patch } = props;
        entity.update({ patch });
    }

    public purge(props: Services.Permission.Purge.Props): Services.Permission.Purge.Result {
        const { transaction, entities } = props;
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke(props: Services.Permission.Revoke.Props): Services.Permission.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.Permission.Restore.Props): Services.Permission.Restore.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.restore();
        }
    }
}
