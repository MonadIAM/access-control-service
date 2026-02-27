import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job, Queue } from "bullmq";

import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services";

@Injectable()
@Processor("permission-cache-invalidation")
export class PermissionCacheInvalidationProcessor extends WorkerHost {
    private readonly logger = new Logger(PermissionCacheInvalidationProcessor.name);
    private readonly chunkSize: number;

    public constructor(
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: Services.PermissionCache.Contract,
        @InjectQueue("permission-cache-invalidation")
        private readonly queue: Queue,
        private readonly configService: ConfigService,
    ) {
        super();
        this.chunkSize = this.configService.getOrThrow<number>("PERMISSION_CACHE_INVALIDATION_CHUNK_SIZE");
    }

    public async process(
        job: Job<Processors.PermissionInvalidation.Props>,
    ): Promise<Processors.PermissionInvalidation.Result> {
        const { accounts, offset = 0 } = job.data;
        const chunk = accounts.slice(offset, offset + this.chunkSize);

        if (chunk.length) {
            try {
                await this.permissionCacheService.invalidate({ accounts: chunk });

                const nextOffset = offset + this.chunkSize;

                if (nextOffset < accounts.length) {
                    await this.queue.add(
                        "invalidate",
                        { accounts, offset: nextOffset },
                        {
                            attempts: 3,
                            backoff: { type: "exponential", delay: 1000 },
                            removeOnComplete: true,
                            removeOnFail: false,
                        },
                    );
                }

                return { invalidated: chunk.length };
            } catch (error) {
                this.logger.error(`Failed to invalidate chunk at offset ${offset}`, error);
                throw error;
            }
        } else {
            return { invalidated: 0 };
        }
    }
}
