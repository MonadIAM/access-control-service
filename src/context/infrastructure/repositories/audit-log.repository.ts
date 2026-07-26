import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { AuditLogAdapter } from "~context/infrastructure/adapters";
import { AuditLog } from "~common/transaction-manager";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class AuditLogRepository
    extends BaseRepository<SystemEntities.AuditLog, Adapters.AuditLog.Types>({
        Adapter: AuditLogAdapter,
        Entity: AuditLog,
    })
    implements Repositories.AuditLog.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }
}
