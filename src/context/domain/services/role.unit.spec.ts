import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { RoleUnitHelpers } from "~testing/unit/domain-service/role.helpers";
import { MoveMode, RoleActorType, RoleArchetype } from "~context/enums";

/* eslint-disable prettier/prettier */
const REALM_ID              = "00000000-0000-4000-8000-200000000001";
const ROLE_ID               = "00000000-0000-4000-8000-200000000002";
const PARENT_ROLE_ID        = "00000000-0000-4000-8000-200000000003";
const TARGET_PARENT_ROLE_ID = "00000000-0000-4000-8000-200000000004";
const CHILD_ROLE_ID         = "00000000-0000-4000-8000-200000000005";
const DISPLACED_ROLE_ID     = "00000000-0000-4000-8000-200000000006";
/* eslint-enable prettier/prettier */

const MOVE_STEP = {
    upsertedPaths: [],
    removedPaths: [],
};

const helpers = new RoleUnitHelpers();

function createRealm(): Entities.Realm {
    return helpers.createRealm({ id: REALM_ID });
}

function createAtomicRole(props: Partial<Entities.Role.Contract> = {}): Entities.Role {
    return helpers.createRole({
        realm: createRealm(),
        id: ROLE_ID,
        ...props,
    });
}

function createCompositeRole(props: Partial<Entities.Role.Contract> = {}): Entities.Role {
    return helpers.createRole({
        archetype: RoleArchetype.COMPOSITE,
        realm: createRealm(),
        id: ROLE_ID,
        ...props,
    });
}

function createRoleServiceContext(props: Unit.Domain.Role.Service.Props = {}): Unit.Domain.Role.Service.Result {
    const realm = props.realm ?? createRealm();
    const roles = props.roles ?? [createAtomicRole({ realm })];

    return helpers.service({
        subtreeLimit: props.subtreeLimit,
        realm,
        roles,
    });
}

function createCreateProps(
    transaction: ORM.EntityManager,
    overrides: Partial<Services.Role.Create.Props["input"]> = {},
): Services.Role.Create.Props {
    return {
        realm: REALM_ID,
        transaction,
        input: {
            archetype: RoleArchetype.ATOMIC,
            actorType: RoleActorType.HUMAN,
            parent: PARENT_ROLE_ID,
            code: "role.created",
            name: "Created Role",
            ...overrides,
        },
    };
}

function createMoveProps(
    transaction: ORM.EntityManager,
    overrides: Partial<Omit<Services.Role.Move.Props, "transaction" | "realm">> = {},
): Services.Role.Move.Props {
    return {
        targetParent: TARGET_PARENT_ROLE_ID,
        mode: MoveMode.PARALLEL,
        target: ROLE_ID,
        realm: REALM_ID,
        transaction,
        ...overrides,
    };
}

function mockMoveRoles(props: {
    repositories: Unit.Domain.RepositoryMocks.Contract;
    currentParent?: Nullable<Entities.Role>;
    displacedChildren?: Entities.Role[];
    directChildren?: Entities.Role[];
    targetParent?: Entities.Role;
    wouldFormCycle?: boolean;
    target?: Entities.Role;
}): void {
    const target = props.target ?? createCompositeRole({ id: ROLE_ID });
    const targetParent = props.targetParent ?? createCompositeRole({ id: TARGET_PARENT_ROLE_ID });
    const currentParent =
        props.currentParent === undefined ? createCompositeRole({ id: PARENT_ROLE_ID }) : props.currentParent;

    props.repositories.roles.getAncestors.mockImplementation(() => Promise.resolve(currentParent ? [currentParent] : []));
    props.repositories.roleClosures.moveSubtrees.mockImplementation(() => Promise.resolve(MOVE_STEP));
    props.repositories.roleClosures.move.mockImplementation(() => Promise.resolve(MOVE_STEP));
    props.repositories.roles.getDescendants.mockImplementation((input: { ancestor: string }) => {
        return Promise.resolve(input.ancestor === ROLE_ID ? (props.directChildren ?? []) : (props.displacedChildren ?? []));
    });
    props.repositories.roles.findUniqueOrThrow.mockImplementation((input: { where: { id: string } }) => {
        return Promise.resolve(input.where.id === TARGET_PARENT_ROLE_ID ? targetParent : target);
    });
    props.repositories.roleClosures.existsTransitivePath.mockImplementation(() => {
        return Promise.resolve(props.wouldFormCycle ?? false);
    });
}

describe("RoleService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when parent role has no inheritance", async () => {
            const parent = createAtomicRole({ id: PARENT_ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [parent],
            });

            await expect(service.create(createCreateProps(transaction.entityManager))).rejects.toThrow(
                "services.role.CREATE_PARENT_NO_INHERITANCE",
            );

            expect(repositories.roles.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: PARENT_ROLE_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.roles.wouldExceedRoleLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when the realm role limit would be exceeded", async () => {
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [parent],
            });
            repositories.roles.wouldExceedRoleLimit.mockImplementation(() => Promise.resolve(true));

            await expect(service.create(createCreateProps(transaction.entityManager))).rejects.toThrow(
                "services.role.REALM_ROLE_LIMIT_EXCEEDED",
            );

            expect(repositories.roles.wouldExceedRoleLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates a role, flushes it, builds hierarchy, and returns the created role with parent", async () => {
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [parent],
            });

            const result = await service.create(
                createCreateProps(transaction.entityManager, { description: "Created for tests" }),
            );

            expect(result.parent).toBe(parent);
            expect(result.entity).toEqual(
                expect.objectContaining({
                    description: "Created for tests",
                    archetype: RoleArchetype.ATOMIC,
                    actorType: RoleActorType.HUMAN,
                    code: "role.created",
                    name: "Created Role",
                    realm: parent.realm,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result.entity);
            expect(transaction.flush).toHaveBeenCalledTimes(1);
            expect(repositories.roleClosures.insertNewHierarchy).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                descendant: result.entity.id,
                ancestor: PARENT_ROLE_ID,
                realm: REALM_ID,
            });
        });
    });

    describe("buildHierarchy", () => {
        it("always inserts the base hierarchy path when there are no children", async () => {
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const role = createAtomicRole({ realm: parent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [role],
            });

            await service.buildHierarchy({
                input: { entity: role, parent, realm: REALM_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.roleClosures.insertNewHierarchy).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                ancestor: PARENT_ROLE_ID,
                descendant: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roles.getDescendants).not.toHaveBeenCalled();
            expect(repositories.roleClosures.moveSubtrees).not.toHaveBeenCalled();
        });

        it("moves direct children from the parent under the new role", async () => {
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            const role = createAtomicRole({ realm: parent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [role],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([child]));

            await service.buildHierarchy({
                transaction: transaction.entityManager,
                input: { entity: role, parent, realm: REALM_ID, children: [CHILD_ROLE_ID] },
            });

            expect(repositories.roles.getDescendants).toHaveBeenCalledWith({
                ancestor: PARENT_ROLE_ID,
                transaction: transaction.entityManager,
                depth: 1,
            });
            expect(repositories.roleClosures.moveSubtrees).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                oldParent: PARENT_ROLE_ID,
                children: [CHILD_ROLE_ID],
                newParent: ROLE_ID,
                realm: REALM_ID,
            });
        });

        it("throws when a requested child is not a direct descendant of the parent", async () => {
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            const role = createAtomicRole({ realm: parent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [role],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([child]));

            await expect(
                service.buildHierarchy({
                    transaction: transaction.entityManager,
                    input: {
                        children: [DISPLACED_ROLE_ID],
                        realm: REALM_ID,
                        entity: role,
                        parent,
                    },
                }),
            ).rejects.toThrow("services.role.CREATE_CHILD_NOT_DIRECT_DESCENDANT");

            expect(repositories.roleClosures.moveSubtrees).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("finds a role in the realm and applies the patch", async () => {
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: role.realm,
                roles: [role],
            });
            const updateSpy = jest.spyOn(role, "update");

            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Role" },
                realm: REALM_ID,
                id: ROLE_ID,
            });

            expect(repositories.roles.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: ROLE_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(updateSpy).toHaveBeenCalledWith({ patch: { name: "Updated Role" } });
        });
    });

    describe("move", () => {
        it("throws when the target parent has no inheritance", async () => {
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({
                targetParent: createCompositeRole({ id: TARGET_PARENT_ROLE_ID, archetype: RoleArchetype.ATOMIC }),
                repositories,
                target: role,
            });

            await expect(service.move(createMoveProps(transaction.entityManager))).rejects.toThrow(
                "services.role.REPARENT_TARGET_NO_INHERITANCE",
            );

            expect(repositories.roles.getAncestors).not.toHaveBeenCalled();
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("throws when the target parent is the target itself", async () => {
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({
                targetParent: createCompositeRole({ id: ROLE_ID }),
                repositories,
                target: role,
            });

            await expect(service.move(createMoveProps(transaction.entityManager))).rejects.toThrow(
                "services.role.REPARENT_TARGET_IS_SELF",
            );

            expect(repositories.roleClosures.existsTransitivePath).not.toHaveBeenCalled();
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("throws when the target has no current parent", async () => {
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({ repositories, target: role, currentParent: null });

            await expect(service.move(createMoveProps(transaction.entityManager))).rejects.toThrow(
                "services.role.REPARENT_ROOT_NOT_ALLOWED",
            );

            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("throws for a non-linear move to the current parent", async () => {
            const targetParent = createCompositeRole({ id: TARGET_PARENT_ROLE_ID });
            const role = createAtomicRole({ realm: targetParent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: targetParent.realm,
                roles: [role],
            });
            mockMoveRoles({ repositories, target: role, targetParent, currentParent: targetParent });

            await expect(service.move(createMoveProps(transaction.entityManager))).rejects.toThrow(
                "services.role.REPARENT_TARGET_ALREADY_PARENT",
            );

            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("throws for subtree moves into the target subtree", async () => {
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({ repositories, target: role, wouldFormCycle: true });

            await expect(
                service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.SUBTREE })),
            ).rejects.toThrow("services.role.REPARENT_TARGET_IN_SUBTREE");

            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("moves direct target children to the current parent before a parallel move", async () => {
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            mockMoveRoles({ repositories, target: role, directChildren: [child] });

            const result = await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.PARALLEL }));

            expect(repositories.roleClosures.moveSubtrees).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                children: [CHILD_ROLE_ID],
                newParent: PARENT_ROLE_ID,
                oldParent: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.move).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                newParent: TARGET_PARENT_ROLE_ID,
                target: ROLE_ID,
                realm: REALM_ID,
            });
            expect(result).toEqual({ steps: [MOVE_STEP, MOVE_STEP], target: role });
        });

        it("moves displaced target-parent children under the target before a linear move", async () => {
            const targetParent = createCompositeRole({ id: TARGET_PARENT_ROLE_ID });
            const role = createAtomicRole({ realm: targetParent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: targetParent.realm,
                roles: [role],
            });
            const displaced = createCompositeRole({ id: DISPLACED_ROLE_ID });
            mockMoveRoles({
                displacedChildren: [role, displaced],
                directChildren: [],
                repositories,
                targetParent,
                target: role,
            });

            await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.LINEAR }));

            expect(repositories.roleClosures.moveSubtrees).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                oldParent: TARGET_PARENT_ROLE_ID,
                children: [DISPLACED_ROLE_ID],
                newParent: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.move).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                newParent: TARGET_PARENT_ROLE_ID,
                target: ROLE_ID,
                realm: REALM_ID,
            });
        });

        it("allows a parallel move into the target subtree because direct children are detached first", async () => {
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            mockMoveRoles({ repositories, target: role, directChildren: [child], wouldFormCycle: true });

            const result = await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.PARALLEL }));

            expect(repositories.roleClosures.existsTransitivePath).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                descendant: TARGET_PARENT_ROLE_ID,
                ancestor: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.moveSubtrees).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                children: [CHILD_ROLE_ID],
                newParent: PARENT_ROLE_ID,
                oldParent: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.move).toHaveBeenCalledTimes(1);
            expect(result.target).toBe(role);
        });

        it("allows a linear move into the target subtree because direct children are detached first", async () => {
            const targetParent = createCompositeRole({ id: TARGET_PARENT_ROLE_ID });
            const role = createAtomicRole({ realm: targetParent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: targetParent.realm,
                roles: [role],
            });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            const displaced = createCompositeRole({ id: DISPLACED_ROLE_ID });
            mockMoveRoles({
                displacedChildren: [displaced],
                directChildren: [child],
                wouldFormCycle: true,
                repositories,
                targetParent,
                target: role,
            });

            const result = await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.LINEAR }));

            expect(repositories.roleClosures.moveSubtrees).toHaveBeenNthCalledWith(1, {
                transaction: transaction.entityManager,
                newParent: PARENT_ROLE_ID,
                children: [CHILD_ROLE_ID],
                oldParent: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.moveSubtrees).toHaveBeenNthCalledWith(2, {
                transaction: transaction.entityManager,
                oldParent: TARGET_PARENT_ROLE_ID,
                children: [DISPLACED_ROLE_ID],
                newParent: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.move).toHaveBeenCalledTimes(1);
            expect(result.target).toBe(role);
        });

        it("allows a linear move to the current parent and moves siblings under the target", async () => {
            const targetParent = createCompositeRole({ id: TARGET_PARENT_ROLE_ID });
            const sibling = createCompositeRole({ id: DISPLACED_ROLE_ID });
            const role = createAtomicRole({ realm: targetParent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: targetParent.realm,
                roles: [role],
            });
            mockMoveRoles({
                displacedChildren: [role, sibling],
                currentParent: targetParent,
                repositories,
                targetParent,
                target: role,
            });

            await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.LINEAR }));

            expect(repositories.roleClosures.moveSubtrees).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                oldParent: TARGET_PARENT_ROLE_ID,
                children: [DISPLACED_ROLE_ID],
                newParent: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.move).toHaveBeenCalledTimes(1);
        });

        it("searches the target with isSystemManaged false and propagates not-found", async () => {
            const { service, repositories, transaction } = createRoleServiceContext();
            repositories.roles.findUniqueOrThrow.mockImplementation(
                ({ where }: { where: { id: string; isSystemManaged?: boolean } }) => {
                    return where.isSystemManaged === false
                        ? Promise.reject(new Error("role not found"))
                        : Promise.resolve();
                },
            );

            await expect(service.move(createMoveProps(transaction.entityManager))).rejects.toThrow("role not found");

            expect(repositories.roles.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: ROLE_ID, realm: REALM_ID, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });
    });

    describe("revoke", () => {
        it("revokes found roles and returns them", async () => {
            const role = createAtomicRole();
            const secondRole = createCompositeRole({ id: TARGET_PARENT_ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                roles: [role, secondRole],
                realm: role.realm,
            });
            repositories.roles.find.mockImplementation(() => Promise.resolve([role, secondRole]));
            const firstRevokeSpy = jest.spyOn(role, "revoke");
            const secondRevokeSpy = jest.spyOn(secondRole, "revoke");

            const result = await service.revoke({
                identifiers: [ROLE_ID, TARGET_PARENT_ROLE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [ROLE_ID, TARGET_PARENT_ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstRevokeSpy).toHaveBeenCalledTimes(1);
            expect(secondRevokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([role, secondRole]);
        });
    });

    describe("restore", () => {
        it("restores found roles and returns them", async () => {
            const role = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const secondRole = createCompositeRole({ id: TARGET_PARENT_ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                roles: [role, secondRole],
                realm: role.realm,
            });
            repositories.roles.find.mockImplementation(() => Promise.resolve([role, secondRole]));
            const firstRestoreSpy = jest.spyOn(role, "restore");
            const secondRestoreSpy = jest.spyOn(secondRole, "restore");

            const result = await service.restore({
                identifiers: [ROLE_ID, TARGET_PARENT_ROLE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [ROLE_ID, TARGET_PARENT_ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstRestoreSpy).toHaveBeenCalledTimes(1);
            expect(secondRestoreSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([role, secondRole]);
        });
    });

    describe("bulk identifiers", () => {
        it.each([
            {
                name: "bulk identifiers: RoleService.revoke deduplicates repository lookup",
                run: async () => {
                    const role = createAtomicRole({ id: ROLE_ID });
                    const { service, repositories, transaction } = createRoleServiceContext({
                        realm: role.realm,
                        roles: [role],
                    });
                    repositories.roles.find.mockImplementation(() => Promise.resolve([role]));

                    await expect(
                        service.revoke({
                            transaction: transaction.entityManager,
                            identifiers: [ROLE_ID, ROLE_ID],
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([role]);

                    expect(repositories.roles.find).toHaveBeenCalledWith({
                        where: { id: { $in: [ROLE_ID] }, realm: REALM_ID },
                        transaction: transaction.entityManager,
                    });
                },
            },
            {
                name: "bulk identifiers: RoleService.restore deduplicates repository lookup",
                run: async () => {
                    const role = createCompositeRole({ id: ROLE_ID, isRevoked: true });
                    const { service, repositories, transaction } = createRoleServiceContext({
                        realm: role.realm,
                        roles: [role],
                    });
                    repositories.roles.find.mockImplementation(() => Promise.resolve([role]));

                    await expect(
                        service.restore({
                            transaction: transaction.entityManager,
                            identifiers: [ROLE_ID, ROLE_ID],
                            realm: REALM_ID,
                        }),
                    ).resolves.toEqual([role]);

                    expect(repositories.roles.find).toHaveBeenCalledWith({
                        where: { id: { $in: [ROLE_ID] }, realm: REALM_ID },
                        transaction: transaction.entityManager,
                    });
                },
            },
        ])("$name", async ({ run }) => {
            await run();
        });
    });

    describe("purge", () => {
        it("checks purge eligibility, decreases closure depth, removes, and returns the role", async () => {
            const role = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: role.realm,
                roles: [role],
            });
            const canPurgeSpy = jest.spyOn(role, "canPurge");

            const result = await service.purge({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            expect(canPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.clear).not.toHaveBeenCalled();
            expect(repositories.roleClosures.decreaseTransitiveDepth).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                role: ROLE_ID,
            });
            expect(transaction.remove).toHaveBeenCalledWith(role);
            expect(result).toBe(role);
        });

        it("does not decrease closure depth or remove when purge eligibility fails", async () => {
            const role = createCompositeRole({ id: ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: role.realm,
                roles: [role],
            });

            await expect(
                service.purge({
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                    id: ROLE_ID,
                }),
            ).rejects.toThrow("entities.role.CANNOT_PURGE_ACTIVE");

            expect(transaction.clear).not.toHaveBeenCalled();
            expect(repositories.roleClosures.decreaseTransitiveDepth).not.toHaveBeenCalled();
            expect(transaction.remove).not.toHaveBeenCalled();
        });
    });

    describe("purgeSubtree", () => {
        it("throws when descendants exceed the configured subtree purge limit", async () => {
            const root = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const first = createCompositeRole({ id: CHILD_ROLE_ID, isRevoked: true });
            const second = createCompositeRole({ id: DISPLACED_ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: root.realm,
                subtreeLimit: 1,
                roles: [root],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([root, first, second]));

            await expect(
                service.purgeSubtree({
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                    id: ROLE_ID,
                }),
            ).rejects.toThrow("services.role.SUBTREE_SIZE_LIMIT_EXCEEDED");

            expect(transaction.clear).not.toHaveBeenCalled();
            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("checks purge eligibility, removes descendants, and returns descendants with the root", async () => {
            const root = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const child = createCompositeRole({ id: CHILD_ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: root.realm,
                roles: [root],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([root, child]));
            const rootCanPurgeSpy = jest.spyOn(root, "canPurge");
            const childCanPurgeSpy = jest.spyOn(child, "canPurge");

            const result = await service.purgeSubtree({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            expect(rootCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(childCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenNthCalledWith(1, root);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, child);
            expect(result).toEqual({ entities: [root, child], root });
        });

        it("fetches descendants without depth, so the root participates in the limit and removal set", async () => {
            const root = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const child = createCompositeRole({ id: CHILD_ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: root.realm,
                subtreeLimit: 2,
                roles: [root],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([root, child]));

            await service.purgeSubtree({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            expect(repositories.roles.getDescendants).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { realm: REALM_ID },
                ancestor: ROLE_ID,
            });
            expect(transaction.remove).toHaveBeenCalledWith(root);
        });
    });
});
