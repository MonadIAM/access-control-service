import { ChangeLogService } from "~context/domain/services/change-log.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ChangeLogUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.ChangeLog.Contract {
    public service(): Unit.Domain.ChangeLog.Service.Result {
        const repositories = this.repositories();
        const transaction = this.transaction();

        return {
            service: new ChangeLogService(this.contract<Repositories.ChangeLog.PublicContract>(repositories.changeLogs)),
            repositories,
            transaction,
        };
    }
}
