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

    public async create({ transaction, input, realm, actor }: Services.PermissionOverride.Create): Promise<void> {
        const limitExceeded = await this.permissionOverrideRepository.wouldExceedOverrideLimit({
            account: input.account,
            realm: realm.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            transaction.persist(new PermissionOverride({ ...input, actor, realm }));
        }
    }

    public purge({ transaction, input }: Services.PermissionOverride.Purge): void {
        transaction.clear();
        for (const entity of input.entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ input, actor }: Services.PermissionOverride.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });
        }
    }

    public restore({ input, actor }: Services.PermissionOverride.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });
        }
    }
}
