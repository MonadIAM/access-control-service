import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { AuditLogAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { AuditLog } from "~common/tracking";

@Injectable({ scope: Scope.DEFAULT })
export class AuditLogRepository extends AuditLogAdapter implements Repositories.AuditLog.Contract {
    private readonly resource = "AuditLog";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AuditLog.FindUniqueOrThrow<P, F>): Promise<Loaded<AuditLog, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(AuditLog, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.AuditLog.FindMany<P, F>,
    ): Promise<[Loaded<AuditLog, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(AuditLog, where, options);
            } else {
                const { pagination, filters, sort } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(AuditLog, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
