import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RepositoryException } from "~common/exceptions";
import { AuditJournal } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class AuditJournalRepository implements Repositories.AuditJournal.Contract {
    private readonly resource = "AuditJournal";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {}

    public async create({ transaction, entity }: Repositories.AuditJournal.Create): Promise<AuditJournal> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkCreate({ transaction, entities }: Repositories.AuditJournal.BulkCreate): Promise<AuditJournal[]> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();

            entityManager.persist(entities);
            await entityManager.flush();

            return entities;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async bulkDelete({ transaction, where }: Repositories.AuditJournal.BulkDelete): Promise<number> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            return await entityManager.nativeDelete(AuditJournal, where);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AuditJournal.FindUnique<P, F>): Promise<Nullable<Loaded<AuditJournal, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(AuditJournal, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AuditJournal.FindUniqueOrThrow<P, F>): Promise<Loaded<AuditJournal, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(AuditJournal, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AuditJournal.FindMany<P, F>): Promise<[Loaded<AuditJournal, P, F>[], number]> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findAndCount(AuditJournal, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AuditJournal.Find<P, F>): Promise<Loaded<AuditJournal, P, F>[]> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(AuditJournal, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
