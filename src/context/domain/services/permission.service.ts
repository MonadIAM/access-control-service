import { Injectable, Scope } from "@nestjs/common";

import { Permission } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionService implements Services.Permission.Contract {
    public create({ transaction, input, realm, actor }: Services.Permission.Create): void {
        transaction.persist(
            new Permission({
                ...input,
                realm,
                actor,
            }),
        );
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
