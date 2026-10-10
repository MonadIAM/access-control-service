import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { isObject } from "class-validator";

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
    props.repositories.roles.findUniqueOrThrow.mockImplementation((input) => {
        return Promise.resolve(
            isObject(input.where) && "id" in input.where && input.where.id === TARGET_PARENT_ROLE_ID
                ? targetParent
                : target,
        );
    });
    props.repositories.roles.getDescendants.mockImplementation((input) => {
        return Promise.resolve(input.ancestor === ROLE_ID ? (props.directChildren ?? []) : (props.displacedChildren ?? []));
    });
    props.repositories.roleClosures.existsTransitivePath.mockImplementation(() => {
        return Promise.resolve(props.wouldFormCycle ?? false);
    });
}

describe("[DomainService] - Role", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - throws when parent role has no inheritance", async () => {
            // Arrange
            const parent = createAtomicRole({ id: PARENT_ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [parent],
            });

            // Act
            const result = service.create(createCreateProps(transaction.entityManager));

            // Assert
            await expect(result).rejects.toThrow("services.role.CREATE_PARENT_NO_INHERITANCE");
            expect(repositories.roles.findUniqueOrThrow.mock.calls).toContainEqual([
                {
                    where: { id: PARENT_ROLE_ID, realm: REALM_ID },
                    transaction: transaction.entityManager,
                },
            ]);
            expect(repositories.roles.wouldExceedRoleLimit).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - throws when the realm role limit would be exceeded", async () => {
            // Arrange
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [parent],
            });
            repositories.roles.wouldExceedRoleLimit.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create(createCreateProps(transaction.entityManager));

            // Assert
            await expect(result).rejects.toThrow("services.role.REALM_ROLE_LIMIT_EXCEEDED");
            expect(repositories.roles.wouldExceedRoleLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - creates a role, flushes it, builds hierarchy, and returns the created role with parent", async () => {
            // Arrange
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [parent],
            });

            // Act
            const result = await service.create(
                createCreateProps(transaction.entityManager, { description: "Created for tests" }),
            );

            // Assert
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

    describe("[Method] - buildHierarchy", () => {
        it("[case] - inserts the base path when there are no children", async () => {
            // Arrange
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const role = createAtomicRole({ realm: parent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [role],
            });

            // Act
            await service.buildHierarchy({
                input: { entity: role, parent, realm: REALM_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(repositories.roleClosures.insertNewHierarchy).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                ancestor: PARENT_ROLE_ID,
                descendant: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roles.getDescendants).not.toHaveBeenCalled();
            expect(repositories.roleClosures.moveSubtrees).not.toHaveBeenCalled();
        });

        it("[case] - moves direct children from the parent under the new role", async () => {
            // Arrange
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            const role = createAtomicRole({ realm: parent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [role],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([child]));

            // Act
            await service.buildHierarchy({
                transaction: transaction.entityManager,
                input: { entity: role, parent, realm: REALM_ID, children: [CHILD_ROLE_ID] },
            });

            // Assert
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

        it("[case] - throws when a requested child is not a direct descendant of the parent", async () => {
            // Arrange
            const parent = createCompositeRole({ id: PARENT_ROLE_ID });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            const role = createAtomicRole({ realm: parent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: parent.realm,
                roles: [role],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([child]));

            // Act
            const result = service.buildHierarchy({
                transaction: transaction.entityManager,
                input: {
                    children: [DISPLACED_ROLE_ID],
                    realm: REALM_ID,
                    entity: role,
                    parent,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.role.CREATE_CHILD_NOT_DIRECT_DESCENDANT");
            expect(repositories.roleClosures.moveSubtrees).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - update", () => {
        it("[case] - finds a role in the realm and applies the patch", async () => {
            // Arrange
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: role.realm,
                roles: [role],
            });
            const updateSpy = jest.spyOn(role, "update");

            // Act
            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Role" },
                realm: REALM_ID,
                id: ROLE_ID,
            });

            // Assert
            expect(repositories.roles.findUniqueOrThrow.mock.calls).toContainEqual([
                {
                    where: { id: ROLE_ID, realm: REALM_ID },
                    transaction: transaction.entityManager,
                },
            ]);
            expect(updateSpy).toHaveBeenCalledWith({ patch: { name: "Updated Role" } });
        });
    });

    describe("[Method] - move", () => {
        it("[case] - throws when the target parent has no inheritance", async () => {
            // Arrange
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({
                targetParent: createCompositeRole({ id: TARGET_PARENT_ROLE_ID, archetype: RoleArchetype.ATOMIC }),
                repositories,
                target: role,
            });

            // Act
            const result = service.move(createMoveProps(transaction.entityManager));

            // Assert
            await expect(result).rejects.toThrow("services.role.REPARENT_TARGET_NO_INHERITANCE");
            expect(repositories.roles.getAncestors).not.toHaveBeenCalled();
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("[case] - throws when the target parent is the target itself", async () => {
            // Arrange
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({
                targetParent: createCompositeRole({ id: ROLE_ID }),
                repositories,
                target: role,
            });

            // Act
            const result = service.move(createMoveProps(transaction.entityManager));

            // Assert
            await expect(result).rejects.toThrow("services.role.REPARENT_TARGET_IS_SELF");
            expect(repositories.roleClosures.existsTransitivePath).not.toHaveBeenCalled();
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("[case] - throws when the target has no current parent", async () => {
            // Arrange
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({ repositories, target: role, currentParent: null });

            // Act
            const result = service.move(createMoveProps(transaction.entityManager));

            // Assert
            await expect(result).rejects.toThrow("services.role.REPARENT_ROOT_NOT_ALLOWED");
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("[case] - throws for a non-linear move to the current parent", async () => {
            // Arrange
            const targetParent = createCompositeRole({ id: TARGET_PARENT_ROLE_ID });
            const role = createAtomicRole({ realm: targetParent.realm });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: targetParent.realm,
                roles: [role],
            });
            mockMoveRoles({ repositories, target: role, targetParent, currentParent: targetParent });

            // Act
            const result = service.move(createMoveProps(transaction.entityManager));

            // Assert
            await expect(result).rejects.toThrow("services.role.REPARENT_TARGET_ALREADY_PARENT");
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("[case] - throws for subtree moves into the target subtree", async () => {
            // Arrange
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            mockMoveRoles({ repositories, target: role, wouldFormCycle: true });

            // Act
            const result = service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.SUBTREE }));

            // Assert
            await expect(result).rejects.toThrow("services.role.REPARENT_TARGET_IN_SUBTREE");
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });

        it("[case] - moves direct target children to the current parent before a parallel move", async () => {
            // Arrange
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            mockMoveRoles({ repositories, target: role, directChildren: [child] });

            // Act
            const result = await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.PARALLEL }));

            // Assert
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

        it("[case] - moves displaced target-parent children under the target before a linear move", async () => {
            // Arrange
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

            // Act
            await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.LINEAR }));

            // Assert
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

        it("[case] - allows a parallel move into the target subtree because direct children are detached first", async () => {
            // Arrange
            const role = createAtomicRole();
            const { service, repositories, transaction } = createRoleServiceContext({ realm: role.realm, roles: [role] });
            const child = createCompositeRole({ id: CHILD_ROLE_ID });
            mockMoveRoles({ repositories, target: role, directChildren: [child], wouldFormCycle: true });

            // Act
            const result = await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.PARALLEL }));

            // Assert
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

        it("[case] - allows a linear move into the target subtree because direct children are detached first", async () => {
            // Arrange
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

            // Act
            const result = await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.LINEAR }));

            // Assert
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

        it("[case] - allows a linear move to the current parent and moves siblings under the target", async () => {
            // Arrange
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

            // Act
            await service.move(createMoveProps(transaction.entityManager, { mode: MoveMode.LINEAR }));

            // Assert
            expect(repositories.roleClosures.moveSubtrees).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                oldParent: TARGET_PARENT_ROLE_ID,
                children: [DISPLACED_ROLE_ID],
                newParent: ROLE_ID,
                realm: REALM_ID,
            });
            expect(repositories.roleClosures.move).toHaveBeenCalledTimes(1);
        });

        it("[case] - searches the target with isSystemManaged false and propagates not-found", async () => {
            // Arrange
            const { service, repositories, transaction } = createRoleServiceContext();
            repositories.roles.findUniqueOrThrow.mockImplementation(({ where }) => {
                return typeof where === "object" && "isSystemManaged" in where && where.isSystemManaged === false
                    ? Promise.reject(new Error("role not found"))
                    : Promise.resolve(createAtomicRole());
            });

            // Act
            const result = service.move(createMoveProps(transaction.entityManager));

            // Assert
            await expect(result).rejects.toThrow("role not found");
            expect(repositories.roles.findUniqueOrThrow.mock.calls).toContainEqual([
                {
                    where: { id: ROLE_ID, realm: REALM_ID, isSystemManaged: false },
                    transaction: transaction.entityManager,
                },
            ]);
            expect(repositories.roleClosures.move).not.toHaveBeenCalled();
        });
    });

    describe("[Behavior] - revocation", () => {
        it.each([
            { method: "revoke", isRevoked: false, archetype: RoleArchetype.ATOMIC },
            { method: "restore", isRevoked: true, archetype: RoleArchetype.COMPOSITE },
        ] as const)("[case] - processes and returns the batch ($method)", async ({ method, isRevoked, archetype }) => {
            // Arrange
            const role = createAtomicRole({ archetype, isRevoked });
            const secondRole = createCompositeRole({ id: TARGET_PARENT_ROLE_ID, isRevoked });
            const { service, repositories, transaction } = createRoleServiceContext({
                roles: [role, secondRole],
                realm: role.realm,
            });
            repositories.roles.find.mockImplementation(() => Promise.resolve([role, secondRole]));
            const firstOperationSpy = jest.spyOn(role, method);
            const secondOperationSpy = jest.spyOn(secondRole, method);

            // Act
            const result = await service[method]({
                identifiers: [ROLE_ID, TARGET_PARENT_ROLE_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [ROLE_ID, TARGET_PARENT_ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(firstOperationSpy).toHaveBeenCalledTimes(1);
            expect(secondOperationSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([role, secondRole]);
        });
    });

    describe("[Behavior] - bulk identifiers", () => {
        it.each([
            { method: "revoke", isRevoked: false, archetype: RoleArchetype.ATOMIC },
            { method: "restore", isRevoked: true, archetype: RoleArchetype.COMPOSITE },
        ] as const)("[case] - deduplicates repository lookup ($method)", async ({ method, isRevoked, archetype }) => {
            // Arrange
            const role = helpers.createRole({ id: ROLE_ID, archetype, isRevoked });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: role.realm,
                roles: [role],
            });
            repositories.roles.find.mockImplementation(() => Promise.resolve([role]));

            // Act
            const result = await service[method]({
                transaction: transaction.entityManager,
                identifiers: [ROLE_ID, ROLE_ID],
                realm: REALM_ID,
            });

            // Assert
            expect(result).toEqual([role]);
            expect(repositories.roles.find).toHaveBeenCalledWith({
                where: { id: { $in: [ROLE_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - checks purge eligibility, decreases closure depth, removes, and returns the role", async () => {
            // Arrange
            const role = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: role.realm,
                roles: [role],
            });
            const canPurgeSpy = jest.spyOn(role, "canPurge");

            // Act
            const result = await service.purge({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            // Assert
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

        it("[case] - does not decrease closure depth or remove when purge eligibility fails", async () => {
            // Arrange
            const role = createCompositeRole({ id: ROLE_ID });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: role.realm,
                roles: [role],
            });

            // Act
            const result = service.purge({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            // Assert
            await expect(result).rejects.toThrow("entities.role.CANNOT_PURGE_ACTIVE");
            expect(transaction.clear).not.toHaveBeenCalled();
            expect(repositories.roleClosures.decreaseTransitiveDepth).not.toHaveBeenCalled();
            expect(transaction.remove).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - purgeSubtree", () => {
        it("[case] - throws when descendants exceed the configured subtree purge limit", async () => {
            // Arrange
            const root = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const first = createCompositeRole({ id: CHILD_ROLE_ID, isRevoked: true });
            const second = createCompositeRole({ id: DISPLACED_ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: root.realm,
                subtreeLimit: 1,
                roles: [root],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([root, first, second]));

            // Act
            const result = service.purgeSubtree({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            // Assert
            await expect(result).rejects.toThrow("services.role.SUBTREE_SIZE_LIMIT_EXCEEDED");
            expect(transaction.clear).not.toHaveBeenCalled();
            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("[case] - checks purge eligibility, removes descendants, and returns descendants with the root", async () => {
            // Arrange
            const root = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const child = createCompositeRole({ id: CHILD_ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: root.realm,
                roles: [root],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([root, child]));
            const rootCanPurgeSpy = jest.spyOn(root, "canPurge");
            const childCanPurgeSpy = jest.spyOn(child, "canPurge");

            // Act
            const result = await service.purgeSubtree({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            // Assert
            expect(rootCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(childCanPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenNthCalledWith(1, root);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, child);
            expect(result).toEqual({ entities: [root, child], root });
        });

        it("[case] - fetches descendants without depth, so the root participates in the limit and removal set", async () => {
            // Arrange
            const root = createCompositeRole({ id: ROLE_ID, isRevoked: true });
            const child = createCompositeRole({ id: CHILD_ROLE_ID, isRevoked: true });
            const { service, repositories, transaction } = createRoleServiceContext({
                realm: root.realm,
                subtreeLimit: 2,
                roles: [root],
            });
            repositories.roles.getDescendants.mockImplementation(() => Promise.resolve([root, child]));

            // Act
            await service.purgeSubtree({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: ROLE_ID,
            });

            // Assert
            expect(repositories.roles.getDescendants.mock.calls).toContainEqual([
                {
                    transaction: transaction.entityManager,
                    where: { realm: REALM_ID },
                    ancestor: ROLE_ID,
                },
            ]);
            expect(transaction.remove).toHaveBeenCalledWith(root);
        });
    });
});
