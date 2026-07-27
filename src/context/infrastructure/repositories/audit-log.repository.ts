import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { AuditLog } from "~common/transaction-manager";
import { BaseRepository } from "~common/mixins";

import { AuditLogAdapter } from "../adapters";

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
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
