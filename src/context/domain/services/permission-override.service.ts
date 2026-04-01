import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PermissionOverride } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideService implements Services.PermissionOverride.Contract {
    private readonly dictionaryPath = "services.permission-override";

    public constructor(
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.InternalContract,
    ) {}

    public async create({ transaction, input, realm }: Services.PermissionOverride.Create): Promise<void> {
        const limitExceeded = await this.permissionOverrideRepository.wouldExceedOverrideLimit({
            account: input.account,
            realm: realm.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            transaction.persist(new PermissionOverride({ ...input, realm }));
        }
    }

    public purge({ transaction, entities }: Services.PermissionOverride.Purge): void {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.PermissionOverride.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.PermissionOverride.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }
}
