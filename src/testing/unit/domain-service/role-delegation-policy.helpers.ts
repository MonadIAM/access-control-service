import { RoleDelegationPolicyService } from "~context/domain/services/role-delegation-policy.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleDelegationPolicyUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.RoleDelegationPolicy.Contract
{
    public service(
        props: Unit.Domain.RoleDelegationPolicy.Service.Props = {},
    ): Unit.Domain.RoleDelegationPolicy.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new RoleDelegationPolicyService(
                this.contract<Repositories.RoleDelegationPolicy.PublicContract>(repositories.roleDelegationPolicies),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
                this.contract<Repositories.Role.PublicContract>(repositories.roles),
            ),
            repositories,
            transaction,
        };
    }
}
