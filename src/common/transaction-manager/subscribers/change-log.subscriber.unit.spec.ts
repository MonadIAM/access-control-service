import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { ChangeSetType } from "@mikro-orm/postgresql";

import { ChangeLogSubscriberUnitHelpers } from "~testing/unit/transaction-manager/change-log-subscriber.helpers";
import { ExternalChanges } from "~infrastructure/database/utils/external-changes";
import { ChangeLog, Outbox } from "~common/transaction-manager/entities";
import { DeltaChanges } from "~common/transaction-manager/value-objects";
import { KafkaTopic } from "~context/enums";

const helpers = new ChangeLogSubscriberUnitHelpers();

describe("[Subscriber] - ChangeLog", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - onFlush", () => {
        it("[case] - does nothing when operation context is absent", async () => {
            // Arrange
            const { subscriber } = helpers.subscriber();
            const transaction = helpers.transaction();
            const uow = helpers.uow({ changeSets: [helpers.changeSet()] });

            // Act
            await subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager }));

            // Assert
            expect(transaction.persist).not.toHaveBeenCalled();
            expect(uow.computeChangeSet).not.toHaveBeenCalled();
        });

        it("[case] - does nothing when change log is disabled", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const uow = helpers.uow({ changeSets: [helpers.changeSet()] });

            // Act
            await operationContext.run({ changeLogEnabled: false, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(transaction.persist).not.toHaveBeenCalled();
            expect(uow.computeChangeSet).not.toHaveBeenCalled();
        });

        it("[case] - does not log audit, change log and outbox changes", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const uow = helpers.uow({
                changeSets: [
                    helpers.changeSet({ className: "ChangeLog" }),
                    helpers.changeSet({ className: "AuditLog" }),
                    helpers.changeSet({ className: "Outbox" }),
                ],
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(transaction.persist).not.toHaveBeenCalled();
            expect(uow.computeChangeSet).not.toHaveBeenCalled();
        });

        it("[case] - does not persist empty deltas", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const uow = helpers.uow({ changeSets: [helpers.changeSet({ payload: {} })] });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(transaction.persist).not.toHaveBeenCalled();
            expect(uow.computeChangeSet).not.toHaveBeenCalled();
        });

        it("[case] - masks, signs, persists and computes the change log and archive outbox", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber, logMasking, outbox } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const changeSet = helpers.changeSet({
                originalEntity: { name: "Old Name" },
                payload: { name: "New Name" },
                className: "Role",
            });
            const uow = helpers.uow({ changeSets: [changeSet] });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            const changeLog = transaction.persist.mock.calls[0][0] as SystemEntities.ChangeLog;
            const outboxEntry = transaction.persist.mock.calls[1][0];

            // Assert
            expect(logMasking.maskChangeLog).toHaveBeenCalledWith({
                delta: { name: { old: "Old Name", new: "New Name" } },
            });
            expect(logMasking.sign).toHaveBeenCalledWith({ entity: changeLog });
            expect(changeLog).toEqual(
                expect.objectContaining({
                    entity: "00000000-0000-4000-8000-000000000001",
                    changeType: ChangeSetType.UPDATE,
                    auditEntry: "audit-entry",
                    signature: "signature",
                    entityType: "Role",
                    keyVersion: 1,
                }),
            );
            expect(outbox.buildChangeLogArchive).toHaveBeenCalledWith(changeLog);
            expect(outboxEntry).toBeInstanceOf(Outbox);
            expect(uow.computeChangeSet).toHaveBeenNthCalledWith(1, changeLog);
            expect(uow.computeChangeSet).toHaveBeenNthCalledWith(2, outboxEntry);
        });

        it("[case] - writes a change log entry for an externally recorded change set", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber, logMasking } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const uow = helpers.uow({ changeSets: [] });
            ExternalChanges.record({
                entityManager: transaction.entityManager,
                changes: [
                    helpers.changeSet({
                        primaryKey: "realm:ancestor:descendant",
                        type: ChangeSetType.CREATE,
                        className: "RoleClosure",
                        payload: { depth: 2 },
                    }),
                ],
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            const changeLog = transaction.persist.mock.calls[0][0] as SystemEntities.ChangeLog;

            // Assert
            expect(logMasking.maskChangeLog).toHaveBeenCalledWith({ delta: { depth: { old: null, new: 2 } } });
            expect(changeLog).toEqual(
                expect.objectContaining({
                    entity: "realm:ancestor:descendant",
                    changeType: ChangeSetType.CREATE,
                    entityType: "RoleClosure",
                    auditEntry: "audit-entry",
                }),
            );
        });

        it("[case] - drains an externally recorded change set exactly once", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const uow = helpers.uow({ changeSets: [] });
            ExternalChanges.record({
                entityManager: transaction.entityManager,
                changes: [helpers.changeSet({ primaryKey: "realm:ancestor:descendant", className: "RoleClosure" })],
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, async () => {
                await subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager }));
                await subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager }));
            });

            // Assert
            expect(transaction.persist).toHaveBeenCalledTimes(2);
        });

        it("[case] - uses masked delta in the persisted change log", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const maskedDelta = new DeltaChanges({
                token: {
                    old: { value: "****************", hash: "old-hash" },
                    new: { value: "****************", hash: "new-hash" },
                },
            });
            const logMasking = helpers.logMaskingContract({
                maskChangeLog: () => Promise.resolve(maskedDelta),
            });
            const { subscriber } = helpers.subscriber({ operationContext, logMasking });
            const transaction = helpers.transaction();
            const uow = helpers.uow({
                changeSets: [
                    helpers.changeSet({
                        originalEntity: { token: "old-token" },
                        payload: { token: "new-token" },
                    }),
                ],
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(transaction.persist.mock.calls[0][0]).toEqual(expect.objectContaining({ delta: maskedDelta }));
        });

        it("[case] - persists and computes signed change log before building archive outbox", async () => {
            // Arrange
            const callOrder = ["start"];
            callOrder.length = 0;
            const operationContext = helpers.operationContext();
            const logMasking = helpers.logMaskingContract({
                maskChangeLog: ({ delta }) => {
                    callOrder.push("maskChangeLog");
                    return Promise.resolve(delta);
                },
                sign: () => {
                    callOrder.push("sign");
                    return Promise.resolve({ keyVersion: 1, signature: "signature" });
                },
            });
            const outbox = helpers.outboxContract({
                buildChangeLogArchive: (changeLog) => {
                    callOrder.push("buildArchive");
                    return new Outbox({
                        destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE,
                        payload: { id: changeLog.id },
                        actionType: "ARCHIVE",
                    });
                },
            });
            const { subscriber } = helpers.subscriber({ operationContext, logMasking, outbox });
            const transaction = helpers.transaction();
            transaction.persist.mockImplementation((entity) => {
                if (entity instanceof ChangeLog) {
                    callOrder.push("persistChangeLog");
                }
                if (entity instanceof Outbox) {
                    callOrder.push("persistOutbox");
                }
            });
            const uow = helpers.uow({
                changeSets: [
                    helpers.changeSet({
                        originalEntity: { name: "Old Name" },
                        payload: { name: "New Name" },
                    }),
                ],
            });
            uow.computeChangeSet.mockImplementation((entity) => {
                if (entity instanceof ChangeLog) {
                    callOrder.push("computeChangeLog");
                }
                if (entity instanceof Outbox) {
                    callOrder.push("computeOutbox");
                }
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(callOrder).toEqual([
                "maskChangeLog",
                "sign",
                "persistChangeLog",
                "computeChangeLog",
                "buildArchive",
                "persistOutbox",
                "computeOutbox",
            ]);
        });

        it("[case] - builds create deltas from payload values", async () => {
            // Arrange

            // Act
            const changeLog = await helpers.flushSingleChangeLog({
                changeSet: helpers.changeSet({
                    payload: { name: "Created Name", code: "role.created" },
                    type: ChangeSetType.CREATE,
                }),
            });

            // Assert
            expect(changeLog.delta).toEqual({
                name: { old: null, new: "Created Name" },
                code: { old: null, new: "role.created" },
            });
        });

        it("[case] - builds update deltas from original entity values", async () => {
            // Arrange

            // Act
            const changeLog = await helpers.flushSingleChangeLog({
                changeSet: helpers.changeSet({
                    originalEntity: { name: "Old Name" },
                    payload: { name: "Updated Name" },
                    type: ChangeSetType.UPDATE,
                }),
            });

            // Assert
            expect(changeLog.delta).toEqual({
                name: { old: "Old Name", new: "Updated Name" },
            });
        });

        it("[case] - uses null as old value when update original entity is absent", async () => {
            // Arrange

            // Act
            const changeLog = await helpers.flushSingleChangeLog({
                changeSet: helpers.changeSet({
                    payload: { name: "Updated Name" },
                    type: ChangeSetType.UPDATE,
                }),
            });

            // Assert
            expect(changeLog.delta).toEqual({
                name: { old: null, new: "Updated Name" },
            });
        });

        it("[case] - builds delete deltas from original entity values", async () => {
            // Arrange

            // Act
            const changeLog = await helpers.flushSingleChangeLog({
                changeSet: helpers.changeSet({
                    originalEntity: { name: "Deleted Name", code: "role.deleted" },
                    type: ChangeSetType.DELETE,
                    payload: {},
                }),
            });

            // Assert
            expect(changeLog.delta).toEqual({
                name: { old: "Deleted Name", new: null },
                code: { old: "role.deleted", new: null },
            });
        });

        it("[case] - builds delete deltas from entity values when original entity is absent", async () => {
            // Arrange
            const account = {
                id: "00000000-0000-4000-8000-000000000002",
                status: "ACTIVE",
            };

            // Act
            const changeLog = await helpers.flushSingleChangeLog({
                changeSet: helpers.changeSet({
                    entity: { name: "Deleted Name", account },
                    type: ChangeSetType.DELETE,
                    payload: {},
                }),
            });

            // Assert
            expect(changeLog.delta).toEqual({
                name: { old: "Deleted Name", new: null },
                account: { old: account, new: null },
            });
        });

        it("[case] - joins a composite primary key returned as an object into the entity field", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const uow = helpers.uow({
                changeSets: [
                    helpers.changeSet({
                        primaryKey: {
                            realm: "00000000-0000-4000-8000-000000000001",
                            ancestor: "00000000-0000-4000-8000-000000000002",
                            descendant: "00000000-0000-4000-8000-000000000003",
                        },
                        type: ChangeSetType.CREATE,
                        className: "RoleClosure",
                        payload: { depth: 1 },
                    }),
                ],
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(transaction.persist.mock.calls[0][0]).toEqual(
                expect.objectContaining({
                    entity: [
                        "00000000-0000-4000-8000-000000000001",
                        "00000000-0000-4000-8000-000000000002",
                        "00000000-0000-4000-8000-000000000003",
                    ].join(":"),
                }),
            );
        });

        it("[case] - joins a composite primary key into the entity field", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const uow = helpers.uow({
                changeSets: [
                    helpers.changeSet({
                        primaryKey: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002", 1],
                        originalEntity: { depth: 0 },
                        className: "RoleClosure",
                        payload: { depth: 1 },
                    }),
                ],
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(transaction.persist.mock.calls[0][0]).toEqual(
                expect.objectContaining({
                    entity: "00000000-0000-4000-8000-000000000001:00000000-0000-4000-8000-000000000002:1",
                    entityType: "RoleClosure",
                }),
            );
        });

        it("[case] - does not process change sets added while persisting archive entities", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { subscriber } = helpers.subscriber({ operationContext });
            const transaction = helpers.transaction();
            const changeSets = [
                helpers.changeSet({
                    originalEntity: { name: "Old Name" },
                    payload: { name: "New Name" },
                }),
            ];
            const uow = helpers.uow({ changeSets });
            transaction.persist.mockImplementation((entity) => {
                if (entity instanceof ChangeLog) {
                    changeSets.push(
                        helpers.changeSet({
                            originalEntity: { code: "role.old" },
                            payload: { code: "role.created" },
                        }),
                    );
                }
            });

            // Act
            await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
                subscriber.onFlush(helpers.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
            );

            // Assert
            expect(transaction.persist).toHaveBeenCalledTimes(2);
            expect(uow.computeChangeSet).toHaveBeenCalledTimes(2);
        });
    });
});
