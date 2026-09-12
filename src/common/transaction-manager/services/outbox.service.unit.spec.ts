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

describe("OutboxService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("build", () => {
        it("creates an outbox entry and validates its envelope", () => {
            const { service, registry } = helpers.service();
            const payload = { realm: "00000000-0000-4000-8000-000000000010" };
            const metadata = { traceId: "trace-id" };

            const outbox = service.build({
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
                metadata,
                payload,
            });

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

        it("does not include metadata in the validated envelope", () => {
            const { service, registry } = helpers.service();

            service.build({
                payload: { id: "00000000-0000-4000-8000-000000000010" },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
                metadata: { traceId: "trace-id" },
            });

            expect(registry.validate).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: {
                        payload: { id: "00000000-0000-4000-8000-000000000010" },
                        actionType: AccessCacheTopicAction.INVALIDATE,
                    },
                }),
            );
        });

        it("propagates schema validation errors", () => {
            const error = new Error("schema validation failed");
            const registry = helpers.schemaRegistry({
                validate: () => {
                    throw error;
                },
            });
            const { service } = helpers.service({ registry });

            expect(() =>
                service.build({
                    payload: { id: "00000000-0000-4000-8000-000000000010" },
                    actionType: AccessCacheTopicAction.INVALIDATE,
                    destinationTopic: KafkaTopic.ACCESS_CACHE,
                }),
            ).toThrow(error);
        });
    });

    describe("buildAuditLogArchive", () => {
        it("builds a full snake_case archive payload", () => {
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

            const outbox = service.buildAuditLogArchive(audit);

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

        it("uses null for omitted nullable fields", () => {
            const { service } = helpers.service();
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

            expect(service.buildAuditLogArchive(audit).payload).toEqual({
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

    describe("buildChangeLogArchive", () => {
        it("builds a full change log archive payload with serialized masked delta", () => {
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

            const outbox = service.buildChangeLogArchive(change);

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
