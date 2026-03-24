import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { ServiceException } from "~common/exceptions";
import { Permission } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionService implements Services.Permission.Contract {
    private readonly dictionaryPath = "services.permission";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
    ) {}

    public async create({ transaction, input, realm, actor }: Services.Permission.Create): Promise<void> {
        const limitExceeded = await this.permissionRepository.wouldExceedPermissionLimit({
            realm: realm.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            transaction.persist(new Permission({ ...input, realm, actor }));
        }
    }

    public update({ input, actor }: Services.Permission.Update): void {
        input.entity.changeMetadata({ ...input, actor });
    }

    public purge({ transaction, input }: Services.Permission.Purge): void {
        transaction.clear();
        for (const entity of input.entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ input, actor }: Services.Permission.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });
        }
    }

    public restore({ input, actor }: Services.Permission.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });
        }
    }
}
