import { PermissionOverrideService } from "~context/domain/services/permission-override.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class PermissionOverrideUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.PermissionOverride.Contract
{
    public service(
        props: Unit.Domain.PermissionOverride.Service.Props = {},
    ): Unit.Domain.PermissionOverride.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new PermissionOverrideService(
                this.contract<Repositories.PermissionOverride.PublicContract>(repositories.permissionOverrides),
                this.contract<Repositories.Permission.PublicContract>(repositories.permissions),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
            ),
            repositories,
            transaction,
        };
    }
}
