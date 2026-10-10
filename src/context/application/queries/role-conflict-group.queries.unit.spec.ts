import { describe, expect, it } from "@jest/globals";

import { RoleConflictGroupQueriesUnitHelpers } from "~testing/unit/query-services/role-conflict-group.helpers";
import { ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new RoleConflictGroupQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("[Queries] - RoleConflictGroup", () => {
    describe("[Method] - findUnique", () => {
        it("[case] - scopes a single entity lookup to the requested identity and realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const entity = helpers.createRoleConflictGroup();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            // Act
            const result = await queries.findUnique({ group: ID, realm: REALM, view: ResponseViewType.DETAILED });

            // Assert
            expect(result).toBe(entity);
            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, realm: REALM } }),
            );
        });
    });

    describe("[Method] - findMany", () => {
        it("[case] - keeps the list within its scope and preserves the repository page", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            const page: [Entities.RoleConflictGroup[], number] = [[helpers.createRoleConflictGroup()], 31];
            repository.findMany.mockResolvedValue(page);

            // Act
            const result = await queries.findMany({
                realm: REALM,
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                filters: {},
                sort: {},
            });

            // Assert
            expect(result).toBe(page);
            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
            );
        });
    });

    describe("[Method] - findGroupsViolatedByAccount", () => {
        it("[case] - evaluates proposed roles against the target account within its realm", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.findGroupsViolatedByAccount.mockResolvedValue([]);

            // Act
            await queries.findGroupsViolatedByAccount({ realm: REALM, account: "target", roles: [ID] });

            // Assert
            expect(repository.findGroupsViolatedByAccount).toHaveBeenCalledWith({
                realm: REALM,
                account: "target",
                roles: [ID],
            });
        });
    });

    describe("[Method] - findAccountsViolatingRule", () => {
        it("[case] - maps a proposed rule's roles and threshold to the conflict lookup", async () => {
            // Arrange
            const { queries, repository } = helpers.queries();
            repository.findAccountsViolatingRule.mockResolvedValue([]);

            // Act
            await queries.findAccountsViolatingRule({ realm: REALM, roles: [ID, "second-role"], maxAllowed: 1 });

            // Assert
            expect(repository.findAccountsViolatingRule).toHaveBeenCalledWith({
                realm: REALM,
                identifiers: [ID, "second-role"],
                maxAllowed: 1,
            });
        });
    });
});
