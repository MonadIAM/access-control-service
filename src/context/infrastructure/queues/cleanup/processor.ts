import { Inject, Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

import { AUDIT_LOG_SERVICE, CHANGE_LOG_SERVICE } from "~context/application/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CleanupJob } from "~context/enums";
import {
    ACCOUNT_ROLE_ASSIGNMENT_COMMANDS,
    ROLE_DELEGATION_POLICY_COMMANDS,
    PERMISSION_OVERRIDE_COMMANDS,
} from "~context/interface/commands";

import { CLEANUP_QUEUE } from "../tokens";
import { BullQueue } from "../enums";

@Injectable()
@Processor(BullQueue.CLEANUP)
export class CleanupProcessor extends WorkerHost {
    private readonly logger = new Logger(CleanupProcessor.name);

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(CHANGE_LOG_SERVICE)
        private readonly changeLogService: Services.ChangeLog.ProcessorContract,
        @Inject(AUDIT_LOG_SERVICE)
        private readonly auditLogService: Services.AuditLog.ProcessorContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMANDS)
        private readonly accountRoleAssignmentCommands: Commands.AccountRoleAssignment.ProcessorContract,
        @Inject(ROLE_DELEGATION_POLICY_COMMANDS)
        private readonly roleDelegationPolicyCommands: Commands.RoleDelegationPolicy.ProcessorContract,
        @Inject(PERMISSION_OVERRIDE_COMMANDS)
        private readonly permissionOverrideCommands: Commands.PermissionOverride.ProcessorContract,
        @Inject(CLEANUP_QUEUE)
        private readonly cleanupQueue: Queues.Cleanup.Contract,
    ) {
        super();
    }

    private readonly handlers: Record<CleanupJob, Queues.Cleanup.Handler> = {
        [CleanupJob.EXPIRED_ACCESS_RECORDS]: (job: Job) => this.expireAccessRecords(job),
        [CleanupJob.CHANGE_LOG]: (job: Job) => this.cleanupChangeLog(job),
        [CleanupJob.AUDIT_LOG]: (job: Job) => this.cleanupAuditLog(job),
    };

    public process(job: Job): Promise<Queues.Cleanup.Result> {
        return this.handlers[job.name as CleanupJob]?.(job);
    }

    private async cleanupAuditLog(job: Job<Queues.Cleanup.RetentionJobData>): Promise<Queues.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const expirationDate = new Date(Date.now() - olderThanMs);
        this.logger.log(`Cleaning up audit log entries older than ${expirationDate.toISOString()}`);

        try {
            const purged = await this.transactionalService.run({
                resource: "AuditLog",
                execute: (transaction) => this.auditLogService.purgeExpired({ transaction, expirationDate, batchSize }),
            });

            if (purged.length) {
                this.logger.log(`Deleted ${purged.length} audit log entries.`);
                return this.scheduleNextBatch(job, purged.length === batchSize);
            } else {
                this.logger.log("No audit log entries to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up audit log entries", error);
            throw error;
        }
    }

    private async cleanupChangeLog(job: Job<Queues.Cleanup.RetentionJobData>): Promise<Queues.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const expirationDate = new Date(Date.now() - olderThanMs);
        this.logger.log(`Cleaning up change log entries older than ${expirationDate.toISOString()}`);

        try {
            const purged = await this.transactionalService.run({
                resource: "ChangeLog",
                execute: (transaction) => this.changeLogService.purgeExpired({ transaction, expirationDate, batchSize }),
            });

            if (purged.length) {
                this.logger.log(`Deleted ${purged.length} change log entries.`);
                return this.scheduleNextBatch(job, purged.length === batchSize);
            } else {
                this.logger.log("No change log entries to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up change log entries", error);
            throw error;
        }
    }

    private async expireAccessRecords(job: Job<Queues.Cleanup.ExpirationJobData>): Promise<Queues.Cleanup.Result> {
        const { batchSize } = job.data;
        this.logger.log("Expiring access records");

        try {
            const [expiredAssignments, expiredOverrides, expiredPolicies] = await Promise.all([
                this.accountRoleAssignmentCommands.expire({ batchSize }),
                this.roleDelegationPolicyCommands.expire({ batchSize }),
                this.permissionOverrideCommands.expire({ batchSize }),
            ]);

            if (!expiredAssignments && !expiredOverrides && !expiredPolicies) {
                this.logger.log("No access records to expire.");
                return { deleted: 0, nextBatch: false };
            }

            this.logger.log(
                `Expired ${expiredAssignments} account role assignments, ${expiredOverrides} permission overrides ` +
                    `and ${expiredPolicies} role delegation policies.`,
            );
            return this.scheduleNextBatch(
                job,
                expiredAssignments === batchSize || expiredOverrides === batchSize || expiredPolicies === batchSize,
            );
        } catch (error) {
            this.logger.error("Failed to expire access records", error);
            throw error;
        }
    }

    private async scheduleNextBatch(job: Job<Queues.Cleanup.JobData>, hasMore: boolean): Promise<Queues.Cleanup.Result> {
        if (hasMore) {
            await this.cleanupQueue.scheduleNextBatch({ job: job.name as CleanupJob, data: job.data });
            this.logger.log("Next batch scheduled in 5 seconds...");
        }
        return { deleted: 0, nextBatch: hasMore };
    }
}
