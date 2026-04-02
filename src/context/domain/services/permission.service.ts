import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { ServiceException } from "~common/exceptions";
import { Permission } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionService implements Services.Permission.Contract {
    private readonly dictionaryPath = "services.permission";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.InternalContract,
    ) {}

    public async create({ transaction, input, realm }: Services.Permission.Create): Promise<Permission> {
        const limitExceeded = await this.permissionRepository.wouldExceedPermissionLimit({
            realm: realm.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            const entity = new Permission({ ...input, realm });

            transaction.persist(entity);

            return entity;
        }
    }

    public update({ entity, patch }: Services.Permission.Update): void {
        entity.update({ patch });
    }

    public purge({ transaction, entities }: Services.Permission.Purge): void {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.Permission.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.Permission.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }
}
