import { jest } from "@jest/globals";

import { RoleConflictMemberQueries } from "~context/application/queries/role-conflict-member.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleConflictMemberQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Queries.RoleConflictMember.Contract
{
    public queries(): Unit.Queries.RoleConflictMember.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.RoleConflictMember.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.RoleConflictMember.QueryContract["findMany"]>(),
        };

        return {
            queries: new RoleConflictMemberQueries(
                this.contract<Repositories.RoleConflictMember.QueryContract>(repository),
            ),
            repository,
        };
    }
}
