import { describe, expect, it } from "@jest/globals";

import { RoleConflictGroupQueriesUnitHelpers } from "~testing/unit/query-services/role-conflict-group.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleConflictGroupQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("RoleConflictGroupQueries", () => {
    describe("findUnique", () => {
        it("scopes a single entity lookup to the requested identity and realm", async () => {
            const { queries, repository } = helpers.queries();
            const entity = helpers.createRoleConflictGroup();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            await expect(queries.findUnique({ group: ID, realm: REALM, view: ResponseViewType.DETAILED })).resolves.toBe(
                entity,
            );

            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, realm: REALM } }),
            );
        });
    });

    describe("findMany", () => {
        it("keeps the list within its scope and preserves the repository page", async () => {
            const { queries, repository } = helpers.queries();
            const page: [Entities.RoleConflictGroup[], number] = [[helpers.createRoleConflictGroup()], 31];
            repository.findMany.mockResolvedValue(page);

            await expect(
                queries.findMany({
                    realm: REALM,
                    view: ResponseViewType.COMPACT,
                    pagination: PAGINATION,
                    filters: {},
                    sort: {},
                }),
            ).resolves.toBe(page);

            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
            );
        });
    });

    describe("findGroupsViolatedByAccount", () => {
        it("evaluates proposed roles against the target account within its realm", async () => {
            const { queries, repository } = helpers.queries();
            repository.findGroupsViolatedByAccount.mockResolvedValue([]);

            await queries.findGroupsViolatedByAccount({ realm: REALM, account: "target", roles: [ID] });

            expect(repository.findGroupsViolatedByAccount).toHaveBeenCalledWith({
                realm: REALM,
                account: "target",
                roles: [ID],
            });
        });
    });

    describe("findAccountsViolatingRule", () => {
        it("maps a proposed rule's roles and threshold to the conflict lookup", async () => {
            const { queries, repository } = helpers.queries();
            repository.findAccountsViolatingRule.mockResolvedValue([]);

            await queries.findAccountsViolatingRule({ realm: REALM, roles: [ID, "second-role"], maxAllowed: 1 });

            expect(repository.findAccountsViolatingRule).toHaveBeenCalledWith({
                realm: REALM,
                identifiers: [ID, "second-role"],
                maxAllowed: 1,
            });
        });
    });
});
