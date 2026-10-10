import { AuditLogTopicAction, ChangeLogTopicAction, AccessCacheTopicAction } from "@monadiam/shared";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { ChangeSetType } from "@mikro-orm/postgresql";

import { DeltaChanges, MaskedValue } from "~common/transaction-manager/value-objects";
import { OutboxUnitHelpers } from "~testing/unit/transaction-manager/outbox.helpers";
import { KafkaTopic } from "~context/enums";

/* eslint-disable prettier/prettier */
const AUDIT_ID  = "00000000-0000-4000-8000-000000000001";
const CHANGE_ID = "00000000-0000-4000-8000-000000000002";
/* eslint-enable prettier/prettier */

const CREATED_AT = new Date("2026-09-12T12:00:00.000Z");
const helpers = new OutboxUnitHelpers();

describe("[CommonService] - Outbox", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - build", () => {
        it("[case] - creates an outbox entry and validates its envelope", () => {
            // Arrange
            const { service, registry } = helpers.service();
            const payload = { realm: "00000000-0000-4000-8000-000000000010" };
            const metadata = { traceId: "trace-id" };

            // Act
            const outbox = service.build({
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
                metadata,
                payload,
            });

            // Assert
            expect(outbox).toEqual(
                expect.objectContaining({
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                    metadata,
                    payload,
                }),
            );
            expect(registry.validate).toHaveBeenCalledWith({
                topic: KafkaTopic.ACCESS_CACHE,
                value: { actionType: AccessCacheTopicAction.INVALIDATE, payload },
            });
        });

        it("[case] - does not include metadata in the validated envelope", () => {
            // Arrange
            const { service, registry } = helpers.service();

            // Act
            service.build({
                payload: { id: "00000000-0000-4000-8000-000000000010" },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
                metadata: { traceId: "trace-id" },
            });

            // Assert
            expect(registry.validate).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: {
                        payload: { id: "00000000-0000-4000-8000-000000000010" },
                        actionType: AccessCacheTopicAction.INVALIDATE,
                    },
                }),
            );
        });

        it("[case] - propagates schema validation errors", () => {
            // Arrange
            const error = new Error("schema validation failed");
            const registry = helpers.schemaRegistry({
                validate: () => {
                    throw error;
                },
            });
            const { service } = helpers.service({ registry });

            // Act
            const act = (): unknown =>
                service.build({
                    payload: { id: "00000000-0000-4000-8000-000000000010" },
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                });

            // Assert
            expect(act).toThrow(error);
        });
    });

    describe("[Method] - buildAuditLogArchive", () => {
        it("[case] - builds a full snake_case archive payload", () => {
            // Arrange
            const { service } = helpers.service();
            const audit = helpers.createAuditLog({
                actor: "00000000-0000-4000-8000-000000000010",
                realm: "00000000-0000-4000-8000-000000000011",
                input: { role: "admin" },
                createdAt: CREATED_AT,
                actionType: "CREATE",
                entityType: "ROLE",
                id: AUDIT_ID,
            });

            // Act
            const outbox = service.buildAuditLogArchive(audit);

            // Assert
            expect(outbox.destinationTopic).toBe(KafkaTopic.AUDIT_LOG_ARCHIVE);
            expect(outbox.actionType).toBe(AuditLogTopicAction.ARCHIVE);
            expect(outbox.payload).toEqual({
                realm: "00000000-0000-4000-8000-000000000011",
                actor: "00000000-0000-4000-8000-000000000010",
                input: JSON.stringify({ role: "admin" }),
                created_at: CREATED_AT.toISOString(),
                service: "access-control-service",
                user_agent: "unit-agent",
                action_type: "CREATE",
                entity_type: "ROLE",
                ip: "127.0.0.1",
                id: AUDIT_ID,
            });
        });

        it("[case] - uses null for omitted nullable fields", () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const audit = helpers.createAuditLog({
                createdAt: CREATED_AT,
                userAgent: undefined,
                actionType: "CREATE",
                entityType: "ROLE",
                input: undefined,
                actor: undefined,
                realm: undefined,
                ip: undefined,
                id: AUDIT_ID,
            });

            const result = service.buildAuditLogArchive(audit).payload;

            // Assert
            expect(result).toEqual({
                created_at: CREATED_AT.toISOString(),
                service: "access-control-service",
                action_type: "CREATE",
                entity_type: "ROLE",
                user_agent: null,
                id: AUDIT_ID,
                input: null,
                realm: null,
                actor: null,
                ip: null,
            });
        });
    });

    describe("[Method] - buildChangeLogArchive", () => {
        it("[case] - builds a full change log archive payload with serialized masked delta", () => {
            // Arrange
            const { service } = helpers.service();
            const delta = new DeltaChanges({
                token: {
                    old: new MaskedValue({ value: "****************", hash: "old-hash" }),
                    new: new MaskedValue({ value: "****************", hash: "new-hash" }),
                },
            });
            const change = helpers.createChangeLog({
                entity: "00000000-0000-4000-8000-000000000010",
                changeType: ChangeSetType.UPDATE,
                createdAt: CREATED_AT,
                auditEntry: AUDIT_ID,
                entityType: "ROLE",
                id: CHANGE_ID,
                delta,
            });

            // Act
            const outbox = service.buildChangeLogArchive(change);

            // Assert
            expect(outbox.destinationTopic).toBe(KafkaTopic.CHANGE_LOG_ARCHIVE);
            expect(outbox.actionType).toBe(ChangeLogTopicAction.ARCHIVE);
            expect(outbox.payload).toEqual({
                entity: "00000000-0000-4000-8000-000000000010",
                created_at: CREATED_AT.toISOString(),
                change_type: ChangeSetType.UPDATE,
                service: "access-control-service",
                delta: JSON.stringify(delta),
                audit_entry: AUDIT_ID,
                entity_type: "ROLE",
                id: CHANGE_ID,
            });
        });
    });
});
