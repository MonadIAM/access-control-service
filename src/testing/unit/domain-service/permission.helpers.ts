import { PermissionService } from "~context/domain/services/permission.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class PermissionUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Permission.Contract {
    public service(props: Unit.Domain.Permission.Service.Props = {}): Unit.Domain.Permission.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new PermissionService(
                this.contract<Repositories.Permission.PublicContract>(repositories.permissions),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
            ),
            repositories,
            transaction,
        };
    }
}
