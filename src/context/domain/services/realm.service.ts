import { Injectable, Scope } from "@nestjs/common";

import { Realm } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RealmService implements Services.Realm.Contract {
    public create({ transaction, input, actor }: Services.Realm.Create): void {
        transaction.persist(
            new Realm({
                ...input,
                actor,
            }),
        );
    }

    public update({ input, actor }: Services.Realm.Update): void {
        input.entity.changeMetadata({ ...input, actor });
    }

    public purge({ transaction, input }: Services.Realm.Purge): void {
        transaction.clear();
        for (const entity of input.entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ input, actor }: Services.Realm.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });
        }
    }

    public restore({ input, actor }: Services.Realm.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });
        }
    }
}
