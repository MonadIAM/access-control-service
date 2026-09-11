import { RoleService } from "~context/domain/services/role.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Role.Contract {
    public service(props: Unit.Domain.Role.Service.Props = {}): Unit.Domain.Role.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();
        const config = this.config({
            values: {
                MAX_ROLE_SUBTREE_SIZE_FOR_PURGE: props.subtreeLimit ?? 2,
            },
        });

        return {
            service: new RoleService(
                this.contract<Repositories.RoleClosure.PublicContract>(repositories.roleClosures),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
                this.contract<Repositories.Role.PublicContract>(repositories.roles),
                config,
            ),
            repositories,
            transaction,
        };
    }
}
