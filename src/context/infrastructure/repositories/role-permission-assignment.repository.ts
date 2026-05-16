import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RolePermissionAssignmentAdapter } from "~context/infrastructure/adapters";
import { RolePermissionAssignment } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentRepository
    extends BaseRepository<Entities.RolePermissionAssignment, Adapters.RolePermissionAssignment.Types>({
        Adapter: RolePermissionAssignmentAdapter,
        Entity: RolePermissionAssignment,
    })
    implements Repositories.RolePermissionAssignment.Contract
{
    protected readonly permissionLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.permissionLimit = this.configService.getOrThrow<number>("PERMISSION_PER_ROLE_LIMIT");
    }

    public async wouldExceedPermissionLimit(
        props: Repositories.RolePermissionAssignment.WouldExceedPermissionLimit.Props,
    ): Repositories.RolePermissionAssignment.WouldExceedPermissionLimit.Result {
        try {
            const { transaction, permissions, role } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total, overlap }] = await knex("access_control.role_permission_assignment")
                .where("role_id", role)
                .andWhere("is_revoked", false)
                .select(
                    knex.raw("COUNT(*)::int AS total"),
                    knex.raw("COUNT(*) FILTER (WHERE permission_id = ANY(?))::int AS overlap", [permissions]),
                );

            return Number(total) + permissions.length - Number(overlap) > this.permissionLimit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
