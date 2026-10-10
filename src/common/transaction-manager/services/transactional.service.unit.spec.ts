import { AccessCacheTopicAction, InvalidationScope } from "@monadiam/shared";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { DriverException } from "@mikro-orm/postgresql";

import { TransactionalUnitHelpers } from "~testing/unit/transaction-manager/transactional.helpers";
import { AuditLog, Outbox } from "~common/transaction-manager/entities";
import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { ErrorCode, Exception } from "~common/exceptions";

const helpers = new TransactionalUnitHelpers();

const AUDIT_PROPS = {
    context: { ip: "127.0.0.1", userAgent: "unit-agent" },
    input: { password: "secret" },
    actionType: ActionType.CREATE,
    entityType: EntityType.ROLE,
};

describe("[CommonService] - Transactional", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - run", () => {
        it("[case] - executes without audit and flushes outbox in the same transaction", async () => {
            // Arrange
            const { service, transactional, outbox } = helpers.service();
            const role = helpers.createRole();

            // Act
            const result = await service.run({
                outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                execute: () => role,
            });

            // Assert
            expect(result).toBe(role);
            expect(transactional.fork).toHaveBeenCalledTimes(1);
            expect(outbox.build).toHaveBeenCalledWith({
                payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            });
            expect(transactional.persist).toHaveBeenCalledTimes(1);
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });

        it("[case] - masks, signs and persists audit before executing the domain operation", async () => {
            // Arrange
            const callOrder: string[] = [];
            const logMasking = helpers.logMaskingContract({
                maskAuditLog: ({ input }: TransactionManager.LogMasking.MaskAuditLog.Props) => {
                    callOrder.push("maskAuditLog");
                    return Promise.resolve(input);
                },
                sign: () => {
                    callOrder.push("sign");
                    return Promise.resolve({ keyVersion: 1, signature: "signature" });
                },
            });
            const { service, transactional } = helpers.service({ logMasking });
            const role = helpers.createRole();
            transactional.persist.mockImplementation((entity) => {
                if (entity instanceof AuditLog) {
                    callOrder.push("persistAudit");
                }
                if (entity instanceof Outbox) {
                    callOrder.push("persistArchive");
                }
            });
            transactional.flush.mockImplementation(() => {
                callOrder.push("flush");
                return Promise.resolve();
            });

            // Act
            await service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                execute: () => {
                    callOrder.push("execute");
                    return role;
                },
            });

            const audit = transactional.persist.mock.calls[0][0];
            const archive = transactional.persist.mock.calls[1][0];

            // Assert
            expect(callOrder).toEqual(["maskAuditLog", "sign", "persistAudit", "persistArchive", "execute", "flush"]);
            expect(archive).toEqual(expect.objectContaining({ destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE }));
            expect(transactional.flush).toHaveBeenCalledTimes(1);
            expect(audit).toBeInstanceOf(AuditLog);
        });

        it("[case] - forks the write manager for each run", async () => {
            // Arrange
            const { service, transactional } = helpers.service();

            // Act
            await service.run({ execute: () => helpers.createRole() });
            await service.run({ execute: () => helpers.createRole() });

            // Assert
            expect(transactional.fork).toHaveBeenCalledTimes(2);
            expect(transactional.transactional).toHaveBeenCalledTimes(2);
        });

        it("[case] - does not mask audit when input is omitted", async () => {
            // Arrange
            const { service, logMasking } = helpers.service();

            // Act
            await service.run({
                audit: {
                    context: { ip: "127.0.0.1", userAgent: "unit-agent" },
                    actionType: ActionType.CREATE,
                    entityType: EntityType.ROLE,
                },
                execute: () => helpers.createRole(),
            });

            // Assert
            expect(logMasking.maskAuditLog).not.toHaveBeenCalled();
            expect(logMasking.sign).toHaveBeenCalledTimes(1);
        });

        it("[case] - maps thrown execution errors and skips flush", async () => {
            // Arrange
            const { service, transactional } = helpers.service();
            const error = new DriverException(new Error("execute failed"));

            // Act
            const result = service.run({
                execute: () => {
                    throw error;
                },
                resource: "Role",
            });

            // Assert
            await expect(result).rejects.toThrow("db.INTERNAL_DRIVER_ERROR");
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("[case] - passes domain exceptions through unchanged", async () => {
            // Arrange
            const { service } = helpers.service();
            const error = Exception.badRequest({
                code: ErrorCode.BAD_REQUEST,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
            });

            // Act
            const result = service.run({
                execute: () => {
                    throw error;
                },
            });

            // Assert
            await expect(result).rejects.toBe(error);
        });

        it("[case] - opens change log context only when audit is present", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const runSpy = jest.spyOn(operationContext, "run");
            const { service } = helpers.service({ operationContext });

            // Act
            await service.run({
                execute: () => Promise.resolve(),
                changeLog: true,
            });

            // Assert
            expect(runSpy).not.toHaveBeenCalled();
        });

        it("[case] - sets changeLogEnabled to false by default when audit is present", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const runSpy = jest.spyOn(operationContext, "run");
            const { service } = helpers.service({ operationContext });

            // Act
            await service.run({
                execute: () => helpers.createRole(),
                audit: AUDIT_PROPS,
            });

            // Assert
            expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ changeLogEnabled: false }), expect.any(Function));
        });

        it("[case] - exposes the audit entry inside execute", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const { service } = helpers.service({ operationContext });

            // Act
            const observed: ReturnType<typeof operationContext.get>[] = [];
            await service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                execute: () => {
                    observed.push(operationContext.get());
                    return helpers.createRole();
                },
            });

            // Assert
            expect(observed).toEqual([{ auditEntry: expect.any(String), changeLogEnabled: true }]);
        });

        it("[case] - does not map Vault failures as database errors", async () => {
            // Arrange
            const error = new Error("vault unavailable");
            const logMasking = helpers.logMaskingContract({
                maskAuditLog: () => Promise.reject(error),
            });
            const { service } = helpers.service({ logMasking });

            // Act
            const result = service.run({
                execute: () => helpers.createRole(),
                audit: AUDIT_PROPS,
            });

            // Assert
            await expect(result).rejects.toBe(error);
        });

        it("[case] - does not flush when audit signing fails", async () => {
            // Arrange
            const error = new Error("vault signing unavailable");
            const logMasking = helpers.logMaskingContract({
                sign: () => Promise.reject(error),
            });
            const { service, transactional } = helpers.service({ logMasking });

            // Act
            const result = service.run({
                execute: () => helpers.createRole(),
                audit: AUDIT_PROPS,
            });

            // Assert
            await expect(result).rejects.toBe(error);
            expect(transactional.persist).not.toHaveBeenCalled();
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("[case] - does not execute or flush when audit archive build fails", async () => {
            // Arrange
            const error = new Error("audit archive unavailable");
            const execute = jest.fn(() => helpers.createRole());
            const outbox = helpers.outboxContract({
                buildAuditLogArchive: () => {
                    throw error;
                },
            });
            const { service, transactional } = helpers.service({ outbox });

            // Act
            const result = service.run({
                audit: AUDIT_PROPS,
                execute,
            });

            // Assert
            await expect(result).rejects.toBe(error);
            expect(execute).not.toHaveBeenCalled();
            expect(transactional.persist).toHaveBeenCalledTimes(1);
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("[case] - does not map schema registry failures as database errors", async () => {
            // Arrange
            const error = new Error("schema registry unavailable");
            const outbox = helpers.outboxContract({
                build: () => {
                    throw error;
                },
            });
            const { service, transactional } = helpers.service({ outbox });

            // Act
            const result = service.run({
                outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                execute: () => helpers.createRole(),
            });

            // Assert
            await expect(result).rejects.toBe(error);
            expect(transactional.flush).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - consume", () => {
        const incoming: TransactionManager.Service.IncomingMessage = {
            consumerKey: "access-control.account.v1",
            event: "00000000-0000-4000-8000-000000000001",
            source: { topic: "account", partition: 0, offset: "42" },
        };

        it("[case] - claims the message before audit and domain effects", async () => {
            // Arrange
            const callOrder: string[] = [];
            const claim = jest.fn<TransactionManager.Inbox.Claim.Signature>(() => {
                callOrder.push("claim");
                return Promise.resolve(true);
            });
            const inbox = helpers.inboxContract({ claim });
            const logMasking = helpers.logMaskingContract({
                sign: () => {
                    callOrder.push("sign");
                    return Promise.resolve({ keyVersion: 1, signature: "signature" });
                },
            });
            const { service, transactional } = helpers.service({ inbox, logMasking });
            const role = helpers.createRole();
            const execute = jest.fn<TransactionManager.Service.Run.Props<Entities.Role>["execute"]>(() => {
                callOrder.push("execute");
                return role;
            });

            // Act
            const result = await service.consume({
                incoming,
                audit: AUDIT_PROPS,
                execute,
            });

            // Assert
            expect(result).toEqual({ status: "processed", value: role });
            expect(callOrder).toEqual(["claim", "sign", "execute"]);
            expect(claim).toHaveBeenCalledWith({ transaction: transactional.transaction, incoming });
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });

        it("[case] - returns duplicate without audit, domain or outbox effects", async () => {
            // Arrange
            const execute = jest.fn(() => helpers.createRole());
            const inbox = helpers.inboxContract({ claim: () => Promise.resolve(false) });
            const { service, transactional, logMasking, outbox } = helpers.service({ inbox });

            // Act
            const result = await service.consume({
                incoming,
                audit: AUDIT_PROPS,
                outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                execute,
            });

            // Assert
            expect(result).toEqual({ status: "duplicate" });
            expect(execute).not.toHaveBeenCalled();
            expect(logMasking.sign).not.toHaveBeenCalled();
            expect(outbox.build).not.toHaveBeenCalled();
            expect(transactional.persist).not.toHaveBeenCalled();
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("[case] - maps inbox database errors using the operation resource", async () => {
            // Arrange
            const error = new DriverException(new Error("claim failed"));
            const execute = jest.fn(() => helpers.createRole());
            const inbox = helpers.inboxContract({ claim: () => Promise.reject(error) });
            const { service } = helpers.service({ inbox });

            // Act
            const result = service.consume({ incoming, execute, resource: "Account" });

            // Assert
            await expect(result).rejects.toThrow("db.INTERNAL_DRIVER_ERROR");
            expect(execute).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - executeWithEffects", () => {
        it("[case] - returns the execute result and flushes after persisting outbox", async () => {
            // Arrange
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

            // Act
            const result = await service.executeWithEffects({
                transaction: transactional.transaction,
                params: {
                    outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                    execute: () => role,
                },
            });

            // Assert
            expect(result).toBe(role);
            expect(transactional.persist).toHaveBeenCalledTimes(1);
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });

        it("[case] - does not flush when outbox build fails after execute", async () => {
            // Arrange
            const error = new Error("outbox unavailable");
            const outbox = helpers.outboxContract({
                build: () => {
                    throw error;
                },
            });
            const { service, transactional } = helpers.service({ outbox });

            // Act
            const result = service.executeWithEffects({
                transaction: transactional.transaction,
                params: {
                    outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                    execute: () => helpers.createRole(),
                },
            });

            // Assert
            await expect(result).rejects.toBe(error);
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("[case] - flushes undefined command results without outbox", async () => {
            // Arrange
            const { service, transactional } = helpers.service();

            // Act
            await service.executeWithEffects({
                transaction: transactional.transaction,
                params: {
                    execute: () => undefined,
                },
            });

            // Assert
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - persistOutboxEvents", () => {
        it("[case] - persists one outbox entry per mapped payload", () => {
            // Arrange
            const { service, transactional } = helpers.service();
            const first = helpers.createRole({ id: "00000000-0000-4000-8000-000000000010" });
            const second = helpers.createRole({ id: "00000000-0000-4000-8000-000000000011" });

            // Act
            service.persistOutboxEvents({
                transaction: transactional.transaction,
                result: [first, second],
                params: {
                    execute: () => [first, second],
                    outbox: {
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                        payloadMapper: (roles) =>
                            roles.map(() => ({
                                items: [{ scope: InvalidationScope.GLOBAL }],
                            })),
                    },
                },
            });

            // Assert
            expect(transactional.persist).toHaveBeenCalledTimes(2);
        });

        it("[case] - persists one outbox entry per outbox config", () => {
            // Arrange
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

            // Act
            service.persistOutboxEvents({
                transaction: transactional.transaction,
                result: role,
                params: {
                    execute: () => role,
                    outbox: [
                        helpers.accessCacheOutboxConfig<Entities.Role>(),
                        helpers.accessCacheOutboxConfig<Entities.Role>(),
                    ],
                },
            });

            // Assert
            expect(transactional.persist).toHaveBeenCalledTimes(2);
        });

        it("[case] - uses the command result as payload when mapper is omitted", () => {
            // Arrange
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

            // Act
            service.persistOutboxEvents({
                transaction: transactional.transaction,
                result: role,
                params: {
                    execute: () => role,
                    outbox: {
                        actionType: AccessCacheTopicAction.INVALIDATE,
                        destinationTopic: KafkaTopic.ACCESS_CACHE,
                    },
                },
            });

            // Assert
            expect(transactional.persist).toHaveBeenCalledWith(expect.objectContaining({ payload: role }));
        });

        it("[case] - does nothing when outbox is omitted", () => {
            // Arrange
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

            // Act
            service.persistOutboxEvents({
                transaction: transactional.transaction,
                result: role,
                params: {
                    execute: () => role,
                },
            });

            // Assert
            expect(transactional.persist).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - emit", () => {
        it("[case] - persists audit, archive and outbox with change log disabled", async () => {
            // Arrange
            const operationContext = helpers.operationContext();
            const runSpy = jest.spyOn(operationContext, "run");
            const { service, transactional } = helpers.service({ operationContext });

            // Act
            await service.emit({
                payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
                audit: AUDIT_PROPS,
            });

            // Assert
            expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ changeLogEnabled: false }), expect.any(Function));
            expect(transactional.persist).toHaveBeenCalledTimes(3);
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });

        it("[case] - does not map emit dependency failures as database errors", async () => {
            // Arrange
            const error = new Error("schema registry unavailable");
            const outbox = helpers.outboxContract({
                build: () => {
                    throw error;
                },
            });
            const { service } = helpers.service({ outbox });

            // Act
            const result = service.emit({
                payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
                audit: AUDIT_PROPS,
            });

            // Assert
            await expect(result).rejects.toBe(error);
        });
    });

    describe("[Behavior] - consume with payload", () => {
        const props = {
            incoming: {
                consumerKey: "payload.consumer.v1",
                event: "00000000-0000-4000-8000-000000000020",
            },
            audit: AUDIT_PROPS,
            payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
            actionType: AccessCacheTopicAction.INVALIDATE,
            destinationTopic: KafkaTopic.ACCESS_CACHE,
        } satisfies TransactionManager.Service.Consume.PayloadProps;

        it("[case] - claims the message and emits its payload and audit in the same transaction", async () => {
            // Arrange
            const { service, transactional, inbox, outbox, operationContext } = helpers.service();
            const context = jest.spyOn(operationContext, "run");
            const claim = jest.spyOn(inbox, "claim");
            const build = jest.spyOn(outbox, "build");
            const emit = jest.spyOn(service, "emit");
            const execute = jest.spyOn(service, "executeTransaction");

            // Act
            const result = await service.consume(props);

            // Assert
            expect(result).toEqual({ status: "processed", value: undefined });
            expect(inbox.claim).toHaveBeenCalledWith({ incoming: props.incoming, transaction: transactional.transaction });
            expect(outbox.build).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: props.payload,
                    destinationTopic: props.destinationTopic,
                    actionType: props.actionType,
                }),
            );
            expect(context).toHaveBeenCalledWith(
                expect.objectContaining({ changeLogEnabled: false }),
                expect.any(Function),
            );
            expect(transactional.fork).toHaveBeenCalledTimes(1);
            expect(transactional.transactional).toHaveBeenCalledTimes(1);
            expect(transactional.persist).toHaveBeenCalledTimes(3);
            expect(transactional.flush).toHaveBeenCalledTimes(1);
            expect(emit).not.toHaveBeenCalled();
            expect(execute).not.toHaveBeenCalled();
            expect(claim.mock.invocationCallOrder[0]).toBeLessThan(build.mock.invocationCallOrder[0]);
        });

        it("[case] - does not build or persist payload and audit for a duplicate", async () => {
            // Arrange
            const inbox = helpers.inboxContract({ claim: () => Promise.resolve(false) });
            const { service, transactional, logMasking, outbox } = helpers.service({ inbox });

            // Act
            const result = await service.consume(props);

            // Assert
            expect(result).toEqual({ status: "duplicate" });
            expect(outbox.build).not.toHaveBeenCalled();
            expect(logMasking.sign).not.toHaveBeenCalled();
            expect(transactional.persist).not.toHaveBeenCalled();
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("[case] - propagates outbox errors without flushing or opening a separate transaction", async () => {
            // Arrange
            const { service, transactional, outbox } = helpers.service();
            const error = new Error("payload build failed");
            jest.spyOn(outbox, "build").mockImplementation(() => {
                throw error;
            });

            // Act
            const result = service.consume(props);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(transactional.transactional).toHaveBeenCalledTimes(1);
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("[case] - propagates flush errors from the payload transaction", async () => {
            // Arrange
            const { service, transactional } = helpers.service();
            const error = new Error("flush failed");
            transactional.flush.mockRejectedValue(error);

            // Act
            const result = service.consume(props);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(transactional.transactional).toHaveBeenCalledTimes(1);
        });

        it("[case] - requires exactly one of execute and payload in the input contract", () => {
            // Arrange
            type Both = typeof props & { execute(): void };
            type Neither = Pick<typeof props, "incoming" | "audit">;
            type WithChangeLog = typeof props & { changeLog: true };
            type Accepts<T> = T extends TransactionManager.Service.Consume.Props<void> ? true : false;

            // Act
            const accepted: [Accepts<typeof props>, Accepts<Both>, Accepts<Neither>, Accepts<WithChangeLog>] = [
                true,
                false,
                false,
                false,
            ];

            // Assert
            expect(accepted).toEqual([true, false, false, false]);
        });
    });
});
