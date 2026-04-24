import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { ChangeLogAdapter } from "~context/infrastructure/adapters";
import { BaseRepository } from "~common/mixins";
import { ChangeLog } from "~common/transaction-manager";

@Injectable({ scope: Scope.DEFAULT })
export class ChangeLogRepository
    extends BaseRepository<ChangeLog, Adapters.ChangeLog.Types>({
        Adapter: ChangeLogAdapter,
        Entity: ChangeLog,
    })
    implements Repositories.ChangeLog.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }
}
