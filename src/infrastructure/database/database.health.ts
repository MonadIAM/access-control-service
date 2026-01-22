import { Injectable } from "@nestjs/common";
import { HealthIndicatorService, HealthIndicatorResult } from "@nestjs/terminus";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

@Injectable()
export class DatabaseHealthIndicator {
    public constructor(
        @InjectEntityManager("global") private readonly entityManager: EntityManager,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    public async isHealthy<T extends string>(key: T): Promise<HealthIndicatorResult<T>> {
        const indicator = this.healthIndicatorService.check(key);

        try {
            const isConnected = await this.entityManager.getConnection().isConnected();
            if (isConnected) {
                await this.entityManager.getConnection().execute("SELECT 1");
                return indicator.up();
            } else {
                return indicator.down({ message: "Connection lost" });
            }
        } catch (error) {
            return indicator.down({
                message: error instanceof Error ? error.message : "Unknown database error",
            });
        }
    }
}
