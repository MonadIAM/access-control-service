import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PermissionOverride } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideService implements Services.PermissionOverride.Contract {
    private readonly dictionaryPath = "services.permission-override";

    public constructor(
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.Contract,
    ) {}

    public async create(props: Services.PermissionOverride.Create.Props): Services.PermissionOverride.Create.Result {
        const { transaction, input, realm } = props;
        const limitExceeded = await this.permissionOverrideRepository.wouldExceedOverrideLimit({
            account: input.account,
            realm: realm.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            const entity = new PermissionOverride({ ...input, realm });
            transaction.persist(entity);
            return entity;
        }
    }

    public purge(props: Services.PermissionOverride.Purge.Props): Services.PermissionOverride.Purge.Result {
        const { transaction, entities } = props;
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke(props: Services.PermissionOverride.Revoke.Props): Services.PermissionOverride.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.PermissionOverride.Restore.Props): Services.PermissionOverride.Restore.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.restore();
        }
    }
}
