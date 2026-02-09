import { EntityManager, FilterQuery, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RoleConflictMemberAdapter } from "~context/infrastructure/adapters";
import { RoleConflictMember } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberRepository
    extends RoleConflictMemberAdapter
    implements Repositories.RoleConflictMember.Contract
{
    private readonly resource = "RoleConflictMember";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async create({ transaction, entity }: Repositories.RoleConflictMember.Create): Promise<RoleConflictMember> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, id }: Repositories.RoleConflictMember.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<RoleConflictMember> = {
                isSystemManaged: false,
                isRevoked: true,
                id,
            };
            const affected = await entityManager.nativeDelete(RoleConflictMember, where);
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
    }: Repositories.RoleConflictMember.BulkCreate): Promise<RoleConflictMember[]> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entities);
            await entityManager.flush();

            return entities;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkDelete({ transaction, identifiers }: Repositories.RoleConflictMember.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<RoleConflictMember> = {
                id: { $in: identifiers },
                isSystemManaged: false,
                isRevoked: true,
            };
            return await entityManager.nativeDelete(RoleConflictMember, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictMember.FindUnique<P, F>): Promise<Nullable<Loaded<RoleConflictMember, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(RoleConflictMember, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictMember.FindUniqueOrThrow<P, F>): Promise<Loaded<RoleConflictMember, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(RoleConflictMember, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.RoleConflictMember.FindMany<P, F>,
    ): Promise<[Loaded<RoleConflictMember, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(RoleConflictMember, where, options);
            } else {
                const { pagination, filters, sort, options } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(RoleConflictMember, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
