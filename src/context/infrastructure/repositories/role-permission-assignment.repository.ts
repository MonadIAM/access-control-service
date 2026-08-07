import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RolePermissionAssignment } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { RolePermissionAssignmentMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentRepository
    extends BaseRepository<Entities.RolePermissionAssignment, Repositories.Mappers.RolePermissionAssignment.Types>({
        Mapper: RolePermissionAssignmentMapper,
        Entity: RolePermissionAssignment,
    })
    implements Repositories.RolePermissionAssignment.Contract
{
    protected readonly permissionLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
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

            const [total, overlap] = await Promise.all([
                entityManager.count(RolePermissionAssignment, { role, isRevoked: false }),
                entityManager.count(RolePermissionAssignment, { role, isRevoked: false, permission: { $in: permissions } }),
            ]);

            return total + permissions.length - overlap > this.permissionLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
