import { jest } from "@jest/globals";

import { RoleDelegationPolicyQueries } from "~context/application/queries/role-delegation-policy.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleDelegationPolicyQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.RoleDelegationPolicyQueries.Contract
{
    public queries(): Unit.Application.RoleDelegationPolicyQueries.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.RoleDelegationPolicy.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.RoleDelegationPolicy.QueryContract["findMany"]>(),
        };

        return {
            queries: new RoleDelegationPolicyQueries(
                this.contract<Repositories.RoleDelegationPolicy.QueryContract>(repository),
            ),
            repository,
        };
    }
}
