import { Injectable, Scope } from "@nestjs/common";

import { PermissionOverride } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideService implements Services.PermissionOverride.Contract {
    public create({ transaction, input, realm, actor }: Services.PermissionOverride.Create): void {
        transaction.persist(
            new PermissionOverride({
                ...input,
                actor,
                realm,
            }),
        );
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
