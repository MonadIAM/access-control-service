import { EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { PermissionOverride } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideRepository {
    private readonly resource = "PermissionOverride";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {}

    public async create({ transaction, entity }: Repositories.PermissionOverride.Create): Promise<PermissionOverride> {
        try {
            const entityManager = transaction ?? this.writeManager;

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
    }: Repositories.PermissionOverride.Update): Promise<PermissionOverride> {
        try {
            const entityManager = transaction ?? this.writeManager;

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, id }: Repositories.PermissionOverride.Delete): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.writeManager;
            const where: FilterQuery<PermissionOverride> = {
                isRevoked: true,
                id,
            };
            const affected = await entityManager.nativeDelete(PermissionOverride, where);
            if (affected > 0) {
                return true;
            } else {
                throw RepositoryException.notFound({ resource: this.resource });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkUpdate({
        transaction,
        updates,
    }: Repositories.PermissionOverride.BulkUpdate): Promise<PermissionOverride[]> {
        try {
            const entityManager = transaction ?? this.writeManager;

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
        account,
    }: Repositories.PermissionOverride.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager;
            const where: FilterQuery<PermissionOverride> = {
                ...(identifiers ? { id: { $in: identifiers } } : { account }),
                isRevoked: true,
            };
            return await entityManager.nativeDelete(PermissionOverride, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.PermissionOverride.FindUnique<P, F>): Promise<Nullable<Loaded<PermissionOverride, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOne(PermissionOverride, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.PermissionOverride.FindUniqueOrThrow<P, F>): Promise<Loaded<PermissionOverride, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOneOrFail(PermissionOverride, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.PermissionOverride.FindMany<P, F>): Promise<[Loaded<PermissionOverride, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findAndCount(PermissionOverride, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
