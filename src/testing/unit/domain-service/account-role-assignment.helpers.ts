import { AccountRoleAssignmentService } from "~context/domain/services/account-role-assignment.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class AccountRoleAssignmentUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.AccountRoleAssignment.Contract
{
    public service(
        props: Unit.Domain.AccountRoleAssignment.Service.Props = {},
    ): Unit.Domain.AccountRoleAssignment.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new AccountRoleAssignmentService(
                this.contract<Repositories.AccountRoleAssignment.PublicContract>(repositories.accountRoleAssignments),
                this.contract<Repositories.RoleDelegationPolicy.PublicContract>(repositories.roleDelegationPolicies),
                this.contract<Repositories.RoleConflictGroup.PublicContract>(repositories.roleConflictGroups),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
                this.contract<Repositories.Role.PublicContract>(repositories.roles),
            ),
            repositories,
            transaction,
        };
    }
}
