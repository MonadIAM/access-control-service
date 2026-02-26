import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

@Injectable()
export class PermissionCacheInvalidationQueue implements Queues.PermissionInvalidation.Contract {
    public constructor(
        @InjectQueue("permission-cache-invalidation")
        private readonly queue: Queue,
    ) {}

    public async add({ accounts }: Queues.PermissionInvalidation.Add): Promise<void> {
        await this.queue.add(
            "invalidate",
            { accounts },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );
    }
}
