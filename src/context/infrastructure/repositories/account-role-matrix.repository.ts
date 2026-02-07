import { EntityManager, FilterQuery, Loaded, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccountRoleMatrixAdapter } from "~context/infrastructure/adapters";
import { AccountRoleMatrix } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleMatrixRepository
    extends AccountRoleMatrixAdapter
    implements Repositories.AccountRoleMatrix.Contract
{
    private readonly resource = "AccountRoleMatrix";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    public async create({ transaction, entity }: Repositories.AccountRoleMatrix.Create): Promise<AccountRoleMatrix> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.AccountRoleMatrix.Update): Promise<AccountRoleMatrix> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, realm, id }: Repositories.AccountRoleMatrix.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<AccountRoleMatrix> = {
                isSystemManaged: false,
                isRevoked: true,
                realm,
                id,
            };
            const affected = await entityManager.nativeDelete(AccountRoleMatrix, where);
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
    }: Repositories.AccountRoleMatrix.BulkCreate): Promise<AccountRoleMatrix[]> {
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
    }: Repositories.AccountRoleMatrix.BulkUpdate): Promise<AccountRoleMatrix[]> {
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
        accountId,
        realm,
    }: Repositories.AccountRoleMatrix.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const where: FilterQuery<AccountRoleMatrix> = {
                ...(identifiers ? { id: { $in: identifiers } } : { accountId }),
                isSystemManaged: false,
                isRevoked: true,
                realm,
            };
            return await entityManager.nativeDelete(AccountRoleMatrix, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AccountRoleMatrix.FindUnique<P, F>): Promise<Nullable<Loaded<AccountRoleMatrix, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return entityManager.findOne(AccountRoleMatrix, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AccountRoleMatrix.FindUniqueOrThrow<P, F>): Promise<Loaded<AccountRoleMatrix, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return entityManager.findOneOrFail(AccountRoleMatrix, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">(
        props: Repositories.AccountRoleMatrix.FindMany<P, F>,
    ): Promise<[Loaded<AccountRoleMatrix, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return entityManager.findAndCount(AccountRoleMatrix, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return entityManager.findAndCount(AccountRoleMatrix, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async wouldExceedRoleLimit({
        transaction,
        account,
        roles,
    }: Repositories.AccountRoleMatrix.WouldExceedRoleLimit): Promise<boolean> {
        try {
            const limit = this.configService.getOrThrow<number>("ROLE_LIMIT");
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const assignments = await knex("access_control.account_role_matrix as matrix")
                .join("access_control.role as role", "role.id", "matrix.role_id")
                .where("matrix.account_id", account)
                .select("matrix.role_id", "matrix.is_revoked", "role.is_system_managed");

            const existingRoleIds = new Set(assignments.map((assignment) => assignment.role_id));
            const trulyNewCount = roles.filter((id) => !existingRoleIds.has(id)).length;

            if (assignments.length + trulyNewCount > limit) {
                return false;
            } else {
                return true;
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
