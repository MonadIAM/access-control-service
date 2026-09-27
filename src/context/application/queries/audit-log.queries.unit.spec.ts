import { describe, expect, it } from "@jest/globals";

import { AuditLogQueriesUnitHelpers } from "~testing/unit/query-services/audit-log.helpers";
import { QueryMode } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new AuditLogQueriesUnitHelpers();
const ID = "requested-entity";
const REALM = "realm-a";

describe("AuditLogQueries", () => {
    describe("findUnique", () => {
        it("scopes a single entity lookup to the requested identity and realm", async () => {
            const { queries, repository } = helpers.queries();
            const entity = helpers.createAuditLog();
            repository.findUniqueOrThrow.mockResolvedValue(entity);

            await expect(queries.findUnique({ log: ID, realm: REALM, mode: QueryMode.DEFAULT })).resolves.toBe(entity);

            expect(repository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID, realm: REALM } }),
            );
        });
    });

    describe("findMany", () => {
        it("keeps the list within its scope and preserves the repository page", async () => {
            const { queries, repository } = helpers.queries();
            const page: [SystemEntities.AuditLog[], number] = [[helpers.createAuditLog()], 31];
            repository.findMany.mockResolvedValue(page);

            await expect(
                queries.findMany({ mode: QueryMode.DEFAULT, realm: REALM, pagination: PAGINATION, filters: {}, sort: {} }),
            ).resolves.toBe(page);

            expect(repository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ prefilter: { realm: REALM }, pagination: PAGINATION }),
            );
        });
    });

    describe("findUnique / findMany", () => {
        it("allows management queries across realms for both single logs and lists", async () => {
            const { queries, repository } = helpers.queries();
            repository.findMany.mockResolvedValue([[], 0]);
            repository.findUniqueOrThrow.mockResolvedValue(helpers.createAuditLog());

            await queries.findUnique({ mode: QueryMode.MANAGE, log: ID });
            await queries.findMany({ mode: QueryMode.MANAGE, pagination: PAGINATION, filters: {}, sort: {} });

            expect(repository.findUniqueOrThrow.mock.calls).toEqual([[{ where: { id: ID } }]]);
            expect(repository.findMany).toHaveBeenCalledWith(expect.objectContaining({ prefilter: {} }));
        });
    });
});
