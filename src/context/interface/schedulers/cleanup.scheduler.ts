import { Cron, CronExpression } from "@nestjs/schedule";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { CLEANUP_QUEUE } from "~context/infrastructure/queues";
import { CleanupJob } from "~context/enums";

@Injectable()
export class CleanupScheduler {
    private readonly changeLogRetentionTTL: StringValue;
    private readonly auditLogRetentionTTL: StringValue;
    private readonly inboxRetentionTTL: StringValue;
    private readonly batchSize: number;

    public constructor(
        @Inject(CLEANUP_QUEUE)
        private readonly cleanupQueue: Queues.Cleanup.Contract,
        private readonly configService: ConfigService,
    ) {
        this.changeLogRetentionTTL = this.configService.getOrThrow<StringValue>("CHANGE_LOG_RETENTION_TTL");
        this.auditLogRetentionTTL = this.configService.getOrThrow<StringValue>("AUDIT_LOG_RETENTION_TTL");
        this.inboxRetentionTTL = this.configService.getOrThrow<StringValue>("INBOX_RETENTION_TTL");
        this.batchSize = this.configService.getOrThrow<number>("CLEANUP_BATCH_SIZE");
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    public async scheduleAuditLogCleanup(): Promise<void> {
        const now = new Date();
        await this.cleanupQueue.schedule({
            job: CleanupJob.AUDIT_LOG,
            data: {
                expirationDate: now.getTime() - ms(this.auditLogRetentionTTL),
                event: `${CleanupJob.AUDIT_LOG}.${now.toISOString().slice(0, 10)}`,
                batchSize: this.batchSize,
                batch: 0,
            },
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    public async scheduleChangeLogCleanup(): Promise<void> {
        const now = new Date();
        await this.cleanupQueue.schedule({
            job: CleanupJob.CHANGE_LOG,
            data: {
                expirationDate: now.getTime() - ms(this.changeLogRetentionTTL),
                event: `${CleanupJob.CHANGE_LOG}.${now.toISOString().slice(0, 10)}`,
                batchSize: this.batchSize,
                batch: 0,
            },
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM)
    public async scheduleInboxCleanup(): Promise<void> {
        const now = new Date();
        await this.cleanupQueue.schedule({
            job: CleanupJob.INBOX,
            data: {
                expirationDate: now.getTime() - ms(this.inboxRetentionTTL),
                event: `${CleanupJob.INBOX}.${now.toISOString().slice(0, 10)}`,
                batchSize: this.batchSize,
                batch: 0,
            },
        });
    }

    @Cron(CronExpression.EVERY_HOUR)
    public async scheduleExpiredAccessRecords(): Promise<void> {
        const now = new Date();
        await this.cleanupQueue.schedule({
            job: CleanupJob.EXPIRED_ACCESS_RECORDS,
            data: {
                expirationDate: now.getTime(),
                event: `${CleanupJob.EXPIRED_ACCESS_RECORDS}.${now.toISOString().slice(0, 13)}`,
                batchSize: this.batchSize,
                batch: 0,
            },
        });
    }
}
