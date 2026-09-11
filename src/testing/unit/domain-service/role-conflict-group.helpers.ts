import { RoleConflictGroupService } from "~context/domain/services/role-conflict-group.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleConflictGroupUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.RoleConflictGroup.Contract
{
    public service(props: Unit.Domain.RoleConflictGroup.Service.Props = {}): Unit.Domain.RoleConflictGroup.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();
        const config = this.config({
            values: {
                MAX_CONFLICT_MEMBERS_COUNT: props.membersLimit ?? 2,
            },
        });

        return {
            service: new RoleConflictGroupService(
                this.contract<Repositories.RoleConflictGroup.PublicContract>(repositories.roleConflictGroups),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
                this.contract<Repositories.Role.PublicContract>(repositories.roles),
                config,
            ),
            repositories,
            transaction,
        };
    }
}
