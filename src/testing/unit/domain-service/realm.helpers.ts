import { RealmService } from "~context/domain/services/realm.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RealmUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Realm.Contract {
    public service(props: Unit.Domain.Realm.Service.Props = {}): Unit.Domain.Realm.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new RealmService(
                this.contract<Repositories.Permission.PublicContract>(repositories.permissions),
                this.contract<Repositories.Realm.PublicContract>(repositories.realms),
                this.contract<Repositories.AccountRoleAssignment.PublicContract>(repositories.accountRoleAssignments),
                this.contract<Repositories.PermissionOverride.PublicContract>(repositories.permissionOverrides),
                this.contract<Repositories.Role.PublicContract>(repositories.roles),
            ),
            repositories,
            transaction,
        };
    }
}
