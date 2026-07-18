import { Cron, CronExpression } from "@nestjs/schedule";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { CLEANUP_QUEUE } from "~context/infrastructure/queues";
import { CleanupJob } from "~context/enums";

@Injectable()
export class CleanupScheduler {
    private readonly auditLogRetentionTTL: StringValue;
    private readonly changeLogRetentionTTL: StringValue;
    private readonly batchSize: number;

    public constructor(
        @Inject(CLEANUP_QUEUE)
        private readonly cleanupQueue: Queues.Cleanup.Contract,
        private readonly configService: ConfigService,
    ) {
        this.changeLogRetentionTTL = this.configService.getOrThrow<StringValue>("CHANGE_LOG_RETENTION_TTL");
        this.auditLogRetentionTTL = this.configService.getOrThrow<StringValue>("AUDIT_LOG_RETENTION_TTL");
        this.batchSize = this.configService.getOrThrow<number>("CLEANUP_BATCH_SIZE");
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    public async scheduleAuditLogCleanup(): Promise<void> {
        await this.cleanupQueue.schedule(CleanupJob.AUDIT_LOG, {
            olderThanMs: ms(this.auditLogRetentionTTL),
            batchSize: this.batchSize,
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    public async scheduleChangeLogCleanup(): Promise<void> {
        await this.cleanupQueue.schedule(CleanupJob.CHANGE_LOG, {
            olderThanMs: ms(this.changeLogRetentionTTL),
            batchSize: this.batchSize,
        });
    }
}
