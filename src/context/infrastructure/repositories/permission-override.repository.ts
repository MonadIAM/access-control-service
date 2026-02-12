import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { PermissionOverrideAdapter } from "~context/infrastructure/adapters";
import { PermissionOverride } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideRepository
    extends PermissionOverrideAdapter
    implements Repositories.PermissionOverride.Contract
{
    private readonly resource = "PermissionOverride";

    public constructor(@InjectEntityManager("read") private readonly readManager: EntityManager) {
        super();
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.PermissionOverride.FindUnique<P, F>): Promise<Nullable<Loaded<PermissionOverride, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(PermissionOverride, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.PermissionOverride.FindUniqueOrThrow<P, F>): Promise<Loaded<PermissionOverride, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(PermissionOverride, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.PermissionOverride.FindMany<P, F>,
    ): Promise<[Loaded<PermissionOverride, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(PermissionOverride, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(PermissionOverride, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
