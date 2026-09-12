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

describe("TransactionalService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("run", () => {
        it("executes without audit and flushes outbox in the same transaction", async () => {
            const { service, transactional, outbox } = helpers.service();
            const role = helpers.createRole();

            await expect(
                service.run({
                    outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                    execute: () => role,
                }),
            ).resolves.toBe(role);

            expect(transactional.fork).toHaveBeenCalledTimes(1);
            expect(outbox.build).toHaveBeenCalledWith({
                payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            });
            expect(transactional.persist).toHaveBeenCalledTimes(1);
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });

        it("masks, signs and persists audit before executing the domain operation", async () => {
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

            expect(callOrder).toEqual(["maskAuditLog", "sign", "persistAudit", "persistArchive", "execute", "flush"]);
            expect(archive).toEqual(expect.objectContaining({ destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE }));
            expect(transactional.flush).toHaveBeenCalledTimes(1);
            expect(audit).toBeInstanceOf(AuditLog);
        });

        it("forks the write manager for each run", async () => {
            const { service, transactional } = helpers.service();

            await service.run({ execute: () => helpers.createRole() });
            await service.run({ execute: () => helpers.createRole() });

            expect(transactional.fork).toHaveBeenCalledTimes(2);
            expect(transactional.transactional).toHaveBeenCalledTimes(2);
        });

        it("does not mask audit when input is omitted", async () => {
            const { service, logMasking } = helpers.service();

            await service.run({
                audit: {
                    context: { ip: "127.0.0.1", userAgent: "unit-agent" },
                    actionType: ActionType.CREATE,
                    entityType: EntityType.ROLE,
                },
                execute: () => helpers.createRole(),
            });

            expect(logMasking.maskAuditLog).not.toHaveBeenCalled();
            expect(logMasking.sign).toHaveBeenCalledTimes(1);
        });

        it("maps thrown execution errors and skips flush", async () => {
            const { service, transactional } = helpers.service();
            const error = new DriverException(new Error("execute failed"));

            await expect(
                service.run({
                    execute: () => {
                        throw error;
                    },
                    resource: "Role",
                }),
            ).rejects.toThrow("db.INTERNAL_DRIVER_ERROR");

            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("passes domain exceptions through unchanged", async () => {
            const { service } = helpers.service();
            const error = Exception.badRequest({
                code: ErrorCode.BAD_REQUEST,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
            });

            await expect(
                service.run({
                    execute: () => {
                        throw error;
                    },
                }),
            ).rejects.toBe(error);
        });

        it("opens change log context only when audit is present", async () => {
            const operationContext = helpers.operationContext();
            const runSpy = jest.spyOn(operationContext, "run");
            const { service } = helpers.service({ operationContext });

            await service.run({
                execute: () => Promise.resolve(),
                changeLog: true,
            });

            expect(runSpy).not.toHaveBeenCalled();
        });

        it("sets changeLogEnabled to false by default when audit is present", async () => {
            const operationContext = helpers.operationContext();
            const runSpy = jest.spyOn(operationContext, "run");
            const { service } = helpers.service({ operationContext });

            await service.run({
                execute: () => helpers.createRole(),
                audit: AUDIT_PROPS,
            });

            expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ changeLogEnabled: false }), expect.any(Function));
        });

        it("exposes the audit entry inside execute", async () => {
            const operationContext = helpers.operationContext();
            const { service } = helpers.service({ operationContext });

            await service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                execute: () => {
                    expect(operationContext.get()).toEqual({
                        auditEntry: expect.any(String),
                        changeLogEnabled: true,
                    });
                    return helpers.createRole();
                },
            });
        });

        it("does not map Vault failures as database errors", async () => {
            const error = new Error("vault unavailable");
            const logMasking = helpers.logMaskingContract({
                maskAuditLog: () => Promise.reject(error),
            });
            const { service } = helpers.service({ logMasking });

            await expect(
                service.run({
                    execute: () => helpers.createRole(),
                    audit: AUDIT_PROPS,
                }),
            ).rejects.toBe(error);
        });

        it("does not flush when audit signing fails", async () => {
            const error = new Error("vault signing unavailable");
            const logMasking = helpers.logMaskingContract({
                sign: () => Promise.reject(error),
            });
            const { service, transactional } = helpers.service({ logMasking });

            await expect(
                service.run({
                    execute: () => helpers.createRole(),
                    audit: AUDIT_PROPS,
                }),
            ).rejects.toBe(error);

            expect(transactional.persist).not.toHaveBeenCalled();
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("does not execute or flush when audit archive build fails", async () => {
            const error = new Error("audit archive unavailable");
            const execute = jest.fn(() => helpers.createRole());
            const outbox = helpers.outboxContract({
                buildAuditLogArchive: () => {
                    throw error;
                },
            });
            const { service, transactional } = helpers.service({ outbox });

            await expect(
                service.run({
                    audit: AUDIT_PROPS,
                    execute,
                }),
            ).rejects.toBe(error);

            expect(execute).not.toHaveBeenCalled();
            expect(transactional.persist).toHaveBeenCalledTimes(1);
            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("does not map schema registry failures as database errors", async () => {
            const error = new Error("schema registry unavailable");
            const outbox = helpers.outboxContract({
                build: () => {
                    throw error;
                },
            });
            const { service, transactional } = helpers.service({ outbox });

            await expect(
                service.run({
                    outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                    execute: () => helpers.createRole(),
                }),
            ).rejects.toBe(error);

            expect(transactional.flush).not.toHaveBeenCalled();
        });
    });

    describe("executeWithEffects", () => {
        it("returns the execute result and flushes after persisting outbox", async () => {
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

            await expect(
                service.executeWithEffects({
                    transaction: transactional.transaction,
                    params: {
                        outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                        execute: () => role,
                    },
                }),
            ).resolves.toBe(role);

            expect(transactional.persist).toHaveBeenCalledTimes(1);
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });

        it("does not flush when outbox build fails after execute", async () => {
            const error = new Error("outbox unavailable");
            const outbox = helpers.outboxContract({
                build: () => {
                    throw error;
                },
            });
            const { service, transactional } = helpers.service({ outbox });

            await expect(
                service.executeWithEffects({
                    transaction: transactional.transaction,
                    params: {
                        outbox: helpers.accessCacheOutboxConfig<Entities.Role>(),
                        execute: () => helpers.createRole(),
                    },
                }),
            ).rejects.toBe(error);

            expect(transactional.flush).not.toHaveBeenCalled();
        });

        it("flushes undefined command results without outbox", async () => {
            const { service, transactional } = helpers.service();

            await service.executeWithEffects({
                transaction: transactional.transaction,
                params: {
                    execute: () => undefined,
                },
            });

            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });
    });

    describe("persistOutboxEvents", () => {
        it("persists one outbox entry per mapped payload", () => {
            const { service, transactional } = helpers.service();
            const first = helpers.createRole({ id: "00000000-0000-4000-8000-000000000010" });
            const second = helpers.createRole({ id: "00000000-0000-4000-8000-000000000011" });

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

            expect(transactional.persist).toHaveBeenCalledTimes(2);
        });

        it("persists one outbox entry per outbox config", () => {
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

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

            expect(transactional.persist).toHaveBeenCalledTimes(2);
        });

        it("uses the command result as payload when mapper is omitted", () => {
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

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

            expect(transactional.persist).toHaveBeenCalledWith(expect.objectContaining({ payload: role }));
        });

        it("does nothing when outbox is omitted", () => {
            const { service, transactional } = helpers.service();
            const role = helpers.createRole();

            service.persistOutboxEvents({
                transaction: transactional.transaction,
                result: role,
                params: {
                    execute: () => role,
                },
            });

            expect(transactional.persist).not.toHaveBeenCalled();
        });
    });

    describe("emit", () => {
        it("persists audit, archive and outbox with change log disabled", async () => {
            const operationContext = helpers.operationContext();
            const runSpy = jest.spyOn(operationContext, "run");
            const { service, transactional } = helpers.service({ operationContext });

            await service.emit({
                payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
                audit: AUDIT_PROPS,
            });

            expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ changeLogEnabled: false }), expect.any(Function));
            expect(transactional.persist).toHaveBeenCalledTimes(3);
            expect(transactional.flush).toHaveBeenCalledTimes(1);
        });

        it("does not map emit dependency failures as database errors", async () => {
            const error = new Error("schema registry unavailable");
            const outbox = helpers.outboxContract({
                build: () => {
                    throw error;
                },
            });
            const { service } = helpers.service({ outbox });

            await expect(
                service.emit({
                    payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                    audit: AUDIT_PROPS,
                }),
            ).rejects.toBe(error);
        });
    });
});
