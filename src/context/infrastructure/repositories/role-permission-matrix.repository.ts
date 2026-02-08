import { EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RolePermissionMatrixAdapter } from "~context/infrastructure/adapters";
import { RolePermissionMatrix } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionMatrixRepository
    extends RolePermissionMatrixAdapter
    implements Repositories.RolePermissionMatrix.Contract
{
    private readonly resource = "RolePermissionMatrix";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async create({ transaction, entity }: Repositories.RolePermissionMatrix.Create): Promise<RolePermissionMatrix> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({
        transaction,
        entity,
        patch,
    }: Repositories.RolePermissionMatrix.Update): Promise<RolePermissionMatrix> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, id }: Repositories.RolePermissionMatrix.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<RolePermissionMatrix> = {
                isSystemManaged: false,
                isRevoked: true,
                id,
            };
            const affected = await entityManager.nativeDelete(RolePermissionMatrix, where);
            if (!affected) {
                throw RepositoryException.notFound({ resource: this.resource });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkCreate({
        transaction,
        entities,
    }: Repositories.RolePermissionMatrix.BulkCreate): Promise<RolePermissionMatrix[]> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entities);
            await entityManager.flush();

            return entities;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkUpdate({
        transaction,
        updates,
    }: Repositories.RolePermissionMatrix.BulkUpdate): Promise<RolePermissionMatrix[]> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            for (const { entity, patch } of updates) {
                wrap(entity).assign(patch, { merge: true });
            }

            await entityManager.flush();

            return updates.map(({ entity }) => entity);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkDelete({
        transaction,
        identifiers,
        role,
    }: Repositories.RolePermissionMatrix.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<RolePermissionMatrix> = {
                ...(identifiers ? { id: { $in: identifiers } } : { role }),
                isSystemManaged: false,
                isRevoked: true,
            };
            return await entityManager.nativeDelete(RolePermissionMatrix, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RolePermissionMatrix.FindUnique<P, F>): Promise<Nullable<Loaded<RolePermissionMatrix, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(RolePermissionMatrix, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RolePermissionMatrix.FindUniqueOrThrow<P, F>): Promise<Loaded<RolePermissionMatrix, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(RolePermissionMatrix, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.RolePermissionMatrix.FindMany<P, F>,
    ): Promise<[Loaded<RolePermissionMatrix, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(RolePermissionMatrix, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(RolePermissionMatrix, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
