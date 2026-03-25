import { Inject, Injectable, Scope } from "@nestjs/common";

import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { ServiceException } from "~common/exceptions";
import { Realm } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RealmService implements Services.Realm.Contract {
    private readonly dictionaryPath = "services.realm";

    public constructor(
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
    ) {}

    public async create({ transaction, input, actor }: Services.Realm.Create): Promise<void> {
        const limitExceeded = await this.realmRepository.wouldExceedRealmLimit({
            account: actor,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            transaction.persist(new Realm({ ...input, owner: actor }));
        }
    }

    public update({ entity, patch }: Services.Realm.Update): void {
        entity.update({ patch });
    }

    public purge({ transaction, entities }: Services.Realm.Purge): void {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.Realm.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.Realm.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }
}
