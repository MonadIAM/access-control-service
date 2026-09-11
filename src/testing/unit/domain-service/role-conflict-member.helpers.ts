import { RoleConflictMemberService } from "~context/domain/services/role-conflict-member.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleConflictMemberUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.RoleConflictMember.Contract
{
    public service(
        props: Unit.Domain.RoleConflictMember.Service.Props = {},
    ): Unit.Domain.RoleConflictMember.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new RoleConflictMemberService(
                this.contract<Repositories.RoleConflictMember.PublicContract>(repositories.roleConflictMembers),
                this.contract<Repositories.RoleConflictGroup.PublicContract>(repositories.roleConflictGroups),
                this.contract<Repositories.Role.PublicContract>(repositories.roles),
            ),
            repositories,
            transaction,
        };
    }
}
