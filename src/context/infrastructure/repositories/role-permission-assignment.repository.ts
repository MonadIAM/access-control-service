import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RolePermissionAssignmentAdapter } from "~context/infrastructure/adapters";
import { RolePermissionAssignment } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentRepository
    extends RolePermissionAssignmentAdapter
    implements Repositories.RolePermissionAssignment.Contract
{
    private readonly resource = "RolePermissionAssignment";
    private readonly permissionLimit: number;

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
        private readonly configService: ConfigService,
    ) {
        super();
        this.permissionLimit = this.configService.getOrThrow<number>("PERMISSION_PER_ROLE_LIMIT");
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RolePermissionAssignment.FindUnique<P, F>): Promise<Nullable<Loaded<RolePermissionAssignment, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(RolePermissionAssignment, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RolePermissionAssignment.FindUniqueOrThrow<P, F>): Promise<Loaded<RolePermissionAssignment, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(RolePermissionAssignment, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.RolePermissionAssignment.Find<P, F>,
    ): Promise<Loaded<RolePermissionAssignment, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(RolePermissionAssignment, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.RolePermissionAssignment.FindMany<P, F>,
    ): Promise<[Loaded<RolePermissionAssignment, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(RolePermissionAssignment, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(RolePermissionAssignment, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async wouldExceedPermissionLimit({
        transaction,
        permissions,
        role,
    }: Repositories.RolePermissionAssignment.WouldExceedPermissionLimit): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const assignments = await knex("access_control.role_permission_assignment as assignment")
                .join("access_control.permission as permission", "permission.id", "assignment.permission_id")
                .where("assignment.role_id", role)
                .select("assignment.permission_id", "assignment.is_revoked", "permission.is_system_managed");

            const existingRoleIds = new Set(assignments.map((assignment) => assignment.permission_id));
            const trulyNewCount = permissions.filter((id) => !existingRoleIds.has(id)).length;

            return assignments.length + trulyNewCount > this.permissionLimit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
