import { RolePermissionAssignmentService } from "~context/domain/services/role-permission-assignment.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RolePermissionAssignmentUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.RolePermissionAssignment.Contract
{
    public service(
        props: Unit.Domain.RolePermissionAssignment.Service.Props = {},
    ): Unit.Domain.RolePermissionAssignment.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new RolePermissionAssignmentService(
                this.contract<Repositories.RolePermissionAssignment.PublicContract>(repositories.rolePermissionAssignments),
                this.contract<Repositories.Permission.PublicContract>(repositories.permissions),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
                this.contract<Repositories.Role.PublicContract>(repositories.roles),
            ),
            repositories,
            transaction,
        };
    }
}
