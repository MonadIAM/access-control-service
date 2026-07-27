import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { ChangeLog } from "~common/transaction-manager";
import { BaseRepository } from "~common/mixins";

import { ChangeLogAdapter } from "../adapters";

@Injectable({ scope: Scope.DEFAULT })
export class ChangeLogRepository
    extends BaseRepository<SystemEntities.ChangeLog, Adapters.ChangeLog.Types>({
        Adapter: ChangeLogAdapter,
        Entity: ChangeLog,
    })
    implements Repositories.ChangeLog.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
